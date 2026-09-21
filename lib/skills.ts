import rawSnapshot from "@/data/skills.snapshot.json";
import type { Answers } from "@/lib/clarification";
import type { Stack } from "@/lib/idea";

export const skillCategories = [
  "architecture-quality",
  "ui-ux-design",
  "motion-3d",
  "research-content",
] as const;

export type SkillCategory = (typeof skillCategories)[number];
export type SkillCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  sourceRepo: string;
  sourceUrl: string;
  priority: "featured" | "standard";
};
export type SkillsCatalog = {
  schemaVersion: 1;
  catalogVersion: string;
  updatedAt: string;
  skills: SkillCatalogEntry[];
};
export type CatalogResult = {
  data: SkillCatalogEntry[];
  meta: {
    source: "remote" | "snapshot";
    catalogVersion: string;
    updatedAt: string;
    fallbackReason?: "REMOTE_UNAVAILABLE" | "INVALID_REMOTE_CATALOG";
  };
};

type SkillRecommendationContext = {
  idea: string;
  stack: Stack;
  answers: Answers;
};

type CatalogFetch = (
  input: string | URL | Request,
  init?: RequestInit & { next?: { revalidate: number } },
) => Promise<Response>;

const categoryIndex = new Map(
  skillCategories.map((category, index) => [category, index]),
);
const entryKeys = [
  "category",
  "description",
  "id",
  "name",
  "priority",
  "sourceRepo",
  "sourceUrl",
].sort();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  value: Record<string, unknown>,
  key: string,
): string {
  const result = value[key];
  if (typeof result !== "string" || !result.trim())
    throw new Error(`Invalid skill catalog field: ${key}`);
  return result.trim();
}

export function sortSkills(skills: SkillCatalogEntry[]): SkillCatalogEntry[] {
  return [...skills].sort((left, right) => {
    const category =
      categoryIndex.get(left.category)! - categoryIndex.get(right.category)!;
    if (category) return category;
    if (left.priority !== right.priority)
      return left.priority === "featured" ? -1 : 1;
    return left.name.localeCompare(right.name, "en");
  });
}

export function parseSkillsCatalog(value: unknown): SkillsCatalog {
  if (!isRecord(value)) throw new Error("Invalid skills catalog");
  if (value.schemaVersion !== 1)
    throw new Error("Unsupported skills catalog schema");
  const catalogVersion = requiredString(value, "catalogVersion");
  const updatedAt = requiredString(value, "updatedAt");
  if (Number.isNaN(Date.parse(updatedAt)))
    throw new Error("Invalid skills catalog timestamp");
  if (!Array.isArray(value.skills) || value.skills.length === 0)
    throw new Error("Skills catalog must contain entries");

  const ids = new Set<string>();
  const skills = value.skills.map((item) => {
    if (!isRecord(item)) throw new Error("Invalid skill catalog entry");
    if (JSON.stringify(Object.keys(item).sort()) !== JSON.stringify(entryKeys))
      throw new Error("Unexpected skill catalog fields");
    const id = requiredString(item, "id");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id))
      throw new Error("Invalid or duplicate skill ID");
    ids.add(id);
    const category = item.category;
    if (
      typeof category !== "string" ||
      !skillCategories.includes(category as SkillCategory)
    )
      throw new Error("Invalid skill category");
    const sourceRepo = requiredString(item, "sourceRepo");
    if (!/^[\w.-]+\/[\w.-]+$/.test(sourceRepo))
      throw new Error("Invalid source repository");
    const sourceUrl = requiredString(item, "sourceUrl");
    const url = new URL(sourceUrl);
    if (url.protocol !== "https:" || url.hostname !== "github.com")
      throw new Error("Invalid source URL");
    if (item.priority !== "featured" && item.priority !== "standard")
      throw new Error("Invalid skill priority");
    return {
      id,
      name: requiredString(item, "name"),
      description: requiredString(item, "description"),
      category: category as SkillCategory,
      sourceRepo,
      sourceUrl,
      priority: item.priority,
    } satisfies SkillCatalogEntry;
  });

  return {
    schemaVersion: 1,
    catalogVersion,
    updatedAt,
    skills: sortSkills(skills),
  };
}

export const snapshotCatalog = rawSnapshot;
const parsedSnapshot = parseSkillsCatalog(snapshotCatalog);

function resultFrom(
  catalog: SkillsCatalog,
  source: "remote" | "snapshot",
  fallbackReason?: CatalogResult["meta"]["fallbackReason"],
): CatalogResult {
  return {
    data: catalog.skills,
    meta: {
      source,
      catalogVersion: catalog.catalogVersion,
      updatedAt: catalog.updatedAt,
      ...(fallbackReason ? { fallbackReason } : {}),
    },
  };
}

export async function loadSkillsCatalog(
  fetcher: CatalogFetch = globalThis.fetch as CatalogFetch,
): Promise<CatalogResult> {
  const url = process.env.ANYMD_SKILLS_CATALOG_URL;
  if (!url) return resultFrom(parsedSnapshot, "snapshot");

  let response: Response;
  try {
    response = await fetcher(url, {
      next: { revalidate: 21_600 },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return resultFrom(parsedSnapshot, "snapshot", "REMOTE_UNAVAILABLE");
  }
  if (!response.ok)
    return resultFrom(parsedSnapshot, "snapshot", "REMOTE_UNAVAILABLE");
  try {
    return resultFrom(parseSkillsCatalog(await response.json()), "remote");
  } catch {
    return resultFrom(parsedSnapshot, "snapshot", "INVALID_REMOTE_CATALOG");
  }
}

export function formatSkillInstructions(
  skills: SkillCatalogEntry[],
): string {
  if (skills.length === 0) return "";
  const selected = sortSkills(skills)
    .map(({ name, id }) => `- \`${id}\` - ${name}`)
    .join("\n");
  return `## Automatically recommended skills\n\n${selected}\n\n- The agent MUST check whether each recommended skill is installed in the environment's supported global skill locations before related work begins.\n- The agent MUST load and follow every recommended skill that is installed and relevant.\n- The agent MUST NOT claim a recommended skill is available without checking.\n- The agent MUST NOT stop the whole project only because an optional recommended skill is absent; report the absence and continue with repository conventions.\n- The agent MUST NOT treat a recommended skill as proof that any MCP server, credential, permission, or external service is available.`;
}

export function recommendSkillIds(
  skills: SkillCatalogEntry[],
  context: SkillRecommendationContext,
): string[] {
  const text = `${context.idea} ${Object.values(context.answers).join(" ")}`.toLowerCase();
  const ids = new Set(
    skills
      .filter(
        ({ category, priority }) =>
          category === "architecture-quality" && priority === "featured",
      )
      .map(({ id }) => id),
  );
  const add = (...skillIds: string[]) => skillIds.forEach((id) => ids.add(id));
  if (context.stack.Frontend || /\b(web|mobile|app|ui|interface|dashboard)\b/u.test(text))
    add("frontend-design", "accessibility");
  if (/\b(animat|motion|transition|3d|scroll)\w*/u.test(text)) add("animate");
  if (/\b(research|study|paper|citation|literature)\w*/u.test(text)) add("research");
  if (/\b(copy|content|article|blog|marketing)\w*/u.test(text))
    add("copywriting", "content-strategy");
  if (/\bpdf\b/u.test(text)) add("pdf");
  return skills.filter(({ id }) => ids.has(id)).map(({ id }) => id);
}
