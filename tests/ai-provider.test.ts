import assert from "node:assert/strict";
import test from "node:test";
import {
  AiProviderError,
  generateDocumentsWithProvider,
  readAiProviderConfig,
} from "../lib/ai-provider";
import { generateDocuments, generatorSystemPrompt } from "../lib/generator";
import { parseSkillsCatalog, snapshotCatalog } from "../lib/skills";
import { validGenerateRequest } from "./fixtures";

const providerEnv = {
  ANYMD_AI_BASE_URL: "https://router.example.test/",
  ANYMD_AI_API_VERSION: "/v1/",
  ANYMD_AI_MODEL_ID: "unit-test-model-id",
  ANYMD_AI_API_KEY: "unit-test-provider-key",
};
const selectedSkills = parseSkillsCatalog(snapshotCatalog).skills.filter(({ id }) =>
  validGenerateRequest.selectedSkillIds.includes(id),
);
const generatedAt = "2026-09-18T12:00:00.000Z";
const generatedBundle = generateDocuments(
  validGenerateRequest,
  selectedSkills,
  generatedAt,
);

function hasProviderCode(code: AiProviderError["code"]) {
  return (error: unknown) =>
    error instanceof AiProviderError && error.code === code;
}

test("reads and normalizes server-only AI provider configuration", () => {
  assert.deepEqual(readAiProviderConfig(providerEnv), {
    baseUrl: "https://router.example.test",
    apiVersion: "v1",
    modelId: "unit-test-model-id",
    apiKey: "unit-test-provider-key",
    retryDelayMs: 60_000,
  });
  assert.throws(
    () => readAiProviderConfig({ ...providerEnv, ANYMD_AI_API_KEY: "" }),
    hasProviderCode("NOT_CONFIGURED"),
  );
  assert.throws(
    () =>
      readAiProviderConfig({
        ...providerEnv,
        ANYMD_AI_RETRY_DELAY_MS: "not-a-number",
      }),
    hasProviderCode("NOT_CONFIGURED"),
  );
  assert.throws(
    () =>
      readAiProviderConfig({
        ...providerEnv,
        ANYMD_AI_BASE_URL: "file:///tmp/provider",
      }),
    hasProviderCode("NOT_CONFIGURED"),
  );
});

test("calls the OpenAI-compatible Chat Completions endpoint and validates its bundle", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      `${JSON.stringify({
        choices: [{ message: { content: JSON.stringify(generatedBundle) } }],
      })}\ndata: [DONE]\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    );
  };

  const result = await generateDocumentsWithProvider(
    validGenerateRequest,
    selectedSkills,
    generatedAt,
    { env: providerEnv, fetch: fakeFetch, timeoutMs: 25 },
  );

  assert.deepEqual(result, generatedBundle);
  assert.equal(requestUrl, "https://router.example.test/v1/chat/completions");
  const headers = new Headers(requestInit?.headers);
  assert.equal(headers.get("authorization"), "Bearer unit-test-provider-key");
  assert.equal(headers.get("content-type"), "application/json");
  const body = JSON.parse(String(requestInit?.body));
  assert.equal(body.model, "unit-test-model-id");
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[0].content, generatorSystemPrompt);
  assert.equal(body.messages[1].role, "user");
  assert.match(body.messages[1].content, /2026-09-18T12:00:00\.000Z/);
  assert.match(body.messages[1].content, /frontend-design/);
  assert.match(body.messages[1].content, /templateBundle/);
  assert.match(body.messages[1].content, /document-header/);
  assert.ok(requestInit?.signal instanceof AbortSignal);
});

test("assembles a GeneratedBundle from forced SSE response chunks", async () => {
  const content = `\`\`\`json\n${JSON.stringify(generatedBundle)}\n\`\`\``;
  const splitAt = Math.floor(content.length / 2);
  const chunks = [content.slice(0, splitAt), content.slice(splitAt)];
  const fakeFetch: typeof fetch = async () =>
    new Response(
      [
        `data: ${JSON.stringify({
          choices: [{ delta: { role: "assistant" }, finish_reason: null }],
        })}`,
        ...chunks.map(
          (chunk) =>
            `data: ${JSON.stringify({
              choices: [{ delta: { content: chunk }, finish_reason: null }],
            })}`,
        ),
        `data: ${JSON.stringify({
          choices: [{ delta: {}, finish_reason: "stop" }],
        })}`,
      ].join("\n\n"),
      { headers: { "content-type": "text/event-stream" } },
    );

  const result = await generateDocumentsWithProvider(
    validGenerateRequest,
    selectedSkills,
    generatedAt,
    { env: providerEnv, fetch: fakeFetch },
  );

  assert.deepEqual(result, generatedBundle);
});

test("waits for the configured delay and retries one rate-limited request", async () => {
  let calls = 0;
  const delays: number[] = [];
  const fakeFetch: typeof fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response(null, { status: 429 });
    return Response.json({
      choices: [{ message: { content: JSON.stringify(generatedBundle) } }],
    });
  };

  const result = await generateDocumentsWithProvider(
    validGenerateRequest,
    selectedSkills,
    generatedAt,
    {
      env: { ...providerEnv, ANYMD_AI_RETRY_DELAY_MS: "1250" },
      fetch: fakeFetch,
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
    },
  );

  assert.deepEqual(result, generatedBundle);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1250]);
});

test("rejects provider failures and malformed model output", async () => {
  const rejectedFetch: typeof fetch = async () =>
    Response.json({ error: { message: "upstream rejected the request" } }, { status: 503 });
  await assert.rejects(
    generateDocumentsWithProvider(
      validGenerateRequest,
      selectedSkills,
      generatedAt,
      { env: providerEnv, fetch: rejectedFetch },
    ),
    hasProviderCode("REQUEST_FAILED"),
  );

  const malformedFetch: typeof fetch = async () =>
    Response.json({ choices: [{ message: { content: "{}" } }] });
  await assert.rejects(
    generateDocumentsWithProvider(
      validGenerateRequest,
      selectedSkills,
      generatedAt,
      { env: providerEnv, fetch: malformedFetch },
    ),
    hasProviderCode("INVALID_RESPONSE"),
  );
});
