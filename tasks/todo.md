# AnyMD TODO

## Phase 4A2: Identity and Persistence
- [x] Add runtime dependencies and environment contract for Auth.js, Neon, and Stripe.
- [x] Add SQL migration for AnyMD-owned users and OAuth identities.
- [x] Add password hashing and verification with Node `scrypt`.
- [x] Add Auth.js route/config with JWT cookie sessions.
- [x] Add automated Playwright coverage for signup, login, logout, and protected session behavior. (Existing credentials coverage passes when Neon is reachable.)
- [x] Add `/login` and `/signup` pages with responsive split-panel layout.
- [x] Refresh login/signup split layout with transparent AnyMD branding and Google/GitHub provider actions. (Credentials login and manual production OAuth callback verification are complete.)

## Phase 4A3: Queue and Free Quota
- [x] Add durable generation job schema and repository. (Main-branch migration is applied.)
- [x] Add atomic HMAC IP free-quota claim. (Temporary-branch SQL verification passed.)
- [x] Add job submission/status endpoints and polling UI. (Durable Neon migration and the authenticated generation path are covered; real provider generation remains a separate smoke gate.)
- [x] Add retry, timeout, and terminal failure behavior. (Focused worker tests pass.)
- [x] Add Playwright coverage for queued, succeeded, quota-exhausted, and failed generation states. (Full desktop/mobile E2E suite passes.)

## Phase 4A4: Tokens and Stripe
- [x] Add token ledger and atomic debit/refund behavior. (Migration applied to Neon main; runtime generation debit integration remains in Phase 4A5.)
- [x] Add Stripe Checkout endpoint for 10/50/100 token packages. (Sandbox Checkout works; live payment mode is intentionally deferred.)
- [x] Add verified, idempotent Stripe webhook handler. (Raw-body signature and event-id idempotency are implemented; the real sandbox `checkout.session.completed` event `evt_1UJDAORl7uKWDdITNnBRDNon` was accepted locally and produced one `+10` purchase ledger entry.)
- [x] Add pricing cards and purchase flow. (Hosted Checkout redirect implemented.)

## Phase 4A5: Integration
- [x] Connect generation to free quota and paid token authorization. (Unit/API coverage passes.)
- [x] Add quota exhausted and purchase recovery states. (Playwright coverage passes.)
- [x] Add end-to-end authenticated generation flow. (Generation and auth E2E pass in the full desktop/mobile Playwright suite.)

## Final
- [x] Redesign the full visual system after functional work is stable. (Blueprint Studio now aligns landing, auth, pricing, and generator surfaces on shared blue/white instrument tokens; desktop/mobile route checks pass.)
- [x] Rewrite product copy across the landing and active flow screens. (Preview, phase, and future-feature wording removed from user-facing copy.)
- [x] Place the real pricing cards on the landing page. (The `/pricing` route remains available for direct access.)
- [x] Add on-page SEO foundations and Netlify configuration. (Live title, canonical, robots, sitemap, JSON-LD, Search Console verification, and social metadata were audited; the latest deploy is ready at `https://anymd-studio.netlify.app`.)
- [x] Keep product contracts and PRD output templates versioned. (The generated-output template remains versioned; the private product roadmap is kept outside the root and ignored.)
- [x] Keep Netlify secrets runtime-only and resolve false-positive scanning for the non-secret model identifier. (Production environment values are active for Auth.js and sandbox payments; secret values remain runtime-only.)
- [x] Complete QA, security review, dependency audit, and production verification. (Unit, lint, typecheck, build, header probes, AI, database, real sandbox Stripe Checkout, signed replay of its real completion event, authenticated persisted generation, production Auth.js provider checks, OAuth manual verification, and GSC sitemap submission pass; automatic Stripe CLI forwarding and MAU/DAU remain deferred.)
- [x] Validate and synchronize the upstream skills catalog contract. (Remote `skills.json` now returns AnyMD schema v1 with 25 entries at version `2026.09.21`; the reviewed snapshot metadata is synchronized.)
- [x] Add shared Neon-backed rate-limit policies for signup, generation, and checkout. (Migration is applied to Neon `anymd.main`; all three platform-control tables are present.)
- [x] Add opt-in analytics and one-time privacy-safe generation feedback endpoints. (Only allowlisted scalar analytics properties are accepted; anonymous identity uses a long-lived httpOnly cookie hash.)
- [x] Persist the temporary product draft in browser IndexedDB; do not use Upstash or remote storage for draft state. (Versioned local storage now hydrates `DraftProvider`, debounces writes, clears on reset, and falls back to memory when IndexedDB is unavailable.)
- [x] Verify draft persistence with focused unit tests and desktop/mobile Chromium refresh coverage.
- [x] Replace the upstream repository-index `skills.json` with an AnyMD-compatible individual-skill catalog before enabling remote catalog loading by default. (Remote and local snapshot entries match; production uses the remote catalog when reachable.)
- [x] Run final tests, typecheck, lint, build, and Neon main-schema verification after the platform-controls changes. (86 unit/API tests and 28 serial desktop/mobile E2E tests pass; typecheck, lint, build, analytics actor-key migration, indexes, and consent event insertion verified.)

