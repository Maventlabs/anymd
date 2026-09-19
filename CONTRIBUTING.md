# Contributing to AnyMD

AnyMD is still before its first public release. Keep changes small, preserve the
document contract, and do not present unfinished roadmap items as shipped.

## Development Workflow

1. Review the existing product and generated-document contracts before editing behavior.
2. Create `.env.local` from `.env.example`; never commit credentials.
3. Add or update a failing test before changing behavior.
4. Implement the smallest change that satisfies the requirement.
5. Run the complete verification set:

   ```powershell
   npm test
   npm run lint
   npm run typecheck
    npm run build
    npm run test:e2e
    npm audit --omit=dev
    git diff --check
   ```

6. Update the product roadmap and relevant `docs/qa/` evidence when behavior or
phase status changes.

The current consolidated verification and deferred-work record is
`docs/qa/final.md`; older phase files are historical evidence for the phase they
describe.

## Project Rules

- Preserve the default two-file output: `prd.md` and `AGENTS.md`.
- Keep the optional Claude bridge exactly `@AGENTS.md` followed by a newline.
- Preserve stable section IDs and ordering unless the authoritative template changes.
- Keep `prd.md` at or below the 4,000-word hard cap.
- Render user and provider Markdown as text unless a reviewed sanitizer is added.
- Keep AI credentials and provider response details out of client bundles and public errors.
- Treat skills and MCP servers as different mechanisms.
- Do not add placeholder controls, simulated success, or unsupported product claims.

## Adding a Skill

The public catalog is expected at
`https://github.com/vetrns/skills-vault/blob/main/skills.json`. Each entry must
match the schema enforced by `lib/skills.ts` and include:

- a lowercase kebab-case `id`
- a user-facing `name` and specific `description`
- one supported `category`
- the source repository and URL
- `featured` or `standard` priority

Validate catalog changes with `npm test`. Update `data/skills.snapshot.json` only
after the upstream catalog is reviewed; this file is the last-known-good fallback,
not an independent source of truth.

## Pull Request Checklist

- Tests demonstrate the behavior change and relevant failure paths.
- Desktop and mobile layouts have no page-level horizontal overflow.
- Accessibility names, keyboard behavior, focus, and live feedback remain usable.
- No secret, raw IP address, payment data, or unneeded personal data is introduced.
- Documentation describes what is actually implemented.

## License

A project license has not been selected yet. Contributions should not assume MIT,
Apache-2.0, GPL, or another license until the maintainer records that decision and
adds a root license file.
