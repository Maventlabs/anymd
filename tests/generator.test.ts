import assert from "node:assert/strict";
import test from "node:test";
import {
  GenerateValidationError,
  generateDocuments,
  generatorSystemPrompt,
  parseGenerateRequest,
  rebuildDocumentSection,
} from "../lib/generator";
import { parseSkillsCatalog, snapshotCatalog } from "../lib/skills";
import {
  handleGenerateRequest,
  handleQueuedGenerateRequest,
  POST,
} from "../app/api/generate/route";
import type { GenerationJobRepository } from "../lib/generation-jobs";
import { POST as REBUILD } from "../app/api/generate/rebuild/route";
import {
  parseGeneratedBundle,
  renderDocumentMarkdown,
} from "../lib/generated-documents";
import { validGenerateRequest } from "./fixtures";

process.env.ANYMD_IP_HASH_PEPPER ??= "unit-test-ip-hash-pepper";

function hasCode(code: GenerateValidationError["code"]) {
  return (error: unknown) =>
    error instanceof GenerateValidationError && error.code === code;
}

test("parses and normalizes a complete generator request", () => {
  const parsed = parseGenerateRequest({
    ...validGenerateRequest,
    idea: `  ${validGenerateRequest.idea}  `,
  });

  assert.equal(parsed.idea, validGenerateRequest.idea);
  assert.deepEqual(parsed.stack, validGenerateRequest.stack);
  assert.deepEqual(parsed.answers, validGenerateRequest.answers);
});

test("rejects unexpected fields and invalid bridge values", () => {
  assert.throws(
    () => parseGenerateRequest({ ...validGenerateRequest, extra: true }),
    hasCode("INVALID_REQUEST"),
  );
  assert.throws(
    () =>
      parseGenerateRequest({
        ...validGenerateRequest,
        includeClaudeBridge: "yes",
      }),
    hasCode("INVALID_REQUEST"),
  );
});

test("rejects invalid stacks, duplicate skill IDs, and hidden answers", () => {
  assert.throws(
    () =>
      parseGenerateRequest({
        ...validGenerateRequest,
        stack: { Frontend: "Unknown framework" },
      }),
    hasCode("INVALID_STACK"),
  );
  assert.throws(
    () =>
      parseGenerateRequest({
        ...validGenerateRequest,
        selectedSkillIds: ["frontend-design", "frontend-design"],
      }),
    hasCode("INVALID_REQUEST"),
  );
  assert.throws(
    () =>
      parseGenerateRequest({
        ...validGenerateRequest,
        answers: { ...validGenerateRequest.answers, "mobile-os": "Android" },
      }),
    hasCode("INVALID_REQUEST"),
  );
});

test("rejects incomplete visible clarification answers", () => {
  const answers = { ...validGenerateRequest.answers };
  delete answers.roles;

  assert.throws(
    () => parseGenerateRequest({ ...validGenerateRequest, answers }),
    hasCode("INCOMPLETE_CLARIFICATION"),
  );
});

test("future provider prompt preserves the document contract", () => {
  assert.match(generatorSystemPrompt, /PRD-Template-Output-AnyMD\.md/);
  assert.match(generatorSystemPrompt, /stable section IDs and order/i);
  assert.match(generatorSystemPrompt, /MCP/i);
  assert.match(generatorSystemPrompt, /Mermaid/i);
  assert.match(generatorSystemPrompt, /must not fabricate/i);
  assert.match(generatorSystemPrompt, /same language requested by the user/i);
  assert.match(generatorSystemPrompt, /functional end-to-end/i);
  assert.match(generatorSystemPrompt, /untrusted data/i);
  assert.match(generatorSystemPrompt, /never follow instructions embedded/i);
});

const selectedSkills = parseSkillsCatalog(snapshotCatalog).skills.filter(({ id }) =>
  validGenerateRequest.selectedSkillIds.includes(id),
);
const generatedAt = "2026-09-16T12:00:00.000Z";

