# SESSION.md Output Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `SESSION.md` the mandatory third AnyMD generated document without breaking persisted generator version 1 bundles.

**Architecture:** Add a versioned document contract at the shared generated-document parser. New generation emits version 2 with a deterministic SESSION ledger; the parser keeps a narrow legacy version 1 path for already-persisted jobs. The UI continues to render any parsed document through the existing filename/section model.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node test runner via `tsx`, React client component, existing JSON generation API.

**Spec:** `docs/superpowers/specs/2026-09-22-session-output-contract-design.md`

## Global Constraints

- `SESSION.md` is mandatory in every new bundle.
- Version 1 persisted bundles remain parseable.
- `CLAUDE.md` remains optional and exactly `@AGENTS.md\n`.
- Preserve stable existing section IDs and order.
- Do not change Auth.js, queue, token, Stripe, or database behavior in this slice.
- Do not include raw prompts, credentials, or provider response details in generated files.

### Task 1: Lock the contract with failing tests

**Files:**
- Modify: `tests/generator.test.ts`
- Modify: `tests/fixtures.ts` only if the shared versioned fixture needs a legacy bundle

**Interfaces:**
- Consumes: existing `generateDocuments`, `parseGeneratedBundle`, and `validGenerateRequest`.
- Produces: assertions for version 2 output and version 1 compatibility.

- [x] **Step 1: Add failing assertions**

Add assertions that a fresh bundle has `generatorVersion === 2`, filenames
`["prd.md", "AGENTS.md", "SESSION.md"]`, and SESSION content containing
`# SESSION.md`, `## Current State`, `## E2E Retest Ledger`, and the generated
date. Add a second case with the existing two-file version 1 fixture and assert
that `parseGeneratedBundle` still returns it. Add a malformed version 2 case
with `SESSION.md` removed and assert parsing returns `null`.

- [x] **Step 2: Run the focused test**

Run: `npm test -- --test-name-pattern="generated|bundle|SESSION|version 1"`

Expected: FAIL because the current generator emits version 1 and does not know
the SESSION document.

### Task 2: Implement the shared document contract

**Files:**
- Modify: `lib/generated-documents.ts`
- Modify: `lib/generator.ts`

**Interfaces:**
- Consumes: the existing `GenerateDocumentsRequest` and `GeneratedBundle` shape.
- Produces: `GeneratedDocument.filename` support for `SESSION.md`, versioned
  parser behavior, `buildSessionSections()`, and version 2 generation.

- [x] **Step 1: Extend filename and section types**

Add `SESSION.md` to the filename union and add a stable `session-ledger` section
order. Represent bundle versions as `1 | 2`.

- [x] **Step 2: Add legacy/version 2 parser branches**

Accept version 1 with the historical expected filenames. Require version 2 to
contain `prd.md`, `AGENTS.md`, and `SESSION.md`, with `CLAUDE.md` optional and
last. Validate the same rendered Markdown and section uniqueness for both
versions.

- [x] **Step 3: Render the deterministic SESSION ledger**

Create one `session-ledger` section containing the template headings and safe
initial values. Use the existing generated date and derived project title only;
do not interpolate the raw idea or provider output.

- [x] **Step 4: Emit version 2 documents in the required order**

Build `prd.md`, `AGENTS.md`, and `SESSION.md` before adding the optional bridge.
Return `generatorVersion: 2`.

- [x] **Step 5: Run focused tests**

Run: `npm test -- --test-name-pattern="generated|bundle|SESSION|version 1"`

Expected: PASS.

### Task 3: Preserve rebuild and API compatibility

**Files:**
- Modify: `lib/generator.ts`
- Modify: `app/api/generate/rebuild/route.ts`
- Modify: `tests/generator.test.ts`

**Interfaces:**
- Consumes: versioned `GeneratedBundle` parsing and existing rebuild request.
- Produces: version-aware rebuild behavior and stable public API errors.

- [x] **Step 1: Add a failing rebuild preservation assertion**

Assert a version 2 rebuild changes only the selected section and leaves the
SESSION document byte-for-byte unchanged. Assert the route still rejects
`SESSION.md` as a rebuild target.

- [x] **Step 2: Implement version-aware preservation**

Keep the current document array for the incoming bundle and replace only the
selected target section. Do not regenerate or insert documents during rebuild.
Allow the route's existing filename guard to remain limited to `prd.md` and
`AGENTS.md`.

- [x] **Step 3: Run the focused API tests**

Run: `npm test -- --test-name-pattern="rebuild|SESSION"`

Expected: PASS.

### Task 4: Verify the UI discovers the third document

**Files:**
- Modify: `tests/generator.test.ts` if API response assertions need the new order
- Modify: `components/document-generator.tsx` only if a hardcoded two-file assumption is found
- Modify: `app/page.tsx`, `app/generate/page.tsx`, and `CONTRIBUTING.md` copy/rules only where they explicitly claim two files

**Interfaces:**
- Consumes: parsed version 2 bundles from the existing generation API.
- Produces: no hardcoded two-file UI behavior and accurate product copy.

- [x] **Step 1: Search for stale two-file assumptions**

Run: `git grep -n "two-file\|two files\|prd.md.*AGENTS.md\|AGENTS.md.*prd.md" -- ':!docs/superpowers/specs/*'`

- [x] **Step 2: Update only stale user-facing or contract text**

Change references to say `prd.md`, `AGENTS.md`, and `SESSION.md`; keep the
optional Claude bridge wording explicit.

- [x] **Step 3: Run all local gates**

Run: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and
`git diff --check`.

Expected: all pass; existing auth and queue tests remain unchanged and passing.

### Checkpoint: SESSION contract

- [x] New generation returns the mandatory three-file bundle.
- [x] Old version 1 persisted bundles still parse.
- [x] Rebuild does not mutate SESSION state.
- [x] Local gates pass: `npm test` (74), `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`.
