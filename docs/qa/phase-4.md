# Phase 4, 4A1, and 5 QA Snapshot

> Historical evidence captured before the later identity, queue, quota, token,
> and Stripe slices. For the current overall status, see `docs/qa/final.md` and
> `PRD-AnyMD-Product.md`.

## Scope

Phase 4 turns the completed memory-only idea, clarification, stack, and skill selection into a structured document bundle containing `prd.md`, `AGENTS.md`, and an optional `CLAUDE.md` bridge. Phase 4A1 sends the validated structural seed to a server-only OpenAI-compatible provider for refinement while preserving the same `GeneratedBundle` contract. Phase 5 adds exact raw Markdown review, clipboard actions, and browser-local file downloads to the responsive `/generate` surface.

## Verified Behavior

- `POST /api/generate` accepts only the exact public request contract and validates the idea, selected stack, visible clarification answers, selected skill IDs, and bridge boolean.
- Skill IDs are resolved against the server-side catalog. Unknown IDs return a stable public error without exposing fetch, stack, or exception details.
- Malformed requests, incomplete clarification, invalid stack values, unknown skills, and unexpected internal failures return stable public error codes.
- The local structural seed remains deterministic for identical input and timestamp.
- Phase 4A1 sends `generatorSystemPrompt`, validated input, selected skills, and the structural seed to the configured provider through server-only `fetch`.
- Provider configuration is read from `ANYMD_AI_BASE_URL`, `ANYMD_AI_API_VERSION`, `ANYMD_AI_MODEL_ID`, and `ANYMD_AI_API_KEY`; missing or invalid configuration returns a generic 503 response.
- Standard Chat Completions JSON and 9router's observed forced-SSE chunk format are normalized before strict `GeneratedBundle` validation.
- JSON wrapped in a provider Markdown fence is unwrapped before the same strict validation; arbitrary malformed output remains rejected.
- One HTTP 429 response is retried after `ANYMD_AI_RETRY_DELAY_MS` (default 60 seconds, validated between 0 and 300 seconds). Other provider errors fail immediately.
- Provider failures and malformed output return a generic public error without forwarding upstream bodies, credentials, stack traces, or provider details.
- Request fields and structural seeds are explicitly treated as untrusted data in the provider system prompt; embedded user instructions cannot override the document contract.
- `prd.md` follows the authoritative `PRD-Template-Output-AnyMD.md` section order, includes adaptive features and phases, Phase QA and Security, stack decisions, proposed API groups, Mermaid source, the initialization prompt, and a changelog.
- Maximum-length accepted input remains within the 4,000-word PRD hard cap.
- `AGENTS.md` includes selected-skill instructions without claiming installation or MCP access, implementation boundaries, data/access context, responsive and accessibility rules, and verification requirements.
- Optional `CLAUDE.md` contains exactly `@AGENTS.md\n`.
- Section rebuild replaces only the requested section and preserves every other section and document.
- `/generate` supports loading, retry, error, direct-route empty, document navigation, bridge opt-in, and section rebuild states.
- `/generate` switches between structured sections and exact raw Markdown, copies either the active file or initialization prompt, and downloads each active document with its original filename.
- Clipboard outcomes use the existing status live region; downloads are constructed from the in-memory bundle and do not send document content back to the server.
- All routes return CSP, anti-framing, MIME sniffing, referrer, and browser-permission headers configured through the version-matched Next.js `headers()` API.
- Desktop and mobile assertions verify that the document has no horizontal page overflow and every visible document card remains inside the viewport.

## Commands

```text
npm test
npm run lint
npm run typecheck
npm run test:e2e
npm run build
```

Verification on 18 September 2026:

- Unit and API tests: 42 passed, including provider configuration, request contract, standard JSON, forced SSE, one-time 429 retry, provider failure, and malformed-output coverage.
- Playwright: 14 passed across desktop and mobile Chromium, including raw preview, clipboard, download, and a 320px narrow-viewport check.
- ESLint, TypeScript, and the Next.js 16.3.4 production build completed successfully.
- Next.js runtime MCP reported all expected routes with no compilation, configuration, or session errors.
- A live local 9router smoke request through `/api/generate` returned HTTP 200 with `prd.md` and `AGENTS.md`; browser UI tests stub the provider intentionally so they remain deterministic and offline-safe.
- Browser MCP loaded the application with no console warnings or errors.
- Desktop and mobile screenshots showed no clipped content, card escape, page-level overflow, or inaccessible interaction.
- `npm audit --omit=dev` reported 0 known production dependency vulnerabilities.
- A production-server response check confirmed every configured security header and omitted the framework-powered header.

## Historical Limits at Capture Time

- Queueing, quotas, free-generation enforcement, and payment were later Phase 4A work at the time this snapshot was captured; those slices are now implemented, with live credential-backed verification still deferred.
- Hosted deployments use the public 9router tunnel as `ANYMD_AI_BASE_URL`; local development uses `http://localhost:20128`. `localhost` is not a production fallback because a Netlify function cannot reach the maintainer's machine.
- Generated content remains in React memory and is cleared by refresh.
- Mermaid is emitted as fenced source and is not rendered as SVG or canvas in this phase.
- Rebuild remains deterministic and uses the same submitted input; provider-backed section alternatives are future work.
- Next.js request insights are not enabled; route, compilation, session-error, and browser-console diagnostics were available and passed.
- Generation and rebuild controls prevent overlapping requests, but there is no dedicated rapid-toggle race E2E beyond those runtime guards.
- Final visual approval for the broader AnyMD product remains deferred.
