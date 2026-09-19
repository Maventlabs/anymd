# AnyMD Incremental Implementation Plan

## Architecture Decisions

- Use the Neon project `anymd` (`blue-hill-64864036`), database `anymd`, and the `main` branch. Do not create or mutate remote resources from the app code.
- Use Auth.js (`next-auth`) with a JWT strategy stored in an encrypted, `httpOnly` cookie. No Upstash and no `localStorage` auth tokens.
- Use a custom `app_users`/`app_accounts` schema for AnyMD so it remains separate from the existing `neon_auth` schema.
- Credentials email/password is always available. Google and GitHub are optional providers enabled only when their environment variables exist; email remains the fallback when GitHub is not configured.
- Store passwords using Node's built-in `scrypt` and constant-time verification, avoiding an extra password-hashing dependency.
- Store IP quota keys as HMAC-SHA256 hashes with a server-only pepper. Never persist the raw IP.
- Use Stripe Checkout for one-time token packages: 10 tokens for $2.99, 50 for $11.99, and 100 for $19.99. Credit tokens only from verified, idempotently handled webhooks.
- Keep the current visual system while implementing behavior. Redesign the whole surface only after the functional phases are complete and before the final QA/security phase.

## Phase Order

### Phase 4A1: AI Provider
- Complete. Server-only provider, strict output validation, and one-time 429 retry are already verified.

### Phase 4A2: Identity and Persistence
- Complete for the current scope: AnyMD-owned users/OAuth identities, Auth.js JWT sessions, credentials signup/login, optional Google/GitHub configuration, and responsive `/login` and `/signup` pages are implemented.
- Remaining verification: optional OAuth only when provider credentials are configured.

### Phase 4A3: Queue and Free Quota
- Implementation slice is complete in source; worker-focused tests and Playwright verification pass. Live migration verification remains environment-dependent.
- Enforce one free generation per HMAC IP hash atomically with a unique database constraint and a single SQL statement.
- Use a provider-neutral queue contract; the first local/dev implementation is database-backed and does not depend on Upstash.
- Expose `POST /api/generate` as `202` with a job ID and `GET /api/generate/[jobId]` as the polling/status contract.
- Process queued work through a lease-based worker invoked by status polling, with bounded retry, lease expiry, timeout, and terminal failure states.
- Persist only the validated generation request and validated result bundle needed to resume/poll; never persist the raw IP or provider credentials.

### Phase 4A4: Paid Tokens and Stripe
- Complete for the current slice: token balance/ledger tables are live on Neon main, atomic debit/refund/purchase repository methods are implemented, Checkout Session creation covers all three packages, the raw-body webhook verifies signatures and deduplicates event IDs, and pricing UI redirects to hosted Checkout.
- Remaining verification: replay an actual webhook through Stripe test mode; paid-token debit/refund integration is complete and covered by tests.

### Phase 4A5: Generation Integration
- Complete. Authenticated generation uses free quota or token consumption, the job status contract is implemented, and sign-in/quota/purchase recovery states are covered by tests.

### Final Design, QA, and Security
- Redesign landing/auth/pricing surfaces as one coherent system.
- Final visual redesign remains paused until a new direction is approved; the current `DESIGN.md` is provisional.
- Copy and SEO pass: landing, clarification, skills, pricing, and generation copy now describe shipped behavior without preview, phase, or future-feature claims. The real `PricingTable` appears on the landing page and remains available at `/pricing`.
- SEO foundations: root/page metadata, canonical URLs, Open Graph/Twitter metadata, JSON-LD, `robots.txt`, and `sitemap.xml` are implemented. Netlify build configuration is present in `netlify.toml`; live deployment still requires the public domain and credentials.
- Run unit/API/E2E/build/lint/typecheck/audit checks. (Local gates pass; see `docs/qa/final.md`.)
- Perform security review for auth, IP hashing, webhook handling, rate limits, secrets, and data retention. (Local review documented; durable production rate limiting and credential-backed verification remain deferred.)

## Checkpoints

- After Phase 4A2: signup, login, logout, optional OAuth configuration, and protected session reading pass tests and build.
- After Phase 4A3: concurrent free-generation claims have one winner and job polling is deterministic.
- After Phase 4A4: test webhook replay cannot double-credit tokens and checkout package mapping is fixed.
- Before final redesign: all functional phases are complete and the existing UI remains regression-safe. Unit, lint, typecheck, build, and 20-case desktop/mobile E2E checks pass.

## Deferred Credential and Decision Gates

- Stripe secret and webhook credentials: required for live Checkout and webhook replay.
- Google/GitHub OAuth credentials: required for provider verification.
- AI provider credentials: required for live model generation verification.
- External `skills-vault` access: required to publish the structured catalog upstream.
- Public hosting credentials/domain: required for deployment verification.
- Maintainer decision: choose the open-source license.
- Product/design direction: approve the final visual redesign direction.
- Phase 8 feedback and analytics: deferred pending an explicit event/feedback schema plus consent and retention decisions; no silent tracking was added.

## Verification Result

- `npm test`: 66 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: 19 passed across desktop and mobile Chromium; the single mobile auth failure was caused by a Neon connection timeout during signup. Targeted copy/pricing specs pass: 6 passed across desktop and mobile Chromium.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: passed; only Windows line-ending warnings were reported.
