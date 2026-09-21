# Phase 4 Deterministic Document Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate template-compliant `prd.md`, `AGENTS.md`, and an optional `CLAUDE.md` bridge from the completed in-memory AnyMD journey without calling an AI provider.

**Architecture:** A pure server-safe generator validates and normalizes the request, builds stable ordered document sections, and renders Markdown. A thin Route Handler resolves selected skill IDs against the server catalog before generation. The client submits the completed draft, reviews structured sections, and rebuilds one target section while preserving the rest of the bundle.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2, TypeScript 5.9 strict, Node test runner through `tsx`, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-16-phase-4-document-generator-design.md`

## Global Constraints

- `PRD-Template-Output-AnyMD.md` is the authoritative structure for generated `prd.md`.
- `docs/PRD-AnyMD-Product.md` is the AnyMD roadmap, not an output template.
- Phase 4 makes no AI-provider request; provider env integration remains Phase 4A.
- Default outputs remain `prd.md` and `AGENTS.md`; `CLAUDE.md` is opt-in and contains exactly `@AGENTS.md\n`.
- Generation remains memory-only and deterministic for identical normalized input and generation date.
- Selected skill metadata is resolved server-side; client IDs are untrusted.
- Skills and MCP availability remain separate concepts.
- Do not add dependencies, persistence, raw Markdown editing, copy, or download.
- Preserve the existing AnyMD visual language; no landing-page redesign.
- Desktop and mobile must have no clipped content, card escape, or document-level horizontal overflow.
- The workspace is not a Git repository, so this plan has no commit steps.

---

### Task 1: Generator Boundary and Canonical Types

**Files:**
- Create: `lib/generator.ts`
- Create: `tests/generator.test.ts`

**Interfaces:**
- Consumes: `Draft` and `stackOptions` from `lib/idea.ts`; `Answers`, `QuestionId`, `validateAnswer()`, and `visibleQuestions()` from `lib/clarification.ts`; `SkillCatalogEntry` from `lib/skills.ts`.
- Produces: `GenerateDocumentsRequest`, `DocumentSection`, `GeneratedDocument`, `GeneratedBundle`, `GenerateValidationError`, `parseGenerateRequest(value)`, and `generatorSystemPrompt`.

- [x] Write failing tests for exact-key validation, idea boundaries, valid stack options, duplicate skill IDs, hidden clarification answers, missing visible answers, bridge boolean validation, and required future-provider prompt rules.
- [x] Run `npx tsx --test tests/generator.test.ts` and confirm RED because `lib/generator.ts` does not exist.
- [x] Implement exact object-key validation and `GenerateValidationError` with stable codes: `INVALID_REQUEST`, `INCOMPLETE_CLARIFICATION`, and `INVALID_STACK`.
- [x] Reuse existing idea and clarification validators rather than duplicating length or branching rules.
- [x] Export `generatorSystemPrompt` requiring template structure, supplied-fact-only content, stable section IDs/order, skill/MCP separation, Mermaid validity, and no fabricated claims.
- [x] Run `npx tsx --test tests/generator.test.ts` and confirm the boundary tests pass.

### Task 2: Template-Compliant Document Assembly

**Files:**
- Modify: `lib/generator.ts`
- Modify: `tests/generator.test.ts`

**Interfaces:**
- Consumes: validated `GenerateDocumentsRequest`, resolved `SkillCatalogEntry[]`, and an injected ISO generation timestamp.
- Produces: `generateDocuments(request, selectedSkills, generatedAt)`, `rebuildDocumentSection(bundle, request, selectedSkills, filename, sectionId)`, and deterministic Markdown renderers.

- [x] Add failing tests asserting `prd.md` mirrors `PRD-Template-Output-AnyMD.md`: document header, numbered Sections 1-9, unnumbered Changelog, adaptive feature count, P0/P1/P2 priorities, dependencies, acceptance criteria, mandatory QA/Security phases, stack table, API documentation, Mermaid user-flow/architecture fences, conditional ER diagram, initialization prompt, and the 4,000-word hard cap.
- [x] Add failing tests asserting `AGENTS.md` contains project context, selected stack, existing `formatSkillInstructions()` output, implementation boundaries, accessibility/responsive no-overflow rules, independent MCP checks, and verification guidance.
- [x] Add failing tests for zero selected skills and exact opt-in `CLAUDE.md` content.
- [x] Add a failing isolation test that rebuilds one PRD section and deep-compares every unaffected section and document.
- [x] Run `npx tsx --test tests/generator.test.ts` and confirm RED on missing builders.
- [x] Implement small explicit section builders and one `renderDocument(filename, sections)` function; do not add a registry or class hierarchy.
- [x] Derive adaptive features from submitted scope clauses, cap them to the facts supplied, and never pad the output with invented capabilities.
- [x] Emit an ER diagram only when answers provide identifiable entities; otherwise emit the template's confirmation-needed note.
- [x] Implement `rebuildDocumentSection()` so only the target section is replaced and `CLAUDE.md` rebuild is rejected.
- [x] Run `npx tsx --test tests/generator.test.ts` and confirm GREEN.

### Task 3: Stable Generate API

**Files:**
- Create: `app/api/generate/route.ts`
- Modify: `tests/generator.test.ts`

**Interfaces:**
- Consumes: `parseGenerateRequest()`, `generateDocuments()`, and `loadSkillsCatalog()`.
- Produces: `POST /api/generate` returning `GeneratedBundle` or `{ error: { code, message } }`.

- [x] Add failing route tests for a valid complete request, malformed JSON, incomplete clarification, invalid stack selection, unknown skill IDs, and hidden internal errors.
- [x] Run the focused generator test and confirm RED because the route does not exist.
- [x] Implement the Route Handler with `request.json()`, complete boundary validation, server catalog resolution, a single captured generation timestamp, and stable public errors.
- [x] Return `400` for invalid input or unknown skill IDs and `500` for unexpected failures; never include exception text or user content in errors.
- [x] Run `npx tsx --test tests/generator.test.ts` and confirm route tests pass.

### Task 4: Generated Document Review Flow

**Files:**
- Create: `app/generate/page.tsx`
- Create: `components/document-generator.tsx`
- Modify: `components/skill-selection.tsx`
- Modify: `app/globals.css`
- Create: `e2e/phase-4.spec.ts`

**Interfaces:**
- Consumes: `useDraft()`, clarification state, `POST /api/generate`, and the `GeneratedBundle` public shape.
- Produces: `/generate`, document navigation, bridge toggle, section cards, target-only rebuild UI, direct-route empty state, retry state, and Phase 5 capability notice.

- [x] Write a failing Playwright journey that completes idea entry, conditional clarification, and skill selection; navigates to `/generate`; verifies `prd.md` and `AGENTS.md`; enables `CLAUDE.md`; rebuilds one section; and verifies the rest of the document remains visible.
- [x] Add failing desktop/mobile assertions that `document.documentElement.scrollWidth <= document.documentElement.clientWidth` and every visible `.document-section` rectangle stays within viewport bounds.
- [x] Add a failing direct `/generate` test for the memory-only empty state.
- [x] Run `npx playwright test e2e/phase-4.spec.ts` and confirm RED because the route and handoff do not exist.
- [x] Replace the Phase 3 local completion placeholder with navigation to `/generate` while preserving selected IDs.
- [x] Implement generation, malformed-response handling, retry, document navigation, opt-in bridge resubmission, and target rebuild from current input.
- [x] Use semantic headings, active-state text, polite live regions, `role="alert"`, visible focus, and reduced-motion-safe behavior.
- [x] Add responsive styles with `min-width: 0`, `overflow-wrap: anywhere`, no fixed card height, locally bounded code scrolling, wrapping actions, and no page-level overflow clipping.
- [x] Run the focused Phase 4 Playwright test and confirm desktop/mobile GREEN.

### Task 5: Documentation, MCP Runtime QA, and Full Verification

**Files:**
- Create: `docs/qa/phase-4.md`
- Modify: `docs/PRD-AnyMD-Product.md` (private local roadmap)
- Modify: `PRODUCT.md`
- Modify: `docs/superpowers/plans/2026-09-16-phase-4-document-generator.md`

**Interfaces:**
- Documents: shipped generator behavior, template authority, memory-only limitation, deferred provider integration, provider environment-variable contract, and visual QA evidence.

- [x] Update only Phase 4 roadmap checkboxes proven by tests; keep Phase 4A provider, queue, quota, and token work unchecked.
- [x] Record future server-only env names: `ANYMD_AI_BASE_URL`, `ANYMD_AI_API_VERSION`, `ANYMD_AI_MODEL_ID`, and `ANYMD_AI_API_KEY`; do not add secrets or pretend they are active in Phase 4.
- [x] Start the development server and query Next.js MCP diagnostics; record if runtime MCP remains unavailable and use browser diagnostics as the fallback.
- [x] Use browser automation to inspect console, desktop/mobile DOM, generated cards, local code-block scrolling, and screenshots.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`, and `npm run build`.
- [x] Inspect final desktop and mobile screenshots and confirm no clipping, card escape, inaccessible interaction, or document-level horizontal overflow.
- [x] Mark this plan complete only after every command exits successfully and QA evidence is written.
