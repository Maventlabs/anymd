# AnyMD Product-First Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Keep the task order and stop for review at the stated checkpoints.

**Goal:** Deliver the approved Product-first redesign across all eight AnyMD UI routes while preserving existing state, API, auth, payment, generation, persistence, and output behavior.

**Architecture:** Use one shared cool-light/blue-accent design system, a scoped GSAP motion surface for app routes, the existing GSAP SplitText for selected display headings, and custom presentation layouts around existing stateful components. Redesign the route flows first, then capture genuine screens from the finished routes and use them in the landing screenshot marquee. Keep the current route logic in place and limit behavior changes to accessible presentation controls such as the responsive mobile navigation.

**Tech Stack:** Next.js App Router, React 19, TypeScript, self-hosted Geist Sans and Instrument Serif fonts, GSAP 3, ScrollTrigger, `@gsap/react`, existing Radix Accordion/RadioGroup, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-26-anymd-frontend-redesign.md`

## Global Constraints

- No changes to API route handlers/contracts, server actions, auth/session/OAuth/password flow, Stripe checkout/webhook/token ledger, generation provider/queue/poll/retry, database schema/migrations/queries, analytics event names/consent/retention, IndexedDB schema/timing/submit boundary, validation rules, skill recommendation logic, or output document contracts.
- All app surfaces use `min-height: 100svh` rather than fixed viewport height.
- Keep ten `main > section` units on `/` and keep stable in-page anchors.
- Use the installed `gsap`, `ScrollTrigger`, and `@gsap/react`; add no animation or UI packages.
- Before the corresponding implementation steps, load `design-taste-frontend` and `impeccable` for craft review, `copywriting` and `avoid-ai-writing` for route copy, and `seo` for metadata/link/schema checks. These skills supplement the approved reference lock and must not override it.
- The hero composer is the far-left desktop column. Any landing showcase image must be a real capture of an implemented AnyMD route.
- `prefers-reduced-motion: reduce` disables pin, scrub, displacement reveals, and autoplay marquee; content stays visible.
- Do not add fake customer proof, metrics, testimonials, placeholder screenshot cards, or unsupported capabilities.
- Preserve the existing dirty worktree and unrelated user files. Do not run `git add`, commit, or push unless the user requests it.
- E2E stays serial with one worker and the fixed webServer port `3011` in `playwright.config.ts`.

---

## File Map

- `DESIGN.md`: final tokens, media roles, section rhythm, component roles, and motion rules.
- `PRODUCT.md`: read-only source of truth for accurate capability claims and copy.
- `app/globals.css`: consolidated visual tokens and responsive route/section styles; remove superseded styling as each route is migrated.
- `components/page-motion.tsx` (new): scoped GSAP reveal behavior for non-landing routes.
- `components/landing-motion.tsx`: landing-only hero sequence, section reveals, and story-scene ScrollTrigger lifecycle.
- `components/site-header.tsx` (new): responsive AnyMD navigation using real anchor links and session actions passed from the existing server page.
- `components/ui/marquee.tsx`: preserve the existing component contract while replacing its CSS-keyframe motion with the approved GSAP track loop.
- `components/site-showcase.tsx`: render real screenshot assets, captions, and opposite-direction marquee lanes.
- `components/idea-wizard.tsx`: change the composer card's presentation and markup only; preserve `useDraft`, validation, `submitIdea`, and `/clarify` navigation.
- `components/clarification-flow.tsx`: reshape the current state machine into the full-height intake workspace; preserve answer validation, question transitions, review, stack behavior, and analytics calls.
- `components/skill-selection.tsx`: presentation of loading, fallback, recommendations, empty/error, and completion states; preserve recommendation logic and continuation behavior.
- `components/document-generator.tsx`: presentation of generation, tabs, Markdown, copy/download/rebuild, feedback, quota, and retry states; preserve every current request and handler.
- `components/auth-form.tsx`, `components/pricing-table.tsx`, `components/sign-out-button.tsx`, `app/pricing/page.tsx`, `app/profile/page.tsx`: restyle existing auth, package and profile surfaces without changing their actions or route targets.
- `app/page.tsx`: ten landing sections, navigation, copy, and anchor destinations.
- `e2e/phase-1.spec.ts`: update only stale landing style/illustration assertions; keep the idea-to-clarify assertions.
- `e2e/presentation-layout.spec.ts` (new): route/viewport no-overflow and reduced-motion smoke coverage.
- `scripts/capture-showcase.ts` (new) and `public/showcase/*.webp` (generated): reproducible local capture of real route states for the marquee.

## Task 1: Establish Baseline And Presentation Regression Tests

**Files:**
- Create: `e2e/presentation-layout.spec.ts`
- Read only: `playwright.config.ts`, `e2e/phase-1.spec.ts`, `e2e/phase-2-stack.spec.ts`, `e2e/phase-3.spec.ts`, `e2e/phase-4.spec.ts`, `e2e/auth.spec.ts`

**Interfaces:** The layout check reads public route state only; it must not mutate application APIs or backend data. UI routes: `/`, `/clarify`, `/skills`, `/generate`, `/pricing`, `/login`, `/signup`, `/profile`.

- [ ] **Step 1: Add the route-width smoke test**

Use a fixed route list and check the root/body width after each navigation at 320px and 1440px. Profile may redirect to login when anonymous; that redirect is expected.

```ts
const routes = [
  "/",
  "/clarify",
  "/skills",
  "/generate",
  "/pricing",
  "/login",
  "/signup",
  "/profile",
];

for (const width of [320, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of routes) {
    await page.goto(route);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - window.innerWidth,
      body: document.body.scrollWidth - window.innerWidth,
    }));
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.body).toBeLessThanOrEqual(1);
  }
}
```

- [ ] **Step 2: Run the new test against the current UI**

Run: `npm run test:e2e -- --project=desktop-chromium e2e/presentation-layout.spec.ts --reporter=line`
Current reproduced finding: at `/` and 320px, `.nav-cta` spans x=282..374 because logo, login and CTA plus flex gaps cannot fit the 288px shell. The marquee clones extend far outside the viewport but are clipped by their track; they are not the root cause. Keep the diagnostic offender list until all route checks pass.

- [ ] **Step 3: Capture before screenshots**

Use the browser at 1440x900 and 390x844 for `/`, `/clarify` empty state, `/skills` empty state, `/generate` empty state, `/pricing`, `/login`, `/signup`, and `/profile` redirect. Store these only under the Playwright/visual QA artifact directory, not under `public/showcase`.

- [ ] **Step 4: Verify baseline application and test commands**

Run: `npm run lint`
Run: `npm run typecheck`
Run: `npm test`
Run: `npm run test:e2e -- --reporter=line`
Expected: record existing failures as baseline; do not modify logic or unrelated files to make a baseline failure disappear.

## Task 2: Build Shared Tokens And Scoped GSAP Reveal Surface

**Files:**
- Create: `components/page-motion.tsx`
- Modify: `components/landing-motion.tsx`
- Modify: `app/globals.css`
- Modify: `DESIGN.md`
- Test: `e2e/presentation-layout.spec.ts`

**Interfaces:**
- `PageMotion` accepts `{ children: React.ReactNode; className?: string }` and scopes animation selectors to its root.
- Components opt into motion through `data-gsap="reveal"`, `data-gsap="group"` with `data-gsap-item` children, or landing-only `data-gsap="hero"`; unmarked content remains visible.

- [ ] **Step 1: Add the shared page-motion shell**

Register `ScrollTrigger` and `useGSAP` once. Use `gsap.matchMedia()` to only create motion under `prefers-reduced-motion: no-preference`. The hook scope is the wrapper root. Do not add an `opacity: 0` CSS default.

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type PageMotionProps = { children: ReactNode; className?: string };

export function PageMotion({ children, className = "" }: PageMotionProps) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const animate = (targets: HTMLElement | HTMLElement[], trigger: HTMLElement, stagger = 0) => {
        gsap.fromTo(targets, { autoAlpha: 0, y: 14 }, {
          autoAlpha: 1, y: 0, duration: 0.4, stagger, ease: "power2.out",
          scrollTrigger: { trigger, start: "top 88%", once: true },
        });
      };
      root.current?.querySelectorAll<HTMLElement>('[data-gsap="reveal"]').forEach((item) => {
        animate(item, item);
      });
      root.current?.querySelectorAll<HTMLElement>('[data-gsap="group"]').forEach((group) => {
        const items = Array.from(group.querySelectorAll<HTMLElement>("[data-gsap-item]"));
        if (items.length) animate(items, group, 0.055);
      });
    });
    return () => media.revert();
  }, { scope: root });
  return <div ref={root} className={className}>{children}</div>;
}
```

- [ ] **Step 2: Add staggered reveal setup and cleanup**

For each reveal group animate only `opacity` and `y` (10-16px), duration 0.35-0.45s, ease `power2.out`, and a short 0.04-0.07s stagger. Use once-only ScrollTriggers for below-fold content. `useGSAP` scope and `gsap.matchMedia().revert()` must clean up on unmount/breakpoint change.

- [ ] **Step 3: Coordinate landing motion**

Update `LandingMotion` so it uses the same durations/eases, runs the `data-gsap="hero"` nav/composer/text timeline, groups `data-gsap-item` children, and does not also animate a node marked for the generic page reveal. Keep the existing `SplitText` component's registered plugin and cleanup; avoid double-animating an `h2` that already uses `SplitText`.

- [ ] **Step 4: Consolidate the design tokens**

In `app/globals.css`, define the spec's cool-light canvas, white surface, ink, secondary text, border, existing AnyMD blue accent, spacing scale, radius roles, typography scale, and motion durations. Retire old duplicated page-specific blocks only after their route's new styles are active.

- [ ] **Step 5: Update `DESIGN.md`**

Apply `design-taste-frontend` after the reference lock and use `impeccable` as a craft audit, not as a competing design authority. Record Product-first direction, composer-left hero, screenshot media role, 10-section landing map, GSAP/reduced-motion rules, and selected/rejected component roles from the spec.

- [ ] **Step 6: Run foundation checks**

Run: `npm run lint`
Run: `npm run typecheck`
Expected: PASS; no API, `lib/`, `db/`, or auth configuration files are changed.

## Task 3: Redesign Clarification As A Full-Height Guided Intake

**Files:**
- Modify: `components/clarification-flow.tsx`
- Modify: `components/use-stage-motion.ts` only if required to avoid duplicate route-entry animation
- Modify: `app/globals.css`
- Test: `e2e/phase-2-stack.spec.ts`, `e2e/phase-3.spec.ts`

**Interfaces:** Preserve `useDraft()`, `visibleQuestions`, `clarificationProgress`, `validateAnswer`, `updateAnswer`, `stackCategories`, stack selection handlers, theme IDs, and the existing `/` and `/skills` destinations.

- [ ] **Step 1: Add a presentational desktop intake frame**

Keep a progress/context rail, the existing active question in a central focus panel, and a useful idea/stack context panel. Wrap the current view with `PageMotion` and tag static entrance targets; keep alerts/live text out of reveal selectors. Do not derive new questions or allow navigation to an incomplete question.

- [ ] **Step 2: Map existing UI states into the same shell**

Keep separate render branches for empty idea, current question, stack selection, review, validation error, and completion. Apply the same panel/header/footer class structure without changing branches' handler bodies.

- [ ] **Step 3: Add the mobile arrangement**

At narrow widths collapse the rail/context into a compact progress header, use one column for fields, and stack back/continue buttons. Long choice names and custom stack labels wrap; no fixed footer obscures textareas/errors.

- [ ] **Step 4: Add GSAP to the current step transition**

Preserve the current question-key lifecycle and progress calculation. Use a short route/stage entrance with `useGSAP`, `matchMedia`, cleanup, and immediate state updates. Do not delay `setClarification` or validation.

- [ ] **Step 5: Verify the existing intake and stack journeys**

Run: `npm run test:e2e -- --project=desktop-chromium e2e/phase-2-stack.spec.ts e2e/phase-3.spec.ts --reporter=line`
Run: `npm run test:e2e -- --project=mobile-chromium e2e/phase-2-stack.spec.ts e2e/phase-3.spec.ts --reporter=line`
Expected: automatic/manual stack counts, theme selection, review/edit, back, and recommendation navigation all still pass.

## Task 4: Redesign Skills And Generated-Document Workbench

**Files:**
- Modify: `components/skill-selection.tsx`
- Modify: `components/document-generator.tsx`
- Modify: `app/globals.css`
- Test: `e2e/phase-3.spec.ts`, `e2e/phase-4.spec.ts`

**Interfaces:** Preserve `/api/skills`, `/api/generate`, `/api/generate/[jobId]`, `/api/generate/rebuild`, `/api/feedback`, all request payloads, `selectedSkillIds`, retry/polling, and `trackAnalytics` calls.

- [ ] **Step 1: Make `/skills` a review workspace**

Use a compact progress/context summary, readable category grouping, skill name/description/source, and clear loading, snapshot fallback, error, retry, and completion states. Wrap list and completion states in `PageMotion`, tagging static headings and card groups. Recommendations remain read-only as in current behavior.

- [ ] **Step 2: Keep the recommendation controls and timing**

The existing button remains disabled until a catalog loads, continues with the same `recommendedIds`, and saves only through its current `setDraft` call. No new selection/deselection model is added.

- [ ] **Step 3: Make `/generate` a responsive document workbench**

Keep the document tabs, sections/raw switch, section rebuild buttons, copy/download actions, bridge checkbox, feedback form, generation status, auth/quota/error states, and empty state. Wrap stable workbench panels in `PageMotion`; do not animate or delay live status/alerts. Move visual controls into a responsive toolbar; contain Markdown scrolling within the preview rather than the page.

- [ ] **Step 4: Animate workbench entrance without changing jobs**

Mark static labels/panels for GSAP reveal; leave `aria-live`/status announcements, button enablement, async requests, abort behavior, and queue polling immediate and unchanged.

- [ ] **Step 5: Verify recommended skills and document tasks**

Run: `npm run test:e2e -- --project=desktop-chromium e2e/phase-3.spec.ts e2e/phase-4.spec.ts --reporter=line`
Run: `npm run test:e2e -- --project=mobile-chromium e2e/phase-3.spec.ts e2e/phase-4.spec.ts --reporter=line`
Expected: recommendation grouping, bridge checkbox, generated tabs, exact Markdown copy/download, section rebuild, empty/retry/quota states all retain their current outcomes.

## Task 5: Redesign Auth, Pricing, Profile, And Shared Navigation

**Files:**
- Create: `components/site-header.tsx`
- Modify: `app/page.tsx`
- Modify: `components/auth-form.tsx`
- Modify: `components/pricing-table.tsx`
- Modify: `components/sign-out-button.tsx` only for visual class/size if required
- Modify: `app/pricing/page.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `app/globals.css`
- Test: `e2e/auth.spec.ts`, `e2e/presentation-layout.spec.ts`

**Interfaces:** `SiteHeader` receives `signedIn` and optional display initials/label from the existing server session; links remain `#how-it-works`, `#output`, `#principles`, `#pricing`, `/profile`, `/login`, and `#idea`.

- [ ] **Step 1: Build the custom header and mobile menu**

Use the AnyMD brand asset and existing signed-in actions. At 320px keep the logo and menu button in the top row and move anchor links, login/profile/signout, and the primary idea CTA into the expanded mobile panel; this removes the measured `.nav-cta` overflow without clipping. Add `aria-expanded`, `aria-controls`, Escape/selection close behavior, and the existing route/anchor destinations. Do not add generic 21st.dev placeholder links or lock body scroll by overwriting another component's body style.

- [ ] **Step 2: Make pricing, auth, and profile share tokens**

Keep the current auth form names/labels/redirects/OAuth availability, token package data, login-required redirect, Stripe idempotency header, and profile protection. Wrap auth, pricing, and profile surfaces in `PageMotion`, tagging static panels only. Use existing words where E2E depends on them; remove only generic prose that is replaced with truthful concise copy.

- [ ] **Step 3: Check header/auth/pricing behavior**

Run: `npm run test:e2e -- --project=desktop-chromium e2e/auth.spec.ts --reporter=line`
Run: `npm run test:e2e -- --project=mobile-chromium e2e/auth.spec.ts --reporter=line`
Run: `npm run lint` and `npm run typecheck`
Expected: signup, login redirect, profile guard, signout, and configured provider presentation remain intact.

## Task 6: Rebuild The Landing Page With Ten Distinct Sections

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/idea-wizard.tsx`
- Modify: `components/landing-motion.tsx`
- Modify: `app/globals.css`
- Test: `e2e/phase-1.spec.ts`

**Interfaces:** Preserve `IdeaWizard` form contract, starter prompts, `validateIdea`, local draft updates, submit/clarify route, auth/profile state, `PricingTable` signed-in/return path, JSON-LD, canonical metadata, FAQ accordion behavior, and existing anchor IDs.

- [ ] **Step 1: Place the idea card at the far-left of the desktop hero**

Use a two-column grid where the composer card is the first visual element on the left and the concise promise/supporting copy is on the right. On mobile place the readable heading/copy first and the composer immediately after. Preserve the actual `textarea`, help text, counter, starter prompts, privacy note, validation alert, and submit button.

- [ ] **Step 2: Recompose the ten sections**

Implement the exact section order from the spec: hero/composer, real product showcase, workflow story, three outputs, use cases/scope, Skills vs MCP, visual direction, draft handling, pricing, FAQ/close. Give each section its own layout rather than repeating a heading-and-card grid.

- [ ] **Step 3: Rewrite only copy that conflicts with the product**

Load `copywriting` and `avoid-ai-writing`, and read `PRODUCT.md` for capability truth. Keep these titles short and factual: “A clearer brief for the work ahead.”, “See the work take shape.”, “Make the first build more intentional.”, “Three files. One shared direction.”, “Guidance is not access.”, “Your draft stays here until you submit it.” Use no em dashes, testimonials, invented metrics, or claims that AnyMD installs Skills/builds software. Apply the same copy pass to auth, pricing, clarify, skills, generation, and profile states while keeping current field labels/accessible names where E2E or auth behavior relies on them.

- [ ] **Step 4: Maintain testable anchors and accessibility**

Preserve IDs `idea`, `how-it-works`, `output`, `principles`, `privacy`, and `pricing`; use semantic landmarks, one `h1`, actual headings, descriptive links, and the current `Accordion`/skip-link behavior. Load `seo` before changing page title/description, canonical metadata, JSON-LD, or internal-link copy; preserve route indexing and structured-data facts.

- [ ] **Step 5: Update only stale landing assertions**

In `e2e/phase-1.spec.ts`, keep the exact ten-section count, idea submit flow, pricing package count, and clarify navigation. Replace obsolete alternating-band and wireframe assertions with new section landmarks. Update the heading expectation only if approved copy changes its accessible name. Add the real screenshot/caption assertion in Task 7 after the captures are installed.

- [ ] **Step 6: Verify desktop and mobile landing behavior**

Run: `npm run test:e2e -- --project=desktop-chromium e2e/phase-1.spec.ts --reporter=line`
Run: `npm run test:e2e -- --project=mobile-chromium e2e/phase-1.spec.ts --reporter=line`
Expected: exactly ten direct landing sections; starter input, button, and route transition still work.

## Task 7: Capture Genuine Product Screens And Finish GSAP Marquee

**Files:**
- Modify: `components/site-showcase.tsx`
- Modify: `components/ui/marquee.tsx`
- Create: `scripts/capture-showcase.ts`
- Create: `public/showcase/idea-composer.webp`, `public/showcase/clarify-intake.webp`, `public/showcase/skill-review.webp`, `public/showcase/document-workbench.webp`
- Modify: `e2e/phase-1.spec.ts`

**Interfaces:** A showcase shot is `{ src: string; alt: string; caption: string }`. Captures are produced from the real local Next.js UI at 1440x900; document generation is mocked only for the capture script using the existing deterministic generator and the same response contract as `e2e/phase-4.spec.ts`.

- [ ] **Step 1: Add an explicit capture script**

Use Playwright already installed in the repo. Navigate through the real idea form and existing clarification/skills flows. Intercept only generation network calls for the capture run; do not alter production API or server logic. Save WebP screenshots at `public/showcase/` with full viewport contents, preserving the whole screen and captions.

- [ ] **Step 2: Verify the captures correspond to real routes**

For each asset record the source pathname and viewport in the script. Capture the product as rendered; do not draw a replacement UI in HTML/CSS or crop away the identifying route surface.

- [ ] **Step 3: Implement a GSAP-driven two-lane loop**

Reuse the existing `Marquee` component contract and repeated-track pattern. Ensure each animated track has two identical halves, use linear GSAP motion over exactly one half-track, reverse the second lane, pause on pointer enter and keyboard focus, resume on exit/focus-out, and kill/revert timelines on unmount. Under reduced motion show a static horizontally scrollable image row.

- [ ] **Step 4: Add honest image labels and dimensions**

Set descriptive `alt`, width/height or aspect ratio, captions including source route, eager-load only the first visible image, and lazy-load offscreen frames. All screenshots use `object-fit: contain` so the real interface is not misleadingly cropped.

- [ ] **Step 5: Update the showcase E2E assertion and verify the gallery**

Replace the old `Illustrative Client portal product concept` assertion with an assertion that the real route screenshot and its caption are present. Keep the reduced-motion variant static and inspect the rendered image's natural aspect ratio.

- [ ] **Step 6: Verify gallery continuity and no overflow**

Run: `npm run test:e2e -- --project=desktop-chromium e2e/phase-1.spec.ts --reporter=line`
Run: `npm run test:e2e -- --project=mobile-chromium e2e/phase-1.spec.ts --reporter=line`
Manually test reverse direction, seamless join, hover pause/resume, keyboard focus pause/resume, 320px layout, and reduced-motion static gallery.

## Task 8: Cross-Route Responsive, Motion, Copy, And Accessibility Pass

**Files:**
- Modify: `e2e/presentation-layout.spec.ts`
- Modify: `e2e/phase-1.spec.ts` only if a displayed copy assertion changed
- Modify: `app/globals.css` and presentation component files only for verified findings
- Modify: `DESIGN.md` only to record final implementation details already in the spec

**Interfaces:** Tests cover UI selectors/accessible names and document overflow only; no API contract, database fixture, or backend test is changed to force a pass.

- [ ] **Step 1: Expand overflow route coverage**

Test all eight UI routes at 320px and 1440px using `document.documentElement.scrollWidth` and `document.body.scrollWidth`. Keep the profile redirect as an expected route outcome.

- [ ] **Step 2: Check motion preferences**

Run landing and clarification under both `reducedMotion: "reduce"` and `"no-preference"`. Verify content remains visible in reduce mode and that a normal-motion reveal does not change route state or submit timing.

- [ ] **Step 3: Check keyboard and touch**

Tab through nav, menu, idea form, clarification controls, tabs, pricing buttons, and FAQ. Confirm focus is visible, menu closes on Escape and navigation, and card pause controls are reachable by focus.

- [ ] **Step 4: Run final automated checks**

Run: `npm run lint`
Run: `npm run typecheck`
Run: `npm run build`
Run: `npm test`
Run: `npm run test:e2e -- --reporter=line`
Run: `npm audit --omit=dev`
Run: `git diff --check`
Expected: all checks pass, except any separately documented pre-existing environment-only gate; do not modify server/business logic to mask a UI failure.

- [ ] **Step 5: Capture final visual evidence**

Capture all eight UI routes at desktop and mobile sizes plus `/clarify` question, stack, validation, and review states and `/generate` sections/raw/error states. Review console/network failures and compare the actual marquee screenshots to the route views they claim to depict.

- [ ] **Step 6: Complete copy, SEO, and visual craft review**

Apply `copywriting` and `avoid-ai-writing` to visible copy on all routes, then `seo` to metadata, canonical links, JSON-LD, heading hierarchy, and internal anchors. Use `impeccable` and `design-taste-frontend` against the approved reference lock. Fix only verified presentation/copy/accessibility issues; keep backend and business logic unchanged.

## Execution Notes

- Complete tasks sequentially so the screenshot assets are captured only after all route UIs are final.
- Keep the visual references and component decisions in the spec as the source of truth; do not introduce another style direction during implementation.
- The plan intentionally contains no commit commands. The user previously requested manual commits; leave staging and commit operations to the user unless they explicitly ask otherwise.
