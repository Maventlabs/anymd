# Final QA and Security Review

Review date: 2026-09-21

## Verified Locally

- `npm test`: 66 tests pass.
- `npm run lint`: pass after excluding generated `.netlify/**` output from source linting.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run test:e2e`: 18/20 desktop/mobile tests pass. The two auth tests receive HTTP 500 because the local Node process cannot reach the active Neon endpoint (`UND_ERR_CONNECT_TIMEOUT`); the Neon control-plane SQL check succeeds, so this is an environment-network blocker rather than a schema failure.
- `npm audit --omit=dev`: zero known vulnerabilities.
- `git diff --check`: no whitespace errors; Git only reported expected Windows line-ending normalization warnings.
- Next.js compilation issues: none.
- Browser console errors on the auth routes: none during the browser UI checks.
- Production response probe returned `200` for `/login`, `401` for `/api/tokens`, and `400` for malformed signup input.
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

- Live Stripe Checkout and webhook replay require Stripe credentials.
- Google/GitHub OAuth verification requires provider credentials.
- Live provider generation requires the configured AI endpoint and key.
- Publishing the structured skills catalog requires access to the external `skills-vault` repository.
- Public deployment requires a hosting target and deployment credentials.
- Final visual redesign requires a new design direction because the current `DESIGN.md` is explicitly provisional.
- Feedback and analytics require an explicit event schema plus consent and retention decisions; no silent tracking was added.
- Durable auth/API rate limiting requires an agreed shared limiter or production platform primitive; the obsolete `/api/sessions` endpoint does not exist in the current architecture.
- Live email auth E2E remains blocked until the local test environment can establish outbound HTTPS connections to the active Neon endpoint. The local `DATABASE_URL` now uses the unpooled read-write host; the endpoint was also explicitly started before the final retry.
- Open-source license selection remains a maintainer decision.
