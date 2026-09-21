# Phase 4 Deterministic Document Generator Design

**Status:** Approved direction, pending written-spec review
**Date:** 16 September 2026
**Related roadmap:** `docs/PRD-AnyMD-Product.md`, Phase 4

## Objective

Phase 4 turns the completed in-memory AnyMD journey into a deterministic document bundle containing `prd.md`, `AGENTS.md`, and an optional `CLAUDE.md` bridge. `PRD-Template-Output-AnyMD.md` is the authoritative structure for the generated `prd.md`; `docs/PRD-AnyMD-Product.md` is only the roadmap for building AnyMD itself. The output must be useful before an AI provider is connected, stable enough to test exactly, and structured so Phase 4A can replace individual section builders with AI generation without changing the UI or public output contract.

Success means a user can complete idea entry, clarification, and skill selection, generate both primary documents, inspect their sections, and rebuild one section without changing any other section or the document structure.

## Assumptions

1. Phase 4 does not call an AI provider. Provider configuration, queues, quotas, retry, and payment remain Phase 4A.
2. Draft and generated output remain in React memory and are cleared by refresh.
3. Phase 4 presents generated sections for review because section-level rebuild requires visible section boundaries. Raw Markdown preview, copy, and download remain Phase 5.
4. Rebuilding a deterministic section produces the same content when its source inputs have not changed. The UI calls this action **Rebuild section**, not an AI-style rewrite.
5. `CLAUDE.md` is optional and, when enabled, contains exactly `@AGENTS.md` followed by one newline.
6. The existing skill catalog resolver remains the authority for skill metadata. Client-provided skill IDs are resolved by the server and never trusted as complete skill objects.
7. Template headings, section order, adaptive feature/phase guidance, P0/P1/P2 priorities, mandatory QA/Security phases, document length guidance, and diagram requirements come from `PRD-Template-Output-AnyMD.md`.

## Non-Goals

- AI-generated prose or model-specific prompt execution.
- Database persistence, accounts, billing, quotas, or IP tracking.
- Raw Markdown editor, copy-to-clipboard, or file downloads.
- Rendering Mermaid as SVG or canvas. Phase 4 generates valid Mermaid source blocks.
- Installing skills, discovering MCP servers, or claiming credentials and permissions exist.
- Final visual redesign of the landing or clarification flows.

## Approaches Considered

### Structured sections rendered to Markdown (selected)

Each document is represented as ordered sections with stable IDs, titles, and Markdown bodies. A renderer combines them into final Markdown. Section rebuild replaces one section by ID while preserving every unaffected section and document order.

This creates a stable contract for selective regeneration and future AI section generation.

### Raw Markdown strings

Generating one string per file would be smaller initially, but replacing one section would require fragile Markdown parsing and heading matching. Rejected because it makes the Phase 4 regenerate requirement unreliable.

### One-pass static template

A hard-coded one-pass template would generate files quickly but cannot prove section isolation or support future AI replacement cleanly. Rejected.

## Architecture

### Generator module

Create `lib/generator.ts` as a server-safe module with no React or network dependencies.

It owns:

- request boundary validation;
- canonical input types;
- ordered PRD and agent section builders;
- Mermaid source builders;
- Markdown rendering;
- optional bridge generation;
- section-only rebuild behavior;
- the future provider system-prompt contract.

The module must remain deterministic: the same normalized input produces byte-identical output.

### Generate route

Create `POST /api/generate` in `app/api/generate/route.ts`.

The route:

1. Parses JSON and validates the full request boundary.
2. Loads the validated skills catalog through `loadSkillsCatalog()`.
3. Resolves requested skill IDs against that catalog and rejects unknown IDs.
4. Calls the pure generator.
5. Returns the document bundle as JSON.

The route must not expose internal exception text. Invalid requests return status `400` with a stable public error code. Unexpected failures return status `500` with a generic code.

### Client flow

Create `/generate` and a client component that reads the existing draft and clarification context.

The `/skills` completion action changes from a local placeholder to navigation to `/generate`. The generate page submits the current memory-only input to `POST /api/generate`, then renders the returned section model.

