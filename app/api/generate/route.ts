import {
  GenerateValidationError,
  parseGenerateRequest,
} from "@/lib/generator";
import {
  AiProviderError,
  generateDocumentsWithProvider,
} from "@/lib/ai-provider";
import { auth } from "@/auth";
import { getServerEnv } from "@/lib/server-env";
import {
  clientIpHash,
  extractClientIp,
  GenerationQueueError,
} from "@/lib/generation-queue";
import {
  createGenerationJobRepository,
  parseQueueConfig,
  type GenerationJobRepository,
} from "@/lib/generation-jobs";
import { loadSkillsCatalog } from "@/lib/skills";

const publicErrors = {
  INVALID_REQUEST: "The generation request is invalid.",
  INCOMPLETE_CLARIFICATION:
    "Complete the visible clarification questions before generating.",
  INVALID_STACK: "One or more stack selections are invalid.",
  UNKNOWN_SKILL: "One or more selected skills are no longer available.",
} as const;

function errorResponse(code: keyof typeof publicErrors, status = 400) {
  return Response.json(
    { error: { code, message: publicErrors[code] } },
    { status },
  );
}

type QueueGenerateDependencies = {
  loadCatalog?: typeof loadSkillsCatalog;
  getSession?: () => Promise<{ user?: { id?: string } } | null>;
  createRepository?: () => GenerationJobRepository;
  getConfig?: typeof parseQueueConfig;
};

export async function handleGenerateRequest(
  request: Request,
  loadCatalog = loadSkillsCatalog,
  generateBundle = generateDocumentsWithProvider,
) {
  try {
    let value: unknown;
    try {
      value = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST");
    }
    const input = parseGenerateRequest(value);
    const catalog = await loadCatalog();
    const selected = catalog.data.filter(({ id }) =>
      input.selectedSkillIds.includes(id),
    );
    if (selected.length !== input.selectedSkillIds.length)
      return errorResponse("UNKNOWN_SKILL");
    return Response.json(
      await generateBundle(input, selected, new Date().toISOString()),
    );
  } catch (error) {
    if (error instanceof GenerateValidationError)
      return errorResponse(error.code);
    if (error instanceof AiProviderError)
      return Response.json(
        {
          error: {
            code: "GENERATION_FAILED",
            message: "The documents could not be generated.",
          },
        },
        { status: error.code === "NOT_CONFIGURED" ? 503 : 502 },
      );
    return Response.json(
      {
        error: {
          code: "GENERATION_FAILED",
          message: "The documents could not be generated.",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handleQueuedGenerateRequest(request);
}

export async function handleQueuedGenerateRequest(
  request: Request,
  dependencies: QueueGenerateDependencies = {},
) {
  try {
    let value: unknown;
    try {
      value = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST");
    }
    const input = parseGenerateRequest(value);
    const catalog = await (dependencies.loadCatalog ?? loadSkillsCatalog)();
    const selected = catalog.data.filter(({ id }) =>
      input.selectedSkillIds.includes(id),
    );
    if (selected.length !== input.selectedSkillIds.length)
      return errorResponse("UNKNOWN_SKILL");

    const session = await (dependencies.getSession ?? auth)();
    const userId = session?.user?.id ?? null;
    const repository =
      (dependencies.createRepository ?? createGenerationJobRepository)();
    const config = (dependencies.getConfig ?? parseQueueConfig)();
    let freeResult:
      | Awaited<ReturnType<GenerationJobRepository["enqueueFreeJob"]>>
      | undefined;
    try {
      const ip = extractClientIp(request, "x-forwarded-for");
      freeResult = await repository.enqueueFreeJob({
        ipHash: clientIpHash(ip, getServerEnv("ANYMD_IP_HASH_PEPPER") ?? ""),
        request: input,
        userId,
        config,
      });
    } catch (error) {
      if (
        !(error instanceof GenerationQueueError) ||
        error.code !== "IP_UNAVAILABLE" ||
        !userId
      )
        throw error;
    }

    if (freeResult?.accepted)
      return Response.json(
        {
          job: { id: freeResult.job.id, status: freeResult.job.status },
          billing: "free",
        },
        { status: 202 },
      );

    if (userId) {
      const paidResult = await repository.enqueuePaidJob({
        userId,
        request: input,
        amount: 1,
        config,
      });
      if (paidResult.accepted)
        return Response.json(
          {
            job: { id: paidResult.job.id, status: paidResult.job.status },
            billing: "token",
          },
          { status: 202 },
        );
    }

    if (!userId)
      return Response.json(
        {
          error: {
            code: "AUTH_REQUIRED",
            message: "Sign in to continue after the free generation is used.",
          },
        },
        { status: 401 },
      );

    return Response.json(
      {
        error: {
          code: "QUOTA_EXHAUSTED",
          message: "Your free generation is used and your token balance is empty.",
        },
      },
      { status: 429 },
    );
  } catch (error) {
    if (error instanceof GenerateValidationError)
      return errorResponse(error.code);
    if (error instanceof GenerationQueueError)
      return Response.json(
        {
          error: {
            code: error.code,
            message:
              error.code === "IP_UNAVAILABLE"
                ? "A client IP address is required to start free generation."
                : "Generation queue configuration is unavailable.",
          },
        },
        { status: error.code === "IP_UNAVAILABLE" ? 400 : 503 },
      );
    return Response.json(
      {
        error: {
          code: "GENERATION_FAILED",
          message: "The documents could not be queued.",
        },
      },
      { status: 500 },
    );
  }
}
