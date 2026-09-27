# SESSION.md Output Contract Design

## Goal

Make `SESSION.md` a mandatory third generated document while preserving the
ability to parse and poll already-persisted generator version 1 bundles.

## Contract

New bundles use `generatorVersion: 2` and contain documents in this order:

1. `prd.md`
2. `AGENTS.md`
3. `SESSION.md`
4. `CLAUDE.md` only when the user explicitly enables the bridge

`SESSION.md` is generated from `SESSION-Template-Output-AnyMD.md` with a safe
initial state: the product title is derived from the idea, the current task is
generation handoff, status is `Not started`, and the next action is to read all
three files and inspect the target repository. It must not contain raw prompts,
credentials, or provider response details.

## Compatibility

- `parseGeneratedBundle()` continues accepting generator version 1 bundles with
  the historical two-file or three-file shape.
- Version 2 bundles require `SESSION.md` and reject missing or misordered files.
- Rebuilding a version 1 bundle preserves its original document set and version.
- Rebuilding a version 2 bundle preserves `SESSION.md` unchanged while replacing
  only the requested `prd.md` or `AGENTS.md` section.
- `CLAUDE.md` remains fixed to exactly `@AGENTS.md\n`.

## UI and API Behavior

- The existing generate API continues returning the same JSON envelope.
- The document tab, section preview, raw Markdown preview, copy, and download
  controls discover `SESSION.md` from the bundle rather than hardcoding a
  two-file list.
- The rebuild endpoint accepts only rebuildable `prd.md` and `AGENTS.md`
  sections; `SESSION.md` and `CLAUDE.md` are not rebuild targets in this slice.

## Verification

- Unit tests cover version 2 generation, exact document order, SESSION content,
  parser rejection of malformed version 2 bundles, and version 1 compatibility.
- API tests cover generation and rebuild preservation.
- Typecheck, lint, build, and the existing full suite must pass.
- Browser E2E is rerun only after the source contract changes and when the
  durable Neon boundary is reachable.
