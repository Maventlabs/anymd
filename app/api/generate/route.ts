import {
  GenerateValidationError,
  parseGenerateRequest,
} from "@/lib/generator";
import {
  AiProviderError,
  generateDocumentsWithProvider,
} from "@/lib/ai-provider";
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
  return handleGenerateRequest(request);
}
