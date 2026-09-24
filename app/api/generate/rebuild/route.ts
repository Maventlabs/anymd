import {
  GenerateValidationError,
  parseGenerateRequest,
  rebuildDocumentSection,
} from "@/lib/generator";
import { parseGeneratedBundle } from "@/lib/generated-documents";
import { loadSkillsCatalog } from "@/lib/skills";
import { GenerationQueueError } from "@/lib/generation-queue";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidRequest() {
  return Response.json(
    { error: { code: "INVALID_REQUEST", message: "The rebuild request is invalid." } },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  try {
    const rateLimit = await consumeRequestRateLimit(request, "rebuild");
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);
    let value: unknown;
    try {
      value = await request.json();
    } catch {
      return invalidRequest();
    }
    if (
      !isRecord(value) ||
      JSON.stringify(Object.keys(value).sort()) !==
        JSON.stringify(["bundle", "filename", "input", "sectionId"]) ||
      (value.filename !== "prd.md" && value.filename !== "AGENTS.md") ||
      typeof value.sectionId !== "string"
    )
      return invalidRequest();
    const input = parseGenerateRequest(value.input);
    const bundle = parseGeneratedBundle(value.bundle);
    if (
      !bundle ||
      bundle.documents.some(({ filename }) => filename === "CLAUDE.md") !==
        input.includeClaudeBridge
    )
      return invalidRequest();
    const target = bundle.documents.find(
      ({ filename }) => filename === value.filename,
    );
    if (!target?.sections.some(({ id }) => id === value.sectionId))
      return invalidRequest();
    const catalog = await loadSkillsCatalog();
    const selected = catalog.data.filter(({ id }) =>
      input.selectedSkillIds.includes(id),
    );
    if (selected.length !== input.selectedSkillIds.length)
      return Response.json(
        {
          error: {
            code: "UNKNOWN_SKILL",
            message: "One or more selected skills are no longer available.",
          },
        },
        { status: 400 },
      );
    return Response.json(
      rebuildDocumentSection(
        bundle,
        input,
        selected,
        value.filename,
        value.sectionId,
      ),
    );
  } catch (error) {
    if (error instanceof GenerationQueueError)
      return Response.json(
        { error: { code: error.code, message: "The rebuild request could not be accepted." } },
        { status: error.code === "IP_UNAVAILABLE" ? 400 : 503 },
      );
    if (error instanceof GenerateValidationError) return invalidRequest();
    return Response.json(
      {
        error: {
          code: "REBUILD_FAILED",
          message: "The document section could not be rebuilt.",
        },
      },
      { status: 500 },
    );
  }
}
