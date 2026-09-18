# Phase 3 Skills Catalog Design

**Status:** Approved for planning
**Date:** 2026-09-16
**Related requirements:** `PRD-AnyMD-Product.md`, Feature 3 and Phase 3

## 1. Objective

Add a curated, individual-skill selection step after clarification. AnyMD will read a structured remote catalog when one becomes available in `vetrns/skills-vault`, fall back to a version-controlled local snapshot, retain selected skill IDs in the existing memory-only draft, and prepare deterministic `MUST`/`MUST NOT` instructions for the Phase 4 generator.

This phase establishes data and behavior. It does not attempt another visual redesign. The new screen should reuse current controls and remain deliberately functional.

## 2. Scope

### In scope

- A structured and validated skill catalog contract.
- A local last-known-good snapshot committed with AnyMD.
- A remote fetch path with a six-hour cache lifetime.
- Safe fallback when the remote file is missing, unavailable, or invalid.
- `GET /api/skills` with a stable response contract.
- A memory-only skill selection step at `/skills`.
- Multi-select grouped under the four categories named in the PRD.
- Back/continue navigation that preserves the existing idea, stack, clarification, and skill selections.
- A pure formatter for future `AGENTS.md` skill instructions.
- Unit, API, and browser coverage for the new behavior.

### Out of scope

- Publishing `skills.json` to the external `skills-vault` repository. The local file is shaped so it can be copied upstream later without conversion.
- Discovering every skill in every referenced repository.
- Parsing `README.md` at runtime.
- Installing skills on the user's machine.
- Detecting which skills are installed on the user's machine from the web application.
- MCP discovery or selection. Skills and MCP remain separate concepts.
- PRD/AGENTS generation, AI provider integration, persistence, accounts, or payments.
- Final visual polish of the landing or skill-selection screen.

## 3. Source Strategy

The source order is:

1. Fetch structured JSON from `ANYMD_SKILLS_CATALOG_URL` when configured, otherwise from the future raw GitHub URL for `vetrns/skills-vault/main/skills.json`.
2. Validate the complete remote payload before exposing any entry.
3. If the remote response is non-200, times out, throws, or fails validation, return `data/skills.snapshot.json`.

The local snapshot is the last catalog version verified by a maintainer and committed to AnyMD. A successful remote HTTP response is cached by Next.js for six hours. The application will not attempt to write a new snapshot at runtime because route handlers may run in ephemeral/serverless environments. Updating the durable fallback remains an explicit repository sync operation.

No GitHub token is required for the default public raw URL. The URL is configurable so self-hosters can use a fork or another trusted catalog.

## 4. Catalog Contract

The remote file and local snapshot use the same shape:

```ts
type SkillCategory =
  | "architecture-quality"
  | "ui-ux-design"
  | "motion-3d"
  | "research-content";

type SkillCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  sourceRepo: string;
  sourceUrl: string;
  priority: "featured" | "standard";
};

type SkillsCatalog = {
  schemaVersion: 1;
  catalogVersion: string;
  updatedAt: string;
  skills: SkillCatalogEntry[];
};
```

Validation rules:

- `schemaVersion` must be exactly `1`.
- `catalogVersion` is a non-empty release identifier.
- `updatedAt` is an ISO-8601 timestamp.
- Skill IDs are unique, lowercase kebab-case, and stable across catalog releases.
- Names and descriptions are non-empty after trimming.
- Categories must be one of the four known values.
- `sourceRepo` uses `owner/repo` form.
- `sourceUrl` must be an HTTPS GitHub URL.
- Unknown or malformed entries invalidate the complete remote payload; AnyMD never mixes partially trusted remote data with the snapshot.
- Ordering is deterministic: category order from the PRD, then featured entries, then name.

No schema-validation dependency is added. The contract is small enough for explicit TypeScript boundary validation and focused unit tests.

## 5. Initial Curated Snapshot

The initial snapshot contains individual skills, not repository-level choices.

### Architecture & Code Quality

- `api-and-interface-design`
- `code-review`
- `code-simplification`
- `debugging-and-error-recovery`
- `planning-and-task-breakdown`
- `test-driven-development`
- `verification-before-completion`

These entries are featured and use `mattpocock/skills` as their source, matching the PRD priority rule.

### UI/UX & Design System

- `frontend-design`
- `impeccable`
- `ui-ux-pro-max`
- `shadcn`
- `accessibility`
- `extract-design-system`

### Animation, Motion & 3D

- `animate`
- `gsap-core`
- `gsap-scrolltrigger`
- `threejs-fundamentals`
- `hyperframes`
- `remotion`

### Research & Content

- `research`
- `doc-coauthoring`
- `scientific-writing`
- `copywriting`
- `content-strategy`
- `pdf`

Descriptions must explain when the user should select each skill. They must not claim the skill is installed or that AnyMD can invoke it.

## 6. Application Boundaries

### Catalog module

`lib/skills.ts` owns the public catalog types, boundary validation, deterministic sorting, remote-or-snapshot resolution, and instruction formatting. Keeping this in one module is preferred until a second consumer makes a split useful.