No additional global state abstraction is required. The generated bundle can remain local to the generate page because Phase 5 persistence and export are not part of this phase.

## Data Contract

### Request

```ts
type GenerateDocumentsRequest = {
  idea: string;
  stack: Partial<Record<StackCategory, string>>;
  answers: Partial<Record<QuestionId, string>>;
  selectedSkillIds: string[];
  includeClaudeBridge: boolean;
};
```

Validation rules:

- idea follows the existing 20-5,000 trimmed Unicode code-point rule;
- every visible clarification question is complete and valid;
- hidden branch answers are rejected rather than silently used;
- stack keys and values must come from the existing `stackOptions` contract;
- selected skill IDs must be unique kebab-case IDs and must exist in the resolved server catalog;
- `includeClaudeBridge` must be boolean;
- unexpected object keys are rejected.

### Response

```ts
type DocumentSection = {
  id: string;
  title: string;
  markdown: string;
};

type GeneratedDocument = {
  filename: "prd.md" | "AGENTS.md" | "CLAUDE.md";
  sections: DocumentSection[];
  markdown: string;
};

type GeneratedBundle = {
  documents: GeneratedDocument[];
  generatedAt: string;
  generatorVersion: 1;
};
```

`generatedAt` is metadata and is not embedded in the Markdown, so rebuilding a section cannot cause unrelated document changes. Tests compare document content independently from the timestamp.

## Document Structure

### `prd.md`

Sections mirror `PRD-Template-Output-AnyMD.md` in this stable order:

1. `document-header` - project name, version, date, author placeholder, AnyMD attribution, paired-document note, and 2,000-3,000 word target with a 4,000-word hard cap.
2. `product-overview` - product description, problem statement, target user, and explicit out-of-scope items.
3. `unique-selling-proposition` - evidence-bounded differentiation and why it matters; unknown competitor claims remain labeled assumptions instead of invented facts.
4. `features` - an adaptive number of features and sub-features, each with P0/P1/P2 priority, dependency mapping, and concrete acceptance criteria.
5. `development-phases` - dependency-ordered implementation phases plus mandatory QA and Security phases, tasks, and completion conditions.
6. `tech-stack` - the template's layer/technology/reason table populated from selected stack and clearly marked undecided entries.
7. `visual-direction` - optional Section 5A only when a future visual preset has been supplied; otherwise the section is omitted. Phase 4 does not invent a font/palette choice.
8. `database-schema` - Mermaid ER diagram when supported by submitted data evidence, otherwise a confirmation-needed note.
9. `api-documentation` - adaptive endpoint groups derived only from in-scope features and access decisions.
10. `additional-diagrams` - required Mermaid user flow and architecture diagram, plus extra diagrams only when justified.
11. `initialization-prompt` - the short agent-start prompt from template Section 9. It remains part of `prd.md` in Phase 4; Phase 5 may also expose it as a copyable UI block.
12. `changelog` - deterministic initial draft entry.

The renderer preserves the template's numbered headings (`## 1` through `## 9`) and unnumbered Changelog heading. The adaptive feature and phase count is derived from submitted scope instead of being padded to a fixed number. Phase QA and Phase Security are always included.

The generator must preserve the user's language for prose-heavy answers. Fixed headings follow `PRD-Template-Output-AnyMD.md` as authored so the generated structure remains recognizable and stable.

### `AGENTS.md`

Sections use stable IDs and order:

1. `project-context` - concise project objective and target users.
2. `selected-stack` - explicit stack decisions and undecided categories.
3. `selected-skills` - existing `formatSkillInstructions()` output, omitted when no skills are selected.
4. `implementation-boundaries` - in-scope, out-of-scope, privacy, access, and constraint rules.
5. `responsive-accessibility` - keyboard, semantics, reduced motion, responsive behavior, and the mandatory no-clipping/no-page-overflow rule.
6. `mcp-and-external-services` - verify MCP server, credentials, permissions, and service availability independently.
7. `verification` - repository-aware commands when known, otherwise explicit instruction to inspect package scripts before running checks.

