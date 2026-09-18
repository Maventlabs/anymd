export type DocumentSection = {
  id: string;
  title: string;
  markdown: string;
};

export type GeneratedDocument = {
  filename: "prd.md" | "AGENTS.md" | "CLAUDE.md";
  sections: DocumentSection[];
  markdown: string;
};

export type GeneratedBundle = {
  documents: GeneratedDocument[];
  generatedAt: string;
  generatorVersion: 1;
};

const prdSectionIds = [
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
];
const agentsSectionIds = [
  "project-context",
  "selected-stack",
  "execution-rules",
  "visual-direction",
  "implementation-boundaries",
  "responsive-accessibility",
  "mcp-and-external-services",
  "verification",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

export function renderDocumentMarkdown(
  filename: GeneratedDocument["filename"],
  sections: DocumentSection[],
) {
  return filename === "CLAUDE.md"
    ? "@AGENTS.md\n"
    : `${sections.map(({ markdown }) => markdown).join("\n\n---\n\n")}\n`;
}

function hasSectionOrder(filename: GeneratedDocument["filename"], ids: string[]) {
  if (filename === "prd.md")
    return JSON.stringify(ids) === JSON.stringify(prdSectionIds);
  if (filename === "CLAUDE.md") return ids.length === 1 && ids[0] === "agents-import";
  const withoutSkills = ids.filter((id) => id !== "selected-skills");
  const skillsIndex = ids.indexOf("selected-skills");
  return (
    JSON.stringify(withoutSkills) === JSON.stringify(agentsSectionIds) &&
    (skillsIndex === -1 || skillsIndex === 2)
  );
}

export function parseGeneratedBundle(value: unknown): GeneratedBundle | null {
  if (!isRecord(value) || !hasExactKeys(value, ["documents", "generatedAt", "generatorVersion"]))
    return null;
  if (value.generatorVersion !== 1 || typeof value.generatedAt !== "string") return null;
  const parsedDate = new Date(value.generatedAt);
  if (!Number.isFinite(parsedDate.valueOf()) || parsedDate.toISOString() !== value.generatedAt)
    return null;
  if (!Array.isArray(value.documents) || ![2, 3].includes(value.documents.length))
    return null;

  const documents: GeneratedDocument[] = [];
  for (const rawDocument of value.documents) {
    if (
      !isRecord(rawDocument) ||
      !hasExactKeys(rawDocument, ["filename", "markdown", "sections"]) ||
      (rawDocument.filename !== "prd.md" &&
        rawDocument.filename !== "AGENTS.md" &&
        rawDocument.filename !== "CLAUDE.md") ||
      typeof rawDocument.markdown !== "string" ||
      !Array.isArray(rawDocument.sections) ||
      rawDocument.sections.length === 0
    )
      return null;
    const sections: DocumentSection[] = [];
    for (const rawSection of rawDocument.sections) {
      if (
        !isRecord(rawSection) ||
        !hasExactKeys(rawSection, ["id", "markdown", "title"]) ||
        typeof rawSection.id !== "string" ||
        typeof rawSection.title !== "string" ||
        typeof rawSection.markdown !== "string" ||
        !rawSection.id ||
        !rawSection.title ||
        !rawSection.markdown
      )
        return null;
      sections.push({
        id: rawSection.id,
        title: rawSection.title,
        markdown: rawSection.markdown,
      });
    }
    const ids = sections.map(({ id }) => id);
    if (new Set(ids).size !== ids.length || !hasSectionOrder(rawDocument.filename, ids))
      return null;
    if (
      rawDocument.filename === "CLAUDE.md" &&
      (sections[0].title !== "AGENTS.md import" || sections[0].markdown !== "@AGENTS.md")
    )
      return null;
    if (rawDocument.markdown !== renderDocumentMarkdown(rawDocument.filename, sections))
      return null;
    if (
      rawDocument.filename === "prd.md" &&
      rawDocument.markdown.trim().split(/\s+/u).length > 4000
    )
      return null;
    documents.push({
      filename: rawDocument.filename,
      markdown: rawDocument.markdown,
      sections,
    });
  }
  const filenames = documents.map(({ filename }) => filename);
  const expected = filenames.includes("CLAUDE.md")
    ? ["prd.md", "AGENTS.md", "CLAUDE.md"]
    : ["prd.md", "AGENTS.md"];
  if (JSON.stringify(filenames) !== JSON.stringify(expected)) return null;
  return {
    documents,
    generatedAt: value.generatedAt,
    generatorVersion: 1,
  };
}
