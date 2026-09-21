# Final QA and Security Review

Review date: 2026-09-21

## Verified Locally

- `npm test`: 74 tests pass, including the versioned IndexedDB draft-storage contract.
- `npm run lint`: pass after excluding generated `.netlify/**` output from source linting.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run test:e2e`: 22 tests pass across desktop and mobile Chromium, including the IndexedDB refresh test and Phase 3 local-persistence copy. A parallel invocation can fail before test execution because both Playwright runs start the same fixed port (`3011`); this is test-runner contention, not an application failure.
- `npm audit --omit=dev`: zero known vulnerabilities.
- `git diff --check`: no whitespace errors; Git only reported expected Windows line-ending normalization warnings.
- Next.js compilation issues: none.
- Browser console errors on the auth routes: none during the browser UI checks.
- IndexedDB draft persistence survives refresh in desktop and mobile Chromium; the browser draft remains local until generation.
- Production response probe returned `200` for `/login`, `401` for `/api/tokens`, and `400` for malformed signup input.
- Production `/api/auth/providers` currently returns HTTP `500`; authenticated Netlify logs/configuration were unavailable, so production OAuth is not verified.
- Production response headers include CSP, HSTS, frame protection, MIME protection, referrer policy, and permissions policy.

## SEO and Search Console Verification

- Live homepage currently exposes the expected title, description, canonical URL, `index, follow`, Googlebot directives, JSON-LD, `robots.txt`, and `sitemap.xml`.
- Live pre-deploy check returned `404` for `/googlefc1cf9cb6fcfd597.html` and `/brand/anymd-logo-transparent.png` because both required files were still uncommitted.
- The working-tree production build now verifies the Google HTML file with `200`, emits the Google verification meta tag, emits `og:image` and `twitter:image`, and keeps JSON-LD, canonical, robots, and sitemap output valid.
- After deployment, re-open the Google Search Console verification URL, click Verify, and submit `https://anymd-studio.netlify.app/sitemap.xml`.

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

- Live Stripe Checkout creation and webhook replay were not executed; the configured key passed authentication and invalid-body permission probes.
- Local Google/GitHub provider configuration was verified; production OAuth verification is blocked by `/api/auth/providers` returning HTTP 500.
- Live provider generation was verified with a minimal Chat Completions request using the configured endpoint and model.
- The published structured skills catalog was verified at the external `skills-vault` raw URL; remote and snapshot entries match.
- Public deployment is live and the latest known deploy is `ready`; authenticated Netlify logs/configuration remain unavailable.
- Final visual redesign requires a new design direction because the current `DESIGN.md` is explicitly provisional.
- Feedback and analytics use an explicit event schema, opt-in consent, and documented retention requirements; no silent tracking was added.

- The explicit analytics/feedback contract is implemented: consent is required, raw prompt/document-like properties are rejected, and feedback is one-time per authenticated user or anonymous browser identity. The Neon migration is applied to `anymd.main`.
- Durable auth/API rate limiting is implemented with the Neon-backed limiter; the obsolete `/api/sessions` endpoint does not exist in the current architecture.
- Live email auth E2E is locally verified for both desktop and mobile projects when the Playwright projects are run sequentially or independently. Keep parallel project runs disabled unless the web-server configuration assigns isolated ports.
- The referenced `vetrns/skills-vault` repository publishes an AnyMD-compatible individual-skill catalog at version `2026.09.21`. Local development may still use a stale Next.js cache until restarted with a clean cache; direct loader validation and production metadata confirm the remote payload.
- The project license is recorded in the root `LICENSE` file; commercial use requires prior written permission.