### `CLAUDE.md`

When requested, this document has one section with stable ID `agents-import` and final Markdown exactly:

```text
@AGENTS.md
```

## Mermaid Generation

Phase 4 emits fenced Mermaid blocks with deterministic ASCII-safe node IDs and escaped user-facing labels.

Required diagrams:

- `flowchart TD` for the primary user journey;
- `flowchart LR` for client, application, selected services, and data-store architecture;
- `erDiagram` only when the submitted scope or data answer provides enough entity evidence.

When entity evidence is insufficient, the database diagram is omitted and the PRD states that the data model must be confirmed during implementation. The generator must not invent tables solely to fill the template.

## Section Rebuild

The pure function `rebuildDocumentSection(bundle, input, filename, sectionId)`:

- validates that the document and section exist;
- rebuilds only the requested section from normalized current input;
- preserves every unaffected section by value and order;
- re-renders only the containing document's Markdown;
- leaves other documents unchanged;
- rejects rebuilding `CLAUDE.md` because its content is fixed.

The initial Phase 4 UI rebuilds from the same submitted input. A future phase may allow edited inputs or AI alternatives without changing this contract.

## Future Provider Prompt Contract

Export a `generatorSystemPrompt` string for Phase 4A tests and integration. It instructs a future model to:

- act as an expert product-requirements editor;
- use only supplied facts and label unknowns;
- preserve required section IDs and order;
- return structured section data rather than free-form files;
- keep skills distinct from MCP availability;
- produce valid Mermaid source;
- preserve the user's language where practical;
- avoid fabricated benchmarks, testimonials, integrations, or compliance claims.

Phase 4 does not send this prompt anywhere.

When Phase 4A connects the provider, server-only configuration uses environment variables rather than UI fields or hardcoded values:

```text
ANYMD_AI_BASE_URL
ANYMD_AI_API_VERSION
ANYMD_AI_MODEL_ID
ANYMD_AI_API_KEY
```

`ANYMD_AI_API_VERSION` supports provider paths such as `v1` without coupling the generator to one vendor. The API key must never be exposed through client bundles, generated files, logs, or public error responses. Exact provider request/response adaptation belongs to Phase 4A and must not alter the Phase 4 document contract.

## UI Design

### States

- invalid/direct navigation: explain that the memory-only journey must be completed and link to the idea entry;
- generating: accessible status text and non-blocking progress treatment;
- generation error: stable message with retry and back-to-skills actions;
- generated: document navigation, section cards, rebuild actions, optional bridge toggle, and a clear note that files are not yet downloadable;
- rebuilding: only the target action is busy and disabled.

### Layout

Desktop uses a compact document navigation rail and a flexible section column. Mobile uses one column with document navigation wrapping or scrolling inside its own bounded container.

The implementation must reuse existing AnyMD typography, color, button, focus, and spacing patterns. It must not introduce a new design language during this phase.

### Mandatory overflow rules

- Grid and flex children that contain prose or code use `min-width: 0`.
- User-derived prose uses `overflow-wrap: anywhere`.
- Section cards never rely on fixed heights.
- Markdown and Mermaid code blocks use local `overflow-x: auto`, `max-width: 100%`, and remain clipped to the card's rounded boundary.
- Action rows wrap on narrow screens.
- No viewport may produce document-level horizontal overflow.
- Focus outlines must remain visible and must not be clipped by card overflow handling.

## Error Handling

- The client treats non-2xx responses and malformed response bodies as generation failure.
- Retry resubmits the current in-memory input and does not clear the draft.
- Unknown skill IDs are shown as a recoverable stale-catalog error with a link back to `/skills`.
- The API never logs or returns user text as part of an error message.
- No generated content is persisted server-side.

## Accessibility

- Document navigation uses semantic buttons or links with an active state.
- Every section card has a heading associated with its rebuild button.
- Loading and rebuild state changes use polite live regions.
- Error messages use `role="alert"`.
- Keyboard users can reach every document, section, and action in visual order.
- Reduced-motion preferences disable nonessential transitions.
- Color is never the only indicator of selected, active, loading, or error state.

