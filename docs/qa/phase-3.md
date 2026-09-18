# Phase 3 QA

## Scope

Phase 3 adds a curated individual-skill catalog, remote-or-snapshot resolution, `GET /api/skills`, memory-only skill selection, and deterministic instructions for a future `AGENTS.md` generator.

## Verified Behavior

- The bundled snapshot contains 25 unique skills across the four PRD categories.
- Architecture and code-quality entries are featured and sourced from `mattpocock/skills`.
- The remote payload must pass complete boundary validation before use.
- Valid remote data wins over the local snapshot.
- Network failures, non-200 responses, invalid JSON, invalid schema versions, duplicate IDs, invalid categories, and invalid source URLs fall back safely.
- Remote error details are not returned to API consumers.
- Successful remote fetches request a six-hour Next.js revalidation lifetime.
- `/skills` supports zero or more selections and retains stable IDs across client navigation.
- Direct `/skills` navigation without a completed memory-only draft shows an honest empty state.
- The generated instruction formatter requires installed-skill checks and explicitly states that skill selection does not prove MCP availability.

## Commands

```text
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

Verification on 16 September 2026:

- Unit tests: 19 passed.
- Playwright: 6 passed across desktop and mobile Chromium.
- ESLint, TypeScript, and the Next.js production build completed successfully.
- Desktop and mobile screenshots showed no blocking overflow or inaccessible interaction.

## Known Limits

- `vetrns/skills-vault` does not yet publish the structured root `skills.json`; the default request therefore uses the verified snapshot until that upstream file exists.
- The durable fallback is version-controlled. Runtime route handlers do not write a new snapshot because deployments may use ephemeral/serverless filesystems.
- Selection remains in React memory and is cleared by refresh.
- AnyMD does not install or inspect local skills, call an AI provider, generate documents, or infer MCP availability.
- Final visual approval is deferred; this phase only requires a usable responsive selection flow.
