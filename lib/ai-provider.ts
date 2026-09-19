import {
  generateDocuments,
  generatorSystemPrompt,
  type GenerateDocumentsRequest,
} from "@/lib/generator";
import {
  parseGeneratedBundle,
  type GeneratedBundle,
} from "@/lib/generated-documents";
import type { SkillCatalogEntry } from "@/lib/skills";
import { getServerEnvSnapshot } from "@/lib/server-env";

type ProviderEnv = Record<string, string | undefined>;

type AiProviderConfig = {
  baseUrl: string;
  apiVersion: string;
  modelId: string;
  apiKey: string;
  retryDelayMs: number;
};

type ProviderOptions = {
  env?: ProviderEnv;
  fetch?: typeof fetch;
  sleep?: (delayMs: number) => Promise<void>;
  timeoutMs?: number;
};

export class AiProviderError extends Error {
  constructor(
    public readonly code:
      | "NOT_CONFIGURED"
      | "REQUEST_FAILED"
      | "INVALID_RESPONSE",
  ) {
    super(code);
    this.name = "AiProviderError";
  }
}

function required(env: ProviderEnv, key: string) {
  const value = env[key]?.trim();
  if (!value) throw new AiProviderError("NOT_CONFIGURED");
  return value;
}

export function readAiProviderConfig(
  env: ProviderEnv = getServerEnvSnapshot(),
): AiProviderConfig {
  const rawBaseUrl = required(env, "ANYMD_AI_BASE_URL");
  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new AiProviderError("NOT_CONFIGURED");
  }
  if (!['http:', 'https:'].includes(baseUrl.protocol))
    throw new AiProviderError("NOT_CONFIGURED");
  const retryDelayMs = Number(env.ANYMD_AI_RETRY_DELAY_MS?.trim() || "60000");
  if (
    !Number.isInteger(retryDelayMs) ||
    retryDelayMs < 0 ||
    retryDelayMs > 300_000
  )
    throw new AiProviderError("NOT_CONFIGURED");

  return {
    baseUrl: rawBaseUrl.replace(/\/+$/u, ""),
    apiVersion: required(env, "ANYMD_AI_API_VERSION").replace(/^\/+|\/+$/gu, ""),
    modelId: required(env, "ANYMD_AI_MODEL_ID"),
    apiKey: required(env, "ANYMD_AI_API_KEY"),
    retryDelayMs,
  };
}

function providerPrompt(
  input: GenerateDocumentsRequest,
  selectedSkills: SkillCatalogEntry[],
  generatedAt: string,
) {
  const templateBundle = generateDocuments(input, selectedSkills, generatedAt);
  return `Return only valid JSON for one GeneratedBundle object with exactly these top-level keys: documents, generatedAt, generatorVersion.
Set generatorVersion to 1 and generatedAt to ${JSON.stringify(generatedAt)}.
Each document must contain exactly filename, sections, and markdown. Each section must contain exactly id, title, and markdown. The full markdown must equal the sections joined by "\\n\\n---\\n\\n" plus one final newline. If CLAUDE.md is requested, it must contain only @AGENTS.md followed by a newline.
Refine the templateBundle content while preserving every filename, section ID, section order, and wrapper field exactly. Use the validated input and selectedSkills as the only product facts:
${JSON.stringify({ input, selectedSkills, templateBundle })}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function messageContent(payload: unknown) {
  const choices = isRecord(payload) ? payload.choices : undefined;
  const first = Array.isArray(choices) ? choices[0] : undefined;
  const message = isRecord(first) ? first.message : undefined;
  const content = isRecord(message) ? message.content : undefined;
  return typeof content === "string" ? content : undefined;
}

function parseProviderContent(raw: string) {
  const withoutDone = raw.replace(/\r?\ndata: \[DONE\]\s*$/u, "").trim();
  try {
    const payload = JSON.parse(
      withoutDone.startsWith("data: ")
        ? withoutDone.slice("data: ".length).trim()
        : withoutDone,
    );
    const content = messageContent(payload);
    if (content) return content;
  } catch {
    // Some 9router models force SSE even when the request is non-streaming.
  }

  let content = "";
  let sawChunk = false;
  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "data: [DONE]") continue;
    if (!trimmed.startsWith("data: ")) return undefined;
    let payload: unknown;
    try {
      payload = JSON.parse(trimmed.slice("data: ".length));
    } catch {
      return undefined;
    }
    const choices = isRecord(payload) ? payload.choices : undefined;
    const first = Array.isArray(choices) ? choices[0] : undefined;
    const delta = isRecord(first) ? first.delta : undefined;
    const chunk = isRecord(delta) ? delta.content : undefined;
    if (typeof chunk === "string") content += chunk;
    sawChunk = true;
  }
  return sawChunk ? content : undefined;
}

export async function generateDocumentsWithProvider(
  input: GenerateDocumentsRequest,
  selectedSkills: SkillCatalogEntry[],
  generatedAt: string,
  options: ProviderOptions = {},
): Promise<GeneratedBundle> {
  const config = readAiProviderConfig(options.env);
  const requestFetch = options.fetch ?? fetch;
  const sleep =
    options.sleep ??
    ((delayMs: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  let response: Response;
  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await requestFetch(
        `${config.baseUrl}/${config.apiVersion}/chat/completions`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: config.modelId,
            messages: [
              { role: "system", content: generatorSystemPrompt },
              {
                role: "user",
                content: providerPrompt(input, selectedSkills, generatedAt),
              },
            ],
          }),
          signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
        },
      );
    } catch {
      throw new AiProviderError("REQUEST_FAILED");
    }
    if (response.status !== 429 || attempt === 1) break;
    await sleep(config.retryDelayMs);
  }
  if (!response.ok) throw new AiProviderError("REQUEST_FAILED");

  let content: string | undefined;
  try {
    content = parseProviderContent(await response.text());
  } catch {
    throw new AiProviderError("INVALID_RESPONSE");
  }
  if (typeof content !== "string")
    throw new AiProviderError("INVALID_RESPONSE");

  let parsed: unknown;
  try {
    const trimmed = content.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/iu);
    parsed = JSON.parse(fenced ? fenced[1] : trimmed);
  } catch {
    throw new AiProviderError("INVALID_RESPONSE");
  }
  const bundle = parseGeneratedBundle(parsed);
  if (!bundle || bundle.generatedAt !== generatedAt)
    throw new AiProviderError("INVALID_RESPONSE");
  return bundle;
}