## Testing Strategy

### Unit tests

- request validation and normalization;
- stable document and section order;
- deterministic byte-identical Markdown;
- skill instruction inclusion and skill/MCP separation;
- valid Mermaid fences and escaped labels;
- conditional database diagram omission;
- exact bridge content;
- section-only rebuild isolation;
- system-prompt requirements.

### API tests

- valid complete request returns the stable bundle contract;
- incomplete or malformed requests return stable `400` errors;
- unknown skill IDs are rejected;
- internal error details are not exposed.

### End-to-end tests

- complete the existing idea, clarification, and skill flow;
- generate the two primary documents;
- enable and verify the optional bridge;
- rebuild one section and confirm other sections remain present;
- verify direct `/generate` navigation without draft shows the empty state;
- run on desktop and mobile Chromium;
- assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`;
- assert every visible section card remains within viewport bounds;
- capture desktop and mobile screenshots for manual inspection.

## Commands

```text
npm test
npm run lint
npm run typecheck
npm run test:e2e
npm run build
```

Runtime verification also uses the Next.js MCP diagnostics when a development server is active and browser automation for DOM, console, responsive, and screenshot checks.

## Boundaries

### Always

- Validate the API request at the server boundary.
- Keep generation deterministic and test section isolation.
- Resolve skill metadata server-side.
- Preserve memory-only behavior and honest capability copy.
- Verify desktop and mobile clipping and overflow before completion.

### Ask first

- Add a runtime dependency.
- Change the current memory-only data model.
- Move AI provider work from Phase 4A into this phase.
- Add a third default output beyond the optional bridge.

### Never

- Call an AI provider in Phase 4.
- Persist user content or credentials.
- Invent product facts, integrations, entities, benchmarks, or compliance claims.
- Treat skill selection as proof of skill installation or MCP access.
- Hide overflowing content by clipping the whole page.

## Project Structure

```text
lib/generator.ts                 Pure contracts, builders, renderer, validation
app/api/generate/route.ts        Generate boundary and catalog resolution
app/generate/page.tsx            Route metadata and generated-document flow
components/document-generator.tsx Client states, document navigation, rebuild UI
tests/generator.test.ts          Unit and route integration tests
e2e/phase-4.spec.ts              Desktop/mobile critical journey and overflow checks
docs/qa/phase-4.md               Verification evidence and known limits
```

Existing files may be modified only where the flow connects: `components/skill-selection.tsx`, `app/globals.css`, `docs/PRD-AnyMD-Product.md`, and `PRODUCT.md`.

## Code Style

Keep generator functions pure and data-oriented. Prefer stable arrays and explicit section builders over class hierarchies or registries.

```ts
const prdSections: DocumentSection[] = [
  buildOverview(input),
  buildProblem(input),
  buildAudience(input),
];

return renderDocument("prd.md", prdSections);
```

## Success Criteria

- A completed Phase 3 draft can generate `prd.md` and `AGENTS.md` without an AI or external service.
- The optional bridge is exact and never included by default.
- Output order and content are deterministic for identical normalized input.
- Every selected skill is resolved from the server catalog and receives the existing MUST/MUST NOT instructions.
- PRD output follows `PRD-Template-Output-AnyMD.md`, including adaptive features/phases, P0/P1/P2 priorities, acceptance criteria, dependencies, mandatory QA/Security phases, stack, API documentation, diagrams, initialization prompt, and changelog.
- PRD output includes valid Mermaid source without inventing unsupported data entities.
- Rebuilding one section changes no unrelated section or document.
- Direct navigation, loading, API error, stale skill, zero-skill, and bridge states are handled honestly.
- Unit, API, desktop/mobile E2E, lint, typecheck, and production build gates pass.
- Desktop and mobile screenshots show no clipped content, card escape, or document-level horizontal overflow.

## Open Questions

None. The deterministic generator direction, Phase 4 boundaries, and overflow QA requirement are approved.
