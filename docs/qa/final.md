# Final QA and Security Review

Review date: 2026-09-24

## Verified Locally

- `npm test`: 86 tests pass, including the tool-call provider response regression, versioned IndexedDB draft-storage contract, queue, token, analytics, and provider contracts.
- `npm run lint`: pass after excluding generated `.netlify/**` and Playwright `test-results/**` output from source linting.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run test:e2e`: 28 tests pass across desktop and mobile Chromium, including auth logout, IndexedDB refresh, clarification stack selection, rebuild feedback, and Phase 4 recovery states. The suite uses one fixed web-server port (`3011`) and one worker because the tests share a Neon-backed dev server.
- `npm audit --omit=dev`: zero known vulnerabilities.
- `git diff --check`: no whitespace errors; Git only reported expected Windows line-ending normalization warnings.
- Next.js compilation issues: none.
- Browser console errors on the auth routes: none during the browser UI checks.
- IndexedDB draft persistence survives refresh in desktop and mobile Chromium; the browser draft remains local until generation.
- Production response probe returned `200` for `/login`, `401` for `/api/tokens`, and `400` for malformed signup input.
- Production OAuth callback was manually verified by the operator; future provider regressions remain an operational monitoring concern.
- Production response headers include CSP, HSTS, frame protection, MIME protection, referrer policy, and permissions policy.
- Standalone real-provider smoke returned HTTP 200 with a valid SSE-generated bundle.
- Authenticated generation smoke passed: job `53493517-ef80-473f-b59e-b464c7f9d28b` returned `202`, then persisted as `succeeded` with `attemptCount=1` and `generatorVersion=2`. The persisted bundle contained non-empty `prd.md`, `AGENTS.md`, and `SESSION.md` documents.
- Stripe test-mode Checkout creation returned a hosted `cs_test_...` session with `livemode=false`; no live charge was created.
- Stripe Sandbox Checkout completed with `livemode=false` using the real hosted Checkout flow. The resulting real `checkout.session.completed` event `evt_1UJDAORl7uKWDdITNnBRDNon` carried the expected `10` token package and authenticated user metadata; the signed local webhook route accepted it and created exactly one `purchase` ledger entry for `+10` tokens.

## SEO and Search Console Verification

- Live homepage currently exposes the expected title, description, canonical URL, `index, follow`, Googlebot directives, JSON-LD, `robots.txt`, and `sitemap.xml`.
- Live pre-deploy check returned `404` for `/googlefc1cf9cb6fcfd597.html` and `/brand/anymd-logo-transparent.png` because both required files were still uncommitted.
- The working-tree production build now verifies the Google HTML file with `200`, emits the Google verification meta tag, emits `og:image` and `twitter:image`, and keeps JSON-LD, canonical, robots, and sitemap output valid.
- Google Search Console verification and sitemap submission were completed by the operator.

## Security Review

- Request bodies are parsed and validated at route boundaries.
- SQL uses parameterized Neon queries; user-controlled values are not concatenated into SQL.
- Passwords use Node `scrypt`; sessions use Auth.js JWT cookies.
- Protected token and generation operations derive the user ID from the server session.
- IP quota values are HMAC-SHA256 hashes and the raw IP is not persisted.
- Generated Markdown is rendered as text, not injected as HTML.
- AI output is parsed through the generated-document contract before reaching the UI.
- Stripe Checkout accepts only an allowlisted package ID and uses verified webhook signatures.
- Production Stripe redirects now require an explicit `ANYMD_APP_URL`; request Host headers are not trusted as the production checkout origin.
- Production responses include HSTS; development keeps HSTS disabled for localhost safety.

## Intentionally Deferred

- Live Stripe Checkout creation and live webhook replay were not executed by design. Stripe CLI automatic forwarding remains unavailable because the current CLI-authenticated account/key lacks access to the app's sandbox account and required `stripecli_session_write` permission; the real sandbox event payload was still verified through the signed local webhook route, including the idempotent ledger contract.
- Google/GitHub provider configuration and production OAuth callback were manually verified by the operator.
- Live provider generation was verified both with a minimal Chat Completions request and a standalone valid bundle response using the configured endpoint and model. The authenticated persisted generation path also passed after adding tool-call argument extraction.
- The published structured skills catalog was verified at the external `skills-vault` raw URL; remote and snapshot entries match.
- Public deployment is live and the latest known deploy is `ready`; authenticated Netlify logs/configuration remain unavailable.
- A future frontend-only redesign is documented in `docs/frontend-only-redesign-scope.md`; backend and functional contracts are frozen for that work.
- Feedback and analytics use an explicit event schema, opt-in consent, and documented retention requirements; no silent tracking was added.

- The explicit analytics/feedback contract is implemented: consent is required, raw prompt/document-like properties are rejected, and feedback is one-time per authenticated user or anonymous browser identity. The Neon migration is applied to `anymd.main`.
- The rebuild endpoint is protected by the shared Neon-backed `rebuild` rate-limit policy; its UI E2E path uses a deterministic rebuild response mock while the route contract remains covered by unit/API tests.
- Generated documents now include the `observability` PRD section, and the initialization prompt/SESSION template no longer contain raw-template syntax errors.
- Durable auth/API rate limiting is implemented with the Neon-backed limiter; the obsolete `/api/sessions` endpoint does not exist in the current architecture.
- Live email auth E2E is locally verified for both desktop and mobile projects in the full Playwright suite; Auth.js uses its built-in redirect path after sign-out to avoid a stalled client session refresh.
- The referenced `vetrns/skills-vault` repository publishes an AnyMD-compatible individual-skill catalog at version `2026.09.21`. Local development may still use a stale Next.js cache until restarted with a clean cache; direct loader validation and production metadata confirm the remote payload.
- The project license is recorded in the root `LICENSE` file; commercial use requires prior written permission.
