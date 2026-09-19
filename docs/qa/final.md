# Final QA and Security Review

Review date: 2026-09-20

## Verified Locally

- `npm test`: 66 tests pass.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run test:e2e`: 20 desktop/mobile tests pass.
- `npm audit --omit=dev`: zero known vulnerabilities.
- `git diff --check`: no whitespace errors; Git only reported expected Windows line-ending normalization warnings.
- Next.js compilation issues: none.
- Browser console errors on the landing page: none.
- Response headers include CSP, frame protection, MIME protection, referrer policy, and permissions policy.

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
- Open-source license selection remains a maintainer decision.
