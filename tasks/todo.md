# AnyMD TODO

## Phase 4A2: Identity and Persistence
- [x] Add runtime dependencies and environment contract for Auth.js, Neon, and Stripe.
- [x] Add SQL migration for AnyMD-owned users and OAuth identities.
- [x] Add password hashing and verification with Node `scrypt`.
- [x] Add Auth.js route/config with JWT cookie sessions.
- [x] Add automated Playwright coverage for signup, login, logout, and protected session behavior. (Selectors updated for the current Indonesian UI; live auth execution is blocked by a Neon connection timeout.)
- [x] Add `/login` and `/signup` pages with responsive split-panel layout.
- [x] Refresh login/signup split layout with transparent AnyMD branding and Google/GitHub provider actions. (Playwright-validated on desktop/mobile; provider credential verification remains environment-dependent.)

## Phase 4A3: Queue and Free Quota
- [x] Add durable generation job schema and repository. (Main-branch migration is applied.)
- [x] Add atomic HMAC IP free-quota claim. (Temporary-branch SQL verification passed.)
- [x] Add job submission/status endpoints and polling UI. (Live DB E2E remains.)
- [x] Add retry, timeout, and terminal failure behavior. (Focused worker tests pass.)
- [x] Add Playwright coverage for queued, succeeded, quota-exhausted, and failed generation states. (Full desktop/mobile E2E suite passes.)

## Phase 4A4: Tokens and Stripe
- [x] Add token ledger and atomic debit/refund behavior. (Migration applied to Neon main; runtime generation debit integration remains in Phase 4A5.)
- [x] Add Stripe Checkout endpoint for 10/50/100 token packages. (Live Stripe credentials/runtime checkout verification remains.)
- [x] Add verified, idempotent Stripe webhook handler. (Raw-body signature and event-id idempotency are implemented; repository replay behavior is covered, live Stripe replay remains.)
- [x] Add pricing cards and purchase flow. (Hosted Checkout redirect implemented.)

## Phase 4A5: Integration
- [x] Connect generation to free quota and paid token authorization. (Unit/API coverage passes.)
- [x] Add quota exhausted and purchase recovery states. (Playwright coverage passes.)
- [x] Add end-to-end authenticated generation flow. (Generation E2E passes; authenticated signup remains environment-blocked by Neon connectivity.)

## Final
- [ ] Redesign the full visual system after functional work is stable. (Still requires design-direction approval.)
- [x] Rewrite product copy across the landing and active flow screens. (Preview, phase, and future-feature wording removed from user-facing copy.)
- [x] Place the real pricing cards on the landing page. (The `/pricing` route remains available for direct access.)
- [x] Add on-page SEO foundations and Netlify configuration. (Live title, canonical, robots, sitemap, JSON-LD, Search Console verification, and social metadata were audited; redeploy is required for the latest working-tree assets and tags.)
- [x] Keep product contracts and PRD output templates versioned. (The PRD/product documents are no longer ignored; only credentials, build output, and test artifacts remain excluded.)
- [x] Keep Netlify secrets runtime-only and resolve false-positive scanning for the non-secret model identifier. (Production environment values still need to be replaced/configured in Netlify; generated `.next/cache` is explicitly omitted from the scanner because Next stores evaluated runtime values there.)
- [x] Complete QA, security review, dependency audit, and production verification. (Unit, lint, typecheck, build, header probes, audit, and 18/20 E2E checks pass; Neon auth connectivity and live Stripe/OAuth/provider/deployment checks remain deferred in `docs/qa/final.md`.)
