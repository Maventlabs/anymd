import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSkillInstructions,
  loadSkillsCatalog,
  parseSkillsCatalog,
  recommendSkillIds,
  snapshotCatalog,
  sortSkills,
  type SkillsCatalog,
} from "../lib/skills";
import { GET } from "../app/api/skills/route";

const validRemote: SkillsCatalog = {
  schemaVersion: 1,
  catalogVersion: "remote-test",
  updatedAt: "2026-09-16T00:00:00.000Z",
  skills: [
    {
      id: "remote-skill",
      name: "Remote Skill",
      description: "Use when testing a valid remote catalog.",
      category: "architecture-quality",
      sourceRepo: "example/skills",
      sourceUrl: "https://github.com/example/skills",
      priority: "standard",
    },
  ],
};

test("bundled snapshot contains the approved individual skills in four categories", () => {
  const parsed = parseSkillsCatalog(snapshotCatalog);
  assert.equal(parsed.skills.length, 25);
  assert.deepEqual(
    new Set(parsed.skills.map(({ category }) => category)),
    new Set([
      "architecture-quality",
      "ui-ux-design",
      "motion-3d",
      "research-content",
    ]),
  );
  assert.equal(new Set(parsed.skills.map(({ id }) => id)).size, 25);
  assert.ok(
    parsed.skills
      .filter(({ category }) => category === "architecture-quality")
      .every(({ priority }) => priority === "featured"),
  );
});

test("rejects malformed catalogs at the external boundary", () => {
  assert.throws(() => parseSkillsCatalog({ ...validRemote, schemaVersion: 2 }));
  assert.throws(() =>
    parseSkillsCatalog({
      ...validRemote,
      skills: [validRemote.skills[0], validRemote.skills[0]],
    }),
  );
  assert.throws(() =>
    parseSkillsCatalog({
      ...validRemote,
      skills: [{ ...validRemote.skills[0], category: "unknown" }],
    }),
  );
  assert.throws(() =>
    parseSkillsCatalog({
      ...validRemote,
      skills: [{ ...validRemote.skills[0], sourceUrl: "http://example.com" }],
    }),
  );
});

test("sorts by category, featured priority, then name", () => {
  const sorted = sortSkills([
    { ...validRemote.skills[0], id: "z", name: "Zulu" },
    {
      ...validRemote.skills[0],
      id: "ui",
      name: "UI",
      category: "ui-ux-design",
    },
    {
      ...validRemote.skills[0],
      id: "a",
      name: "Alpha",
      priority: "featured",
    },
  ]);
  assert.deepEqual(
    sorted.map(({ id }) => id),
    ["a", "z", "ui"],
  );
});

test("uses a valid remote catalog", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  process.env.ANYMD_SKILLS_CATALOG_URL = "https://catalog.example/skills.json";
  try {
    const result = await loadSkillsCatalog(async () =>
      Response.json(validRemote, { status: 200 }),
    );
    assert.equal(result.meta.source, "remote");
    assert.equal(result.meta.catalogVersion, "remote-test");
    assert.deepEqual(result.data.map(({ id }) => id), ["remote-skill"]);
    assert.equal(result.meta.fallbackReason, undefined);
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});

test("falls back to the snapshot for unavailable or invalid remote data", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  process.env.ANYMD_SKILLS_CATALOG_URL = "https://catalog.example/skills.json";
  try {
    const unavailable = await loadSkillsCatalog(async () =>
      Promise.reject(new Error("secret network detail")),
    );
    assert.equal(unavailable.meta.source, "snapshot");
    assert.equal(unavailable.meta.fallbackReason, "REMOTE_UNAVAILABLE");
    assert.equal(unavailable.data.length, 25);

    const invalid = await loadSkillsCatalog(async () =>
      Response.json({ ...validRemote, schemaVersion: 99 }),
    );
    assert.equal(invalid.meta.source, "snapshot");
    assert.equal(invalid.meta.fallbackReason, "INVALID_REMOTE_CATALOG");
    assert.equal(JSON.stringify(invalid).includes("secret network detail"), false);
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});

test("uses the reviewed snapshot when no remote catalog is configured", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  delete process.env.ANYMD_SKILLS_CATALOG_URL;
  try {
    const result = await loadSkillsCatalog(async () => {
      throw new Error("remote fetch should not run without explicit configuration");
    });
    assert.equal(result.meta.source, "snapshot");
    assert.equal(result.meta.fallbackReason, undefined);
    assert.equal(result.data.length, 25);
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});

test("formats installed-skill requirements without implying MCP access", () => {
  const markdown = formatSkillInstructions(validRemote.skills);
  assert.match(markdown, /Remote Skill/);
  assert.match(markdown, /MUST check whether each recommended skill is installed/);
  assert.match(markdown, /MUST load and follow/);
  assert.match(
    markdown,
    /MUST NOT treat a recommended skill as proof[\s\S]*MCP/,
  );
});

test("recommends skills automatically from project context", () => {
  const catalog = parseSkillsCatalog(snapshotCatalog).skills;
  const ids = recommendSkillIds(catalog, {
    idea: "A responsive web dashboard with animated charts and PDF reports.",
    stack: { Frontend: "Next.js" },
    answers: {
      platform: "Web",
      scope: "Build an accessible dashboard, animate charts, and export PDF reports.",
    },
  });

  assert.ok(ids.includes("planning-and-task-breakdown"));
  assert.ok(ids.includes("test-driven-development"));
  assert.ok(ids.includes("verification-before-completion"));
  assert.ok(ids.includes("frontend-design"));
  assert.ok(ids.includes("accessibility"));
  assert.ok(ids.includes("animate"));
  assert.ok(ids.includes("pdf"));
  assert.deepEqual(ids, catalog.filter(({ id }) => ids.includes(id)).map(({ id }) => id));
});

test("GET /api/skills returns the stable public response contract", async () => {
  const previous = process.env.ANYMD_SKILLS_CATALOG_URL;
  process.env.ANYMD_SKILLS_CATALOG_URL = `data:application/json,${encodeURIComponent(JSON.stringify(validRemote))}`;
  try {
    const response = await GET();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, {
      data: validRemote.skills,
      meta: {
        source: "remote",
        catalogVersion: "remote-test",
        updatedAt: "2026-09-16T00:00:00.000Z",
      },
    });
  } finally {
    if (previous === undefined) delete process.env.ANYMD_SKILLS_CATALOG_URL;
    else process.env.ANYMD_SKILLS_CATALOG_URL = previous;
  }
});
