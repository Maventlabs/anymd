# Phase 3 Skills Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a validated remote-or-snapshot skills catalog, public API, memory-only multi-select flow, and future AGENTS.md instruction formatter.

**Architecture:** A single server-safe catalog module validates the bundled JSON and remote payload, then returns a discriminated source result. A thin Route Handler exposes that contract. The existing draft context stores only stable skill IDs, while a new client route renders the functional selection step.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2, TypeScript 5.9 strict, Node test runner via `tsx`, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-16-phase-3-skills-catalog-design.md`

## Global Constraints

- Use exactly the four categories in the approved spec.
- Runtime code never parses the upstream README.
- Remote data is untrusted and must pass complete boundary validation.
- Cache successful remote fetches for 21,600 seconds.
- Keep the bundled snapshot as the durable fallback; do not write files at runtime.
- Keep skills distinct from MCP availability in copy and generated instructions.
- Add no schema or state dependency.
- Preserve memory-only behavior and existing Phase 1/2 flows.
- Do not expand the visual design system in this phase.

---

### Task 1: Catalog Contract, Snapshot, and Formatter

**Files:**
- Create: `data/skills.snapshot.json`
- Create: `lib/skills.ts`
- Create: `tests/skills.test.ts`

**Interfaces:**
- Produces: `SkillCategory`, `SkillCatalogEntry`, `SkillsCatalog`, `CatalogResult`, `parseSkillsCatalog(value)`, `sortSkills(skills)`, `loadSkillsCatalog(fetcher?)`, `formatSkillInstructions(skills)`.
- Consumes later: the API route, draft selection utilities, and Phase 4 generator.

- [x] Write failing unit tests for snapshot validation, malformed remote catalogs, deterministic ordering, fallback metadata, and skill-vs-MCP instruction copy.
- [x] Run `npx tsx --test tests/skills.test.ts` and confirm failure because `lib/skills.ts` does not exist.
- [x] Add the approved 25-entry snapshot using schema version `1` and category/source metadata.
- [x] Implement explicit boundary validation, sorting, remote loading with injectable fetch, five-second timeout, six-hour Next.js revalidation, and snapshot fallback.
- [x] Implement deterministic Markdown instructions containing `MUST` and `MUST NOT` requirements.
- [x] Run `npx tsx --test tests/skills.test.ts` and confirm all focused tests pass.

### Task 2: Stable Public Skills API

**Files:**
- Create: `app/api/skills/route.ts`
- Modify: `tests/skills.test.ts`

**Interfaces:**
- Consumes: `loadSkillsCatalog()` from Task 1.
- Produces: `GET /api/skills` response `{ data, meta }` with source and optional fallback reason.

- [x] Add a failing test that calls the exported `GET` handler and checks the stable JSON shape without leaking internal error text.
- [x] Run the focused test and confirm it fails because the route does not exist.
- [x] Implement the thin `GET` Route Handler with `Response.json(await loadSkillsCatalog())`.
- [x] Run the focused tests and confirm they pass.

### Task 3: Draft Selection State and Pure Toggle Logic

**Files:**
- Modify: `lib/idea.ts`
- Modify: `components/draft-provider.tsx`
- Modify: `tests/idea.test.ts`

**Interfaces:**
- Produces: `Draft.selectedSkillIds: string[]`, `toggleSkill(selectedIds, skillId, catalogOrder)`.
- Consumes later: the `/skills` client flow.

- [x] Add failing tests proving selection has no duplicates, deselection works, catalog order is stable, and `continueDraft` retains selected IDs.
- [x] Run `npx tsx --test tests/idea.test.ts` and confirm the new assertions fail.
- [x] Extend `Draft` and its provider initial state with `selectedSkillIds`.
- [x] Implement the minimal pure toggle helper without mutating inputs.
- [x] Update existing test fixtures to include the new field.
- [x] Run the focused idea tests and confirm they pass.

### Task 4: Functional Skill Selection Flow

**Files:**
- Create: `app/skills/page.tsx`
- Create: `components/skill-selection.tsx`
- Modify: `components/clarification-flow.tsx`
- Modify: `app/globals.css`
- Modify: `e2e/phase-1.spec.ts`

**Interfaces:**
- Consumes: `GET /api/skills`, `useDraft()`, `toggleSkill()`.
- Produces: `/skills` route, clarification-review handoff, category multi-select, fallback notice, honest Phase 4 placeholder state.

- [x] Extend the Playwright journey to complete clarification through existing controls, open `/skills`, assert four named categories, select two skills, navigate back/forward, and verify retained pressed state.
- [x] Run the focused Playwright project and confirm failure because `/skills` and the review CTA do not exist.
- [x] Add a review CTA that routes from completed clarification to `/skills`.
- [x] Implement client-side catalog loading with loading, retry, fallback-source, invalid-draft, selection, and completion states.
- [x] Add minimal blue/white responsive styles using existing tokens and visible focus rules.
- [x] Run desktop and mobile Playwright journeys and confirm both pass.

### Task 5: Documentation and Full Verification

**Files:**
- Create: `docs/qa/phase-3.md`
- Modify: `docs/PRD-AnyMD-Product.md` (private local roadmap)
- Modify: `PRODUCT.md`

**Interfaces:**
- Documents the shipped behavior and the still-pending upstream publication task.

- [x] Update Phase 3 checkboxes only for behavior proven by tests; leave upstream `skills-vault/skills.json` publication unchecked.
- [x] Record source/fallback behavior, routes, commands, and limitations in `docs/qa/phase-3.md`.
- [x] Update `PRODUCT.md` current capabilities without claiming generation or persistence.
- [x] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e`, and `npm run build`.
- [x] Inspect desktop/mobile screenshots and confirm no blocking overflow or inaccessible interaction.