## Template Contract Hardening
- [x] Update `PRD-Template-Output-AnyMD.md` with hierarchy, High/Medium/Low priority mapping, production breadth-first execution, the Completion rule, MCP/skills requirements, and observability/testing/MAU/DAU definitions.
- [x] Add `AGENTS-Template-Output-AnyMD.md` as the production execution protocol for generated projects.
- [x] Add `SESSION-Template-Output-AnyMD.md` as the default execution ledger and E2E retest ledger.
- [x] Extend the generated output contract to produce `SESSION.md` alongside `prd.md` and `AGENTS.md`. (Generator version 2 emits the mandatory ledger; version 1 persisted bundles remain parseable; 86 unit/API tests pass.)
- [x] Add unit, integration, contract, E2E, provider smoke, persistence, and metric verification requirements to generated QA guidance. (The authoritative PRD template now defines the verification matrix, completion rule, provider/durable-boundary smoke evidence, persistence/failure requirements, and MAU/DAU evidence fields.)

## Next Product Work
- [x] Pindahkan pemilihan stack dari landing ke flow klarifikasi dan dokumentasikan kontraknya. (Landing hanya menerima ide; spec disetujui di `docs/superpowers/specs/2026-09-22-clarification-stack-selection-design.md`; implementasi selector automatic/manual di klarifikasi tetap menjadi langkah berikutnya.)
- [x] Phase 2: Expand the stack catalog to at least 10 named options per applicable category and require a verified visible icon for every option. (Six categories now expose 10 named options plus `Open`; every option renders a Lucide-backed icon in automatic, manual, and review states. Playwright verified desktop flow, manual validation, icon counts, and IndexedDB refresh persistence.)
- [x] Add authenticated `/profile` page and session-aware navbar avatar. (Profile uses server-validated Auth.js session fields and does not add a database dependency to the page render.)
- [x] Add Playwright E2E for profile navigation, auth guard, avatar, and logout on desktop/mobile. (Full desktop/mobile auth coverage passes against the configured Neon-backed app.)
- [x] Run a real authenticated generation smoke test against `PRD-Template-Output-AnyMD.md`. (Job `53493517-ef80-473f-b59e-b464c7f9d28b` returned `202`, persisted as `succeeded` on the final poll, and included non-empty `prd.md`, `AGENTS.md`, and `SESSION.md` documents.)
- [x] Add consented event emission, anonymous actor hashing, and durable metric queries. (First-visit consent popup, browser event smoke, `actor_key` migration, and Neon-backed query contract are verified; production MAU/DAU remains traffic-dependent.)
- [x] Perform desktop/mobile UI/UX audit and implement the approved redesign polish. (Production build audited at desktop and 390px mobile widths; screenshots captured under `artifacts/`, no horizontal overflow was observed, and production browser console errors were zero.)
- [x] Run final production smoke tests and remove stale QA/checklist claims. (86 unit tests, 28 serial desktop/mobile E2E tests, typecheck, lint, build, diff check, authenticated persisted generation, and real sandbox Stripe Checkout/webhook replay pass. Automatic Stripe CLI forwarding and MAU/DAU are intentionally deferred.)