The remote loader accepts a fetch-compatible function in tests. Production uses the global server-side `fetch` with `next: { revalidate: 21600 }`. A bounded timeout prevents the public endpoint from hanging on GitHub.

### Public API

`app/api/skills/route.ts` exposes only `GET` and returns:

```ts
type SkillsCatalogResponse = {
  data: SkillCatalogEntry[];
  meta: {
    source: "remote" | "snapshot";
    catalogVersion: string;
    updatedAt: string;
    fallbackReason?: "REMOTE_UNAVAILABLE" | "INVALID_REMOTE_CATALOG";
  };
};
```

The endpoint returns `200` when a valid snapshot is available, even if the remote source failed. Internal exception text and remote response bodies are never returned. A broken bundled snapshot is a build/test failure, not a runtime response variant.

### Draft state

The existing `Draft` gains `selectedSkillIds: string[]`. IDs are stored instead of complete skill objects so a catalog refresh does not duplicate remote content in client state. Selection updates are immutable, de-duplicated, and ordered according to the current catalog.

Submitting a changed idea continues to reset clarification answers according to current behavior, but does not silently erase explicit stack or skill preferences. Refresh still clears everything because persistence remains out of scope.

### Skill selection route

`/skills` loads the catalog from `/api/skills` in the client because it needs the same public boundary that future consumers will use. The screen provides:

- Four category groups in PRD order.
- Visible name, short use case, source repository, and selection state.
- Multi-select with no forced minimum.
- A clear label when the fallback snapshot is in use.
- Back to clarification review.
- Continue to a Phase 3 completion placeholder; Phase 4 generation is not simulated.
- An empty state with a route back home when no valid idea draft exists.

The screen reuses the current blue/white tokens and standard controls. No new animation library, art direction, or design-system expansion is part of this phase.

## 7. Agent Instruction Contract

`formatSkillInstructions(selectedSkills)` returns deterministic Markdown for Phase 4. For every selected skill, the generated guidance will state:

- The agent **MUST** check whether the skill is installed in the environment's supported global skill locations before starting related work.
- The agent **MUST** load and follow the skill when it is installed and relevant.
- The agent **MUST NOT** claim a skill is available without checking.
- The agent **MUST NOT** fail the whole project solely because an optional selected skill is absent; it must report the absence and continue with repository conventions.
- The agent **MUST NOT** treat a selected skill as proof that an MCP server, credential, permission, or external service is available.

This phase tests the formatter but does not yet insert its output into generated files.

## 8. Error Handling

- Remote timeout/network error/non-200: use snapshot and expose `REMOTE_UNAVAILABLE`.
- Remote JSON or contract invalid: use snapshot and expose `INVALID_REMOTE_CATALOG`.
- Client API request fails unexpectedly: show a retry action and do not discard existing selections.
- Previously selected ID missing from a refreshed catalog: retain it in draft state but label it unavailable until the user removes it; do not silently mutate user choices.
- Duplicate remote IDs or unsupported categories: reject the whole remote catalog.

## 9. Testing Strategy

Implementation follows red-green-refactor.

### Unit tests

- Accept the bundled snapshot and every initial entry.
- Reject unknown schema versions, duplicate IDs, invalid categories, malformed repositories, non-GitHub URLs, and blank copy.
- Sort categories, featured skills, and names deterministically.
- Use remote data on a valid response.
- Fall back for network failures, non-200 responses, timeouts, and invalid JSON/contracts.
- Toggle selections without duplicates and preserve stable IDs.
- Produce exact skill-vs-MCP instruction semantics.

### Route/API tests

- `GET /api/skills` returns the stable response shape.
- Snapshot fallback returns `200` with source metadata and no internal error details.
- Unsupported HTTP methods use framework-standard handling.

### Browser tests

- Complete idea and clarification, continue to `/skills`, and see four categories.
- Select skills from multiple categories and preserve them after back/forward navigation.
- Continue with zero selected skills.
- Direct navigation without a draft shows the empty state.
- Mobile and desktop flows remain usable; visual approval is not part of this phase.

## 10. Acceptance Criteria

- AnyMD has a valid version-controlled snapshot with the approved individual skills.
- Runtime code never parses the upstream README.
- A valid remote structured catalog is preferred and cached for six hours.
- Every remote failure mode safely falls back to the complete local snapshot.
- API consumers can distinguish remote from fallback data without receiving sensitive diagnostics.
- Users can select zero or more skills in all four PRD categories and retain the choice across client navigation.
- Skill instructions explicitly require installed-skill checks and explicitly separate skills from MCP access.
- Existing idea, stack, and clarification tests continue to pass.
- Phase 1 visual design remains paused and is not expanded by this work.

## 11. Framework Sources

- Next.js 16 Route Handlers are public HTTP endpoints defined with `route.ts`: bundled docs at `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md` and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.
- Next.js extends server-side `fetch` with persistent cache and numeric revalidation semantics: bundled docs at `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md`.
- Upstream catalog evidence: <https://github.com/vetrns/skills-vault>. At design time, the repository contains a README-based repository catalog and no structured `skills.json` at its root.