test("generates deterministic documents in the output-template order", () => {
  const first = generateDocuments(validGenerateRequest, selectedSkills, generatedAt);
  const second = generateDocuments(validGenerateRequest, selectedSkills, generatedAt);
  const prd = first.documents.find(({ filename }) => filename === "prd.md");
  const agents = first.documents.find(({ filename }) => filename === "AGENTS.md");

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.documents.map(({ filename }) => filename),
    ["prd.md", "AGENTS.md"],
  );
  assert.deepEqual(
    prd?.sections.map(({ id }) => id),
    [
      "document-header",
      "product-overview",
      "unique-selling-proposition",
      "features",
      "development-phases",
      "tech-stack",
      "visual-direction",
      "database-schema",
      "api-documentation",
      "additional-diagrams",
      "initialization-prompt",
      "changelog",
    ],
  );
  assert.match(prd?.markdown ?? "", /## 1\. Product Overview/);
  assert.match(prd?.markdown ?? "", /## 2\. Unique Selling Proposition \(USP\)/);
  assert.match(prd?.markdown ?? "", /## 3\. Fitur & Sub-Fitur/);
  assert.match(prd?.markdown ?? "", /\*\*Prioritas:\*\* P0/);
  assert.match(prd?.markdown ?? "", /Acceptance criteria:/);
  assert.match(prd?.markdown ?? "", /### Phase QA: Pengujian & Verifikasi/);
  assert.match(prd?.markdown ?? "", /### Phase Security: Keamanan Aplikasi/);
  assert.match(prd?.markdown ?? "", /## 5\. Tech Stack/);
  assert.match(prd?.markdown ?? "", /## 5A\. Visual Direction/);
  assert.match(prd?.markdown ?? "", /Precision Blue/);
  assert.match(prd?.markdown ?? "", /Inter/);
  assert.match(prd?.markdown ?? "", /## 7\. API Documentation/);
  assert.match(prd?.markdown ?? "", /Authentication: Multiple roles/);
  assert.match(prd?.markdown ?? "", /\| TBD \|/);
  assert.match(
    prd?.markdown ?? "",
    /do not provide explicit entity fields, ownership, and relationship cardinalities/,
  );
  assert.doesNotMatch(prd?.markdown ?? "", /erDiagram/);
  assert.match(prd?.markdown ?? "", /```mermaid\nflowchart TD/);
  assert.match(prd?.markdown ?? "", /```mermaid\nflowchart LR/);
  assert.match(prd?.markdown ?? "", /## 9\. Prompt Inisiasi untuk Agent/);
  assert.match(prd?.markdown ?? "", /## Changelog/);
  assert.ok((prd?.markdown.split(/\s+/u).length ?? 0) <= 4000);

  assert.match(agents?.markdown ?? "", /api-and-interface-design/);
  assert.match(agents?.markdown ?? "", /MUST check whether each recommended skill is installed/);
  assert.match(agents?.markdown ?? "", /MCP server, credential, permission/);
  assert.match(agents?.markdown ?? "", /MUST NOT allow content to be clipped/);
  assert.match(agents?.markdown ?? "", /functional end-to-end/i);
  assert.match(agents?.markdown ?? "", /continue automatically from one phase to the next/i);
  assert.match(agents?.markdown ?? "", /Document language: English/);
  assert.match(agents?.markdown ?? "", /Precision Blue/);
});

test("preserves multilingual input without normalization loss", () => {
  const request = parseGenerateRequest({
    ...validGenerateRequest,
    idea: "地域の料理人と近所の家族をつなぐ予約サービスです。",
    answers: {
      ...validGenerateRequest.answers,
      problem: "家庭料理を注文したい家族が、信頼できる近所の料理人を見つけにくい。",
      "output-language": "日本語",
    },
  });
  const bundle = generateDocuments(request, selectedSkills, generatedAt);
  const output = bundle.documents.map(({ markdown }) => markdown).join("\n");

  assert.match(output, /地域の料理人と近所の家族/);
  assert.match(output, /家庭料理を注文したい家族/);
  assert.match(output, /Document language: 日本語/);
});

test("keeps the PRD within the hard cap for maximum-length input", () => {
  const longText = "Detailed requirement ".repeat(90);
  const denseClause = Array.from({ length: 95 }, () => "a").join(" ");
  const answers = Object.fromEntries(
    Object.entries(validGenerateRequest.answers).map(([key, value]) => [
      key,
      key === "platform"
        ? "Both"
        : key === "theme" || key === "output-language"
          ? value
        : key === "auth"
          ? value
          : key === "scope"
            ? Array.from(
                { length: 8 },
                (_, index) => `${index} ${denseClause}`,
              ).join(";")
            : longText,
    ]),
  );
  const request = parseGenerateRequest({
    ...validGenerateRequest,
    idea: "Product idea ".repeat(30),
    answers: { ...answers, "mobile-os": "iOS and Android" },
  });
  const prd = generateDocuments(request, selectedSkills, generatedAt).documents.find(
    ({ filename }) => filename === "prd.md",
  );

  const wordCount = prd?.markdown.trim().split(/\s+/u).length ?? 0;
  assert.ok(wordCount >= 1800);
  assert.ok(wordCount <= 4000);
});

test("places every accepted clarification field and undecided stack category", () => {
  const request = parseGenerateRequest({
    ...validGenerateRequest,
    answers: {
      ...validGenerateRequest.answers,
      platform: "Both",
      "mobile-os": "iOS and Android",
    },
  });
  const bundle = generateDocuments(request, selectedSkills, generatedAt);
  const prd = bundle.documents.find(({ filename }) => filename === "prd.md")!;
  const agents = bundle.documents.find(({ filename }) => filename === "AGENTS.md")!;

  assert.match(prd.markdown, /Platform: Both/);
  assert.match(prd.markdown, /Current Chrome, Safari, Firefox/);
  assert.match(prd.markdown, /Mobile operating systems: iOS and Android/);
  assert.match(prd.markdown, /deploy cleanly on Vercel/);
  assert.match(agents.markdown, /Platform: Both/);
  assert.match(agents.markdown, /Mobile operating systems: iOS and Android/);
  assert.match(agents.markdown, /\*\*Payments:\*\* Undecided/);
  assert.match(agents.markdown, /deploy cleanly on Vercel/);
});

test("supports zero skills and an exact opt-in Claude bridge", () => {
  const bundle = generateDocuments(
    { ...validGenerateRequest, selectedSkillIds: [], includeClaudeBridge: true },
    [],
    generatedAt,
  );
  const agents = bundle.documents.find(({ filename }) => filename === "AGENTS.md");
  const bridge = bundle.documents.find(({ filename }) => filename === "CLAUDE.md");

  assert.doesNotMatch(agents?.markdown ?? "", /## Automatically recommended skills/);
  assert.equal(bridge?.markdown, "@AGENTS.md\n");
});

test("rebuilds only the requested section and preserves document structure", () => {
  const initial = generateDocuments(validGenerateRequest, selectedSkills, generatedAt);
  const changed = {
    ...validGenerateRequest,
    answers: {
      ...validGenerateRequest.answers,
      problem:
        "Clients cannot see which milestone decision is current or who approved it.",
    },
  };
  const rebuilt = rebuildDocumentSection(
    initial,
    changed,
    selectedSkills,
    "prd.md",
    "product-overview",
  );
  const beforePrd = initial.documents.find(({ filename }) => filename === "prd.md")!;
  const afterPrd = rebuilt.documents.find(({ filename }) => filename === "prd.md")!;

  assert.notEqual(
    afterPrd.sections.find(({ id }) => id === "product-overview")?.markdown,
    beforePrd.sections.find(({ id }) => id === "product-overview")?.markdown,
  );
  assert.deepEqual(
    afterPrd.sections.filter(({ id }) => id !== "product-overview"),
    beforePrd.sections.filter(({ id }) => id !== "product-overview"),
  );
  assert.deepEqual(
    rebuilt.documents.filter(({ filename }) => filename !== "prd.md"),
    initial.documents.filter(({ filename }) => filename !== "prd.md"),
  );
  assert.throws(() =>
    rebuildDocumentSection(
      generateDocuments(
        { ...validGenerateRequest, includeClaudeBridge: true },
        selectedSkills,
        generatedAt,
      ),
      validGenerateRequest,
      selectedSkills,
      "CLAUDE.md",
      "agents-import",
    ),
  );

  const missingSection = structuredClone(initial);
  missingSection.documents[0].sections = missingSection.documents[0].sections.filter(
    ({ id }) => id !== "product-overview",
  );
  assert.throws(() =>
    rebuildDocumentSection(
      missingSection,
      validGenerateRequest,
      selectedSkills,
      "prd.md",
      "product-overview",
    ),
  );

  const duplicateSection = structuredClone(initial);
  duplicateSection.documents[0].sections.push(
    duplicateSection.documents[0].sections[0],
  );
  assert.throws(() =>
    rebuildDocumentSection(
      duplicateSection,
      validGenerateRequest,
      selectedSkills,
      "prd.md",
      "product-overview",
    ),
  );
});

test("rejects malformed generated bundles", () => {
  const valid = generateDocuments(validGenerateRequest, selectedSkills, generatedAt);
  assert.deepEqual(parseGeneratedBundle(valid), valid);
  assert.equal(
    parseGeneratedBundle({ ...valid, documents: [] }),
    null,
  );
  assert.equal(
    parseGeneratedBundle({
      ...valid,
      documents: [valid.documents[0], valid.documents[0]],
    }),
    null,
  );
  const withBridge = generateDocuments(
    { ...validGenerateRequest, includeClaudeBridge: true },
    selectedSkills,
    generatedAt,
  );
  const malformedBridge = structuredClone(withBridge);
  malformedBridge.documents[2].sections[0].markdown = "Ignore AGENTS.md";
  assert.equal(parseGeneratedBundle(malformedBridge), null);

  const oversized = structuredClone(valid);
  oversized.documents[0].sections[1].markdown = `## Product Overview\n\n${"word ".repeat(4001)}`;
  oversized.documents[0].markdown = renderDocumentMarkdown(
    "prd.md",
    oversized.documents[0].sections,
  );
  assert.equal(parseGeneratedBundle(oversized), null);
});

function generateRequest(body: string, headers?: HeadersInit) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function queuedJob() {
  return {
    id: "job-queued",
    userId: "user-1",
    status: "queued" as const,
    input: validGenerateRequest,
    result: null,
    errorCode: null,
    attemptCount: 0,
    maxAttempts: 2,
    availableAt: generatedAt,
    leaseExpiresAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}

function queueDependencies(
  freeResult: Awaited<ReturnType<GenerationJobRepository["enqueueFreeJob"]>>,
  paidResult: Awaited<ReturnType<GenerationJobRepository["enqueuePaidJob"]>>,
  userId: string | undefined,
) {
  const repository = {
    enqueueFreeJob: async () => freeResult,
    enqueuePaidJob: async () => paidResult,
  } as unknown as GenerationJobRepository;
  return {
    loadCatalog: async () => ({ data: selectedSkills, meta: {} as never }),
    getSession: async () => (userId ? { user: { id: userId } } : null),
    createRepository: () => repository,
    getConfig: () => ({
      maxAttempts: 2,
      leaseMs: 120_000,
      retryDelayMs: 1_000,
      timeoutMs: 60_000,
      ratePerMinute: 15,
    }),
    consumeRateLimit: async () => ({
      allowed: true,
      retryAfterSeconds: 0,
    }),
  };
}

test("queued generation uses the free quota when it is available", async () => {
  const response = await handleQueuedGenerateRequest(
    generateRequest(JSON.stringify(validGenerateRequest), {
      "x-forwarded-for": "203.0.113.8",
    }),
    queueDependencies({ accepted: true, job: queuedJob() }, { accepted: false, reason: "INSUFFICIENT_BALANCE" }, "user-1"),
  );

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    job: { id: "job-queued", status: "queued" },
    billing: "free",
  });
});

test("queued generation falls back to a token after the free quota is used", async () => {
  const response = await handleQueuedGenerateRequest(
    generateRequest(JSON.stringify(validGenerateRequest), {
      "x-forwarded-for": "203.0.113.8",
    }),
    queueDependencies({ accepted: false, reason: "QUOTA_EXHAUSTED" }, { accepted: true, job: queuedJob() }, "user-1"),
  );

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    job: { id: "job-queued", status: "queued" },
    billing: "token",
  });
});

test("queued generation returns a sign-in recovery state for anonymous exhausted quota", async () => {
  const response = await handleQueuedGenerateRequest(
    generateRequest(JSON.stringify(validGenerateRequest), {
      "x-forwarded-for": "203.0.113.8",
    }),
    queueDependencies({ accepted: false, reason: "QUOTA_EXHAUSTED" }, { accepted: false, reason: "INSUFFICIENT_BALANCE" }, undefined),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: {
      code: "AUTH_REQUIRED",
      message: "Sign in to continue after the free generation is used.",
    },
  });
});

test("POST /api/generate returns the stable document bundle", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  process.env.ANYMD_SKILLS_CATALOG_URL = `data:application/json,${encodeURIComponent(JSON.stringify(snapshotCatalog))}`;
  try {
    const response = await handleGenerateRequest(
      generateRequest(JSON.stringify(validGenerateRequest)),
      undefined,
      async (input, skills, timestamp) =>
        generateDocuments(input, skills, timestamp),
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.generatorVersion, 1);
    assert.deepEqual(
      body.documents.map(({ filename }: { filename: string }) => filename),
      ["prd.md", "AGENTS.md"],
    );
    assert.equal(typeof body.generatedAt, "string");
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});

test("POST /api/generate returns stable public validation errors", async () => {
  const malformed = await POST(generateRequest("{"));
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), {
    error: { code: "INVALID_REQUEST", message: "The generation request is invalid." },
  });

  const answers = { ...validGenerateRequest.answers };
  delete answers.problem;
  const incomplete = await POST(
    generateRequest(JSON.stringify({ ...validGenerateRequest, answers })),
  );
  assert.equal(incomplete.status, 400);
  assert.deepEqual(await incomplete.json(), {
    error: {
      code: "INCOMPLETE_CLARIFICATION",
      message: "Complete the visible clarification questions before generating.",
    },
  });

  const invalidStack = await POST(
    generateRequest(
      JSON.stringify({
        ...validGenerateRequest,
        stack: { ...validGenerateRequest.stack, Frontend: "Unknown framework" },
      }),
    ),
  );
  assert.equal(invalidStack.status, 400);
  assert.deepEqual(await invalidStack.json(), {
    error: {
      code: "INVALID_STACK",
      message: "One or more stack selections are invalid.",
    },
  });
});

test("POST /api/generate rejects skill IDs missing from the server catalog", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  process.env.ANYMD_SKILLS_CATALOG_URL = `data:application/json,${encodeURIComponent(JSON.stringify(snapshotCatalog))}`;
  try {
    const response = await POST(
      generateRequest(
        JSON.stringify({
          ...validGenerateRequest,
          selectedSkillIds: ["missing-skill"],
        }),
      ),
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      error: {
        code: "UNKNOWN_SKILL",
        message: "One or more selected skills are no longer available.",
      },
    });
    assert.doesNotMatch(JSON.stringify(body), /github|fetch|stack|exception/iu);
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});

test("POST /api/generate hides unexpected internal failures", async () => {
  const response = await handleGenerateRequest(
    generateRequest(JSON.stringify(validGenerateRequest)),
    async () => {
      throw new Error("sensitive internal catalog failure");
    },
  );
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    error: {
      code: "GENERATION_FAILED",
      message: "The documents could not be generated.",
    },
  });
  assert.doesNotMatch(JSON.stringify(body), /catalog|fetch|stack|exception/iu);
});

test("POST /api/generate/rebuild preserves the bundle timestamp and non-target sections", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  process.env.ANYMD_SKILLS_CATALOG_URL = `data:application/json,${encodeURIComponent(JSON.stringify(snapshotCatalog))}`;
  try {
    const initial = generateDocuments(validGenerateRequest, selectedSkills, generatedAt);
    const response = await REBUILD(
      generateRequest(
        JSON.stringify({
          input: validGenerateRequest,
          bundle: initial,
          filename: "prd.md",
          sectionId: "product-overview",
        }),
      ),
    );
    const rebuilt = await response.json();

    assert.equal(response.status, 200);
    assert.equal(rebuilt.generatedAt, initial.generatedAt);
    assert.deepEqual(rebuilt, initial);

    const unknownSection = await REBUILD(
      generateRequest(
        JSON.stringify({
          input: validGenerateRequest,
          bundle: initial,
          filename: "prd.md",
          sectionId: "missing-section",
        }),
      ),
    );
    assert.equal(unknownSection.status, 400);
    assert.deepEqual(await unknownSection.json(), {
      error: {
        code: "INVALID_REQUEST",
        message: "The rebuild request is invalid.",
      },
    });
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});
