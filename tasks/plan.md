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
- Generated project outputs default to three companion files: `prd.md` for product requirements, `AGENTS.md` for execution rules, and `SESSION.md` for mutable progress/evidence state.
- Production execution is breadth-first across `High/P0` vertical slices, followed by depth/hardening. A task is not complete without real provider or durable-boundary evidence for success, failure, persistence, and verification.
- Product metrics use consented first-party events. The first-visit consent popup gates instrumentation; deployed environments calculate DAU per UTC day and rolling 30-day MAU from salted actor keys, with a default 90-day retention policy.

## Phase Order

### Phase 4A1: AI Provider
- Complete. Server-only provider, strict output validation, and one-time 429 retry are already verified.

### Phase 4A2: Identity and Persistence
- Complete for the current scope: AnyMD-owned users/OAuth identities, Auth.js JWT sessions, credentials signup/login, optional Google/GitHub configuration, and responsive `/login` and `/signup` pages are implemented.
- Production provider discovery and full OAuth callback were manually verified by the operator; local provider configuration and redirect initiation are also verified.
- Profile slice: protected `/profile`, session-derived initials avatar, mobile navbar access, and deterministic client logout navigation are implemented. Authenticated desktop/mobile E2E passes against the configured Neon-backed app.

### Phase 4A3: Queue and Free Quota
- Implementation slice is complete in source; worker-focused tests and Playwright verification pass. The queue migration is live on Neon `anymd.main`.
- Enforce one free generation per HMAC IP hash atomically with a unique database constraint and a single SQL statement.
- Use a provider-neutral queue contract; the first local/dev implementation is database-backed and does not depend on Upstash.
- Expose `POST /api/generate` as `202` with a job ID and `GET /api/generate/[jobId]` as the polling/status contract.
- Process queued work through a lease-based worker invoked by status polling, with bounded retry, lease expiry, timeout, and terminal failure states.
- Persist only the validated generation request and validated result bundle needed to resume/poll; never persist the raw IP or provider credentials.

### Phase 4A4: Paid Tokens and Stripe
- Complete for the current slice: token balance/ledger tables are live on Neon main, atomic debit/refund/purchase repository methods are implemented, Checkout Session creation covers all three packages, the raw-body webhook verifies signatures and deduplicates event IDs, and pricing UI redirects to hosted Checkout.
- Real Stripe Sandbox Checkout and the resulting `checkout.session.completed` payload are verified locally with one `+10` ledger entry and the event ID `evt_1UJDAORl7uKWDdITNnBRDNon`. Automatic Stripe CLI forwarding remains unavailable because the current CLI-authenticated account/key lacks access to the app sandbox and required CLI session permissions; live payment mode stays intentionally deferred.

### Phase 4A5: Generation Integration
- Complete. Authenticated generation uses free quota or token consumption, the job status contract is implemented, and sign-in/quota/purchase recovery states are covered by tests.

### Final Design, QA, and Security
- Redesign landing/auth/pricing surfaces as one coherent system.
- Blueprint Studio is the current direction; the next UI/UX pass is an evidence-led audit and polish cycle.
- Copy and SEO pass: landing, clarification, skills, pricing, and generation copy now describe shipped behavior without preview, phase, or future-feature claims. The real `PricingTable` appears on the landing page and remains available at `/pricing`.
- SEO foundations: root/page metadata, canonical URLs, Open Graph/Twitter metadata, JSON-LD, `robots.txt`, and `sitemap.xml` are implemented. Netlify build configuration is present in `netlify.toml`; the latest known public deploy is ready at `https://anymd-studio.netlify.app`.
- Run unit/API/E2E/build/lint/typecheck/audit checks. (Local gates pass; see `docs/qa/final.md`.)
- Perform security review for auth, IP hashing, webhook handling, rate limits, secrets, analytics consent, and data retention. (Durable rate limiting, opt-in analytics contracts, consented event emission, durable actor keys, metric aggregation, and one-time feedback are implemented.)

### Template Contract Hardening
- Update the PRD template with execution hierarchy, priority mapping, breadth-first rules, Completion rule, MCP/skills evidence, and observability/testing requirements.
- Add `AGENTS-Template-Output-AnyMD.md` and `SESSION-Template-Output-AnyMD.md` before changing the generated bundle implementation.
- Extend the generator schema, provider prompt, parser, preview, download, and tests to produce and preserve `SESSION.md`.
- Add real metric instrumentation and aggregation only after the template contract is accepted; do not claim MAU/DAU from local synthetic traffic. (Instrumentation and queries are deployed; production counts remain traffic-dependent.)

## Checkpoints

- After Phase 4A2: signup, login, logout, optional OAuth configuration, and protected session reading pass tests and build.
- After Phase 4A3: concurrent free-generation claims have one winner and job polling is deterministic.
- After Phase 4A4: test webhook replay cannot double-credit tokens and checkout package mapping is fixed.
- Before final redesign: all functional phases are complete and the existing UI remains regression-safe. Unit, lint, typecheck, build, and 28-case serial desktop/mobile E2E checks pass.

## Deferred Credential and Decision Gates

- Stripe secret and webhook credentials: real sandbox Checkout plus signed replay of its real completion event are verified; live mode is intentionally deferred and automatic Stripe CLI forwarding remains unavailable for the current CLI account/key.
- Google/GitHub OAuth credentials: local and production callback flows were manually verified by the operator.
- AI provider credentials: minimal live Chat Completions verification passed.
- External `skills-vault` access: complete for the currently published individual-skill catalog; remote and local snapshot entries match.
- Public hosting credentials/domain: production deployment and route probes are verified; authenticated build logs remain unavailable.
- Maintainer decision: use the AnyMD Non-Commercial License in `LICENSE`.
- Product/design direction: Blueprint Studio direction approved and implemented across landing, auth, pricing, and generator surfaces.
- Phase 8 feedback and analytics: implemented with explicit event allowlisting, opt-in consent, retention-indexed tables, and one-time feedback keys.

## Verification Result

- `npm test`: 86 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: 28 serial desktop/mobile tests pass; targeted visual route checks show no horizontal overflow at 390px or 1440px.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: passed; only Windows line-ending warnings were reported.

## Current Smoke Gate

- Standalone real-provider smoke succeeded with HTTP 200 and a valid SSE bundle.
- Authenticated Neon submission and polling passed with job `53493517-ef80-473f-b59e-b464c7f9d28b`: `202` queued, then persisted `succeeded` with `attemptCount=1` and `generatorVersion=2`.
- The persisted result contains non-empty `prd.md`, `AGENTS.md`, and `SESSION.md` documents.
- One earlier authenticated attempt returned `500 GENERATION_FAILED` during a transient Neon socket disconnect; the bounded retry path reached a terminal upstream `REQUEST_FAILED` without looping. No persistent queue or schema failure was found.
- The authenticated generation and real sandbox Stripe Checkout/webhook smoke gates are complete. Automatic Stripe CLI forwarding is unavailable for the current CLI account/key; MAU/DAU is intentionally deferred until production traffic exists.
