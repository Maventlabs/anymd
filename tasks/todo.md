# AnyMD TODO

## Phase 4A2: Identity and Persistence
- [x] Add runtime dependencies and environment contract for Auth.js, Neon, and Stripe.
- [x] Add SQL migration for AnyMD-owned users and OAuth identities.
- [x] Add password hashing and verification with Node `scrypt`.
- [x] Add Auth.js route/config with JWT cookie sessions.
- [x] Add automated Playwright coverage for signup, login, logout, and protected session behavior. (Selectors updated for the current Indonesian UI; desktop and mobile auth tests pass when run independently.)
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
- [x] Add end-to-end authenticated generation flow. (Generation and auth E2E pass when Playwright projects run without sharing a test-server port.)

## Final
- [x] Redesign the full visual system after functional work is stable. (Blueprint Studio now aligns landing, auth, pricing, and generator surfaces on shared blue/white instrument tokens; desktop/mobile route checks pass.)
- [x] Rewrite product copy across the landing and active flow screens. (Preview, phase, and future-feature wording removed from user-facing copy.)
- [x] Place the real pricing cards on the landing page. (The `/pricing` route remains available for direct access.)
- [x] Add on-page SEO foundations and Netlify configuration. (Live title, canonical, robots, sitemap, JSON-LD, Search Console verification, and social metadata were audited; the latest deploy is ready at `https://anymd-studio.netlify.app`.)
- [x] Keep product contracts and PRD output templates versioned. (The generated-output template remains versioned; the private product roadmap is kept outside the root and ignored.)
- [x] Keep Netlify secrets runtime-only and resolve false-positive scanning for the non-secret model identifier. (Local credentials are verified; production environment values remain unverified because authenticated Netlify logs/config access is unavailable.)
- [x] Complete QA, security review, dependency audit, and production verification. (Unit, lint, typecheck, build, header probes, AI, database, Stripe Checkout, and local Auth.js checks pass; production OAuth remains blocked by `/api/auth/providers` HTTP 500.)
- [x] Validate and synchronize the upstream skills catalog contract. (Remote `skills.json` now returns AnyMD schema v1 with 25 entries at version `2026.09.21`; the reviewed snapshot metadata is synchronized.)
- [x] Add shared Neon-backed rate-limit policies for signup, generation, and checkout. (Migration is applied to Neon `anymd.main`; all three platform-control tables are present.)
- [x] Add opt-in analytics and one-time privacy-safe generation feedback endpoints. (Only allowlisted scalar analytics properties are accepted; anonymous identity uses a long-lived httpOnly cookie hash.)
- [x] Persist the temporary product draft in browser IndexedDB; do not use Upstash or remote storage for draft state. (Versioned local storage now hydrates `DraftProvider`, debounces writes, clears on reset, and falls back to memory when IndexedDB is unavailable.)
- [x] Verify draft persistence with focused unit tests and desktop/mobile Chromium refresh coverage.
- [x] Replace the upstream repository-index `skills.json` with an AnyMD-compatible individual-skill catalog before enabling remote catalog loading by default. (Remote and local snapshot entries match; production uses the remote catalog when reachable.)
- [x] Run final tests, typecheck, lint, build, and Neon main-schema verification after the platform-controls changes. (74 tests pass; typecheck, lint, build, and all three Neon tables verified.)
