# AnyMD Product-First Frontend Redesign

**Status:** Direction selected; awaiting specification review before planning/implementation
**Date:** 2026-09-26
**Scope:** Frontend presentation across the current AnyMD routes

## 1. Product Context

AnyMD turns a rough product idea into a clarified brief, recommended task guidance, and reviewable Markdown files for a coding agent. It prepares context; it does not build or execute the product. The design must make the transformation understandable, show the real AnyMD interface, and keep existing account, draft, generation, feedback, and checkout behavior unchanged.

The product's public screens are English-led. Existing Indonesian auth copy remains Indonesian in this presentation redesign; this work does not introduce localization or change the document/output language behavior.

## 2. User-Selected Direction

### Product-first

Use the selected **Product-first** direction from the visual board. The user specified that the hero's composer card belongs at the far left. On desktop the product idea composer is the leftmost hero column; concise headline and supporting explanation sit in the next column. On mobile the content becomes a single readable sequence: promise, explanation, composer, with no clipped or off-screen card.

### Reference lock

- **Primary direction:** real product interface as evidence, compact developer-tool typography, cool light surfaces, clear content hierarchy, and restrained electric blue.
- **Preserve:** AnyMD name and existing logo; `#006EFF` remains the signature accent; factual product claims; readable real interface screenshots; natural page scrolling.
- **Borrow:** product-first hero framing from live SaaS examples; story sequencing from Awwwards scroll-story work; guided one-question-at-a-time structure from onboarding references.
- **Reject:** generic gradient hero, fake customer logos or metrics, decorative 3D/WebGL, scroll hijacking, cards made from placeholder wireframes, and oversized display type that crowds the composer.
- **Media strategy:** capture real AnyMD route states after implementation using the local app. Use those full-screen captures in the two-direction showcase. Do not invent screens and present them as current product screenshots.
- **Motion:** GSAP is the animation engine for content reveals, the landing story transition, and showcase movement. Motion hierarchy is staged and purposeful rather than all elements moving simultaneously.

## 3. Research Findings And Decision Ledger

### References reviewed

Research used Firecrawl web search across Awwwards, Behance, Dribbble, and current SaaS sources, plus Context7 GSAP documentation and component-registry MCPs. Search excerpts are the evidence available for some gallery pages; this document does not claim full-page visual inspection where the source fetch failed.

| Reference | Observed pattern | Adaptation |
|---|---|---|
| [Awwwards: Scroll-driven Storytelling, Synapser Studio](https://www.awwwards.com/inspiration/scroll-driven-storytelling-synapser-studio) | A sequence of scroll states carries the narrative. | Use a small desktop-only story stage to connect idea, clarification, and handoff. Keep native document scrolling and a non-pinned mobile version. |
| [Awwwards: Storytelling collection](https://www.awwwards.com/awwwards/collections/storytelling/) | Scroll position, layout, and content can work as one narrative rather than repeated feature cards. | Give each landing section a different composition while keeping shared tokens and motion cadence. |
| [Awwwards: Blackbook SaaS product/dashboard case](https://www.awwwards.com/inspiration/case-study-saas-product-design-with-dashboard-ui-and-data-visualization-blackbook-talk-to-my-agent) | Product UI is presented as part of a product story. | Use real AnyMD captures as evidence for the showcase and generated-document surface. |
| [Awwwards: Curated Media SaaS 3D site](https://www.awwwards.com/inspiration/saas-3d-website-curated-media) | A high-interaction 3D treatment can create spectacle. | Reject the 3D treatment for AnyMD; retain only the principle that the product story can evolve across scroll sections. |
| [Behance: SaaS Landing Page UI/UX case study](https://www.behance.net/gallery/226313475/SAAS-Landing-Page-Website-Design-UIUX-Case-Study) | A case-study presentation can sequence product capability and interface evidence. | Use asymmetric feature storytelling instead of repeating equal-width card rows. |
| [Behance: Ledgr FinTech SaaS case study](https://www.behance.net/gallery/217370955/Ledgr-FinTech-SaaS-UIUX-Design-Case-Study) | Enterprise product decisions can be grouped as a coherent workflow. | Group clarification and stack decisions into a guided intake workspace with clear progress and answer states. |
| [Behance: Cloud ERP SaaS landing page](https://www.behance.net/gallery/238575793/Cloud-ERP-Landing-page-(ERP-SaaS)) | Capability areas can be conveyed through structured UI surfaces. | Use a deliberate output-file composition, not a marketing illustration. |
| [Dribbble: Baserow onboarding wizard](https://dribbble.com/shots/25303546-Baserow-Onboarding-wizard) | A sequence-oriented onboarding page makes the process visible. | Keep one active question in focus while retaining a clear progress rail and review path. |
| [Dribbble: Multi-step skill-level selection](https://dribbble.com/shots/26385895-Multi-Step-Onboarding-Skill-Level-Selection-UI) | Choice grouping and a single active step reduce form fatigue. | Adapt category grouping to AnyMD's existing question and stack states. |
| [Dribbble: CRM onboarding wizard](https://dribbble.com/shots/23574719-CRM-Onboarding-Wizard-UI) | Step-by-step business setup benefits from strong progress and action hierarchy. | Use a stable back/continue footer region without covering fields or validation messages. |
| [Dribbble: Relay B2B SaaS onboarding](https://dribbble.com/shots/27460155-MVP-B2B-SaaS-Onboarding-UX-Design-Relay) | Show the workflow's value before asking for configuration. | In clarification, keep the current product idea and the current question visible together on desktop. |
| [Userpilot: SaaS landing page examples](https://userpilot.com/blog/saas-landing-pages/) | The Lovable example embeds an idea prompt in its hero; Linear uses product UI to demonstrate the experience. | Keep AnyMD's composer at the far left and show real app state rather than an abstract illustration. |
| [DesignKey: SaaS website patterns for 2026](https://www.designkey.studio/post/saas-website-design-patterns-that-convert-2026) | Current SaaS patterns favor real product UI, concise headlines, transparent pricing, and honest capability boundaries. | Use genuine AnyMD screenshots, retain clear one-time token pricing, and do not manufacture testimonials or usage metrics. |
| [Schema: SaaS pricing page examples](https://schematichq.com/blog/saas-pricing-page-examples) | Simple pricing is visible early; detail can be expanded below. | Keep the existing one-time token choices and make package comparison readable at all widths. |
| [Linear](https://linear.app/) | The product interface itself carries much of the positioning. | Use AnyMD's actual guided form and document workbench as its own visual proof, without cloning Linear's visual identity. |

### MCP/component inventory

Component discovery supplements the visual references above; it does not replace them. Selected entries are adapted to AnyMD's existing flow and GSAP constraint. No new UI or animation package is planned.

| Source/component | MCP inspection | Decision for AnyMD |
|---|---|---|
| ReactBits **Animated Content** | Source inspected. It uses GSAP/ScrollTrigger for a one-time enter transition, but the example sets `visibility` and creates its own effect lifecycle. | **Adapt its small reveal pattern** into a shared `useGSAP`/context-safe reveal layer: 10-16px travel, opacity, grouped stagger, no hidden-content dependency and no separate plugin. |
| ReactBits **Scroll Reveal** | Source inspected. It animates word opacity/blur and slight rotation with scrub; its cleanup calls `ScrollTrigger.getAll().forEach(kill)`, which can kill unrelated route animations. | **Do not install directly.** Reuse only the idea of a controlled word reveal for a small number of headings, using the existing local GSAP `SplitText` component and scoped cleanup. Body paragraphs use short grouped reveals for readability. |
| ReactBits **Tilted Card** | Source and demo inspected. It depends on `motion/react`, tilts up to 14 degrees, scales to 1.1, and labels itself not optimized for mobile. | **Reject direct use.** That distorts genuine product screenshots and adds a second animation system. If a screenshot needs hover feedback, use a very restrained GSAP-only transform and disable it for touch/reduced-motion. |
| ReactBits **Text Reveal** (search result) | The matching scroll reveal is word-progress animation with a tall sticky stage; similar packages use `motion/react`. | **Reject direct use.** A 200vh sticky text section conflicts with the natural-scroll story and GSAP-only constraint. |
| Magic UI **Marquee** | Source/demo inspected. Duplicated children provide the looping pattern, with reverse and hover-pause options. The existing local `components/ui/marquee.tsx` already follows this pattern using CSS keyframes. | **Reuse/adapt the existing markup pattern**, but drive both screenshot lanes with GSAP timelines, equal duplicated tracks, exact half-track travel, pause on hover/focus, and reduced-motion static fallback. Do not install a second marquee. |
| Magic UI **Bento Grid** | Source/demo inspected. The base grid is three equal columns/22rem rows; its demo mixes animated decorative backgrounds and placeholder feature cards. | **Use only as a layout reference.** Build a custom asymmetric feature composition from actual AnyMD content and captures; do not ship its generic card scaffold or decorative animated backgrounds. |
| Magic UI **Text Reveal** | Source inspected. It uses `motion/react`, a 200vh sticky panel, and per-word opacity progress. | **Reject direct use** for the same reasons as ReactBits scroll text: duplicate motion stack, forced tall section, and weak mobile/reduced-motion fit. |
| UI Layouts **Marquee / Infinity Brand** | Search and marquee docs/source inspected. The supplied marquee is a generic CSS track, while Infinity Brand is a logo rail. | **Do not use directly.** Brand logos are not product proof; use actual AnyMD screenshots in the selected GSAP track. |
| 21st.dev **Wizard Steps** (`23576`) | Metadata and source inspected. It has a clickable numbered progress rail, direction-aware panels, keyboard handling, and its own controlled/uncontrolled index/completion model using `motion/react`. | **Adapt the progress-rail visual pattern only.** Do not replace `ClarificationFlow`'s dynamic question/stack/review state machine or permit skipping incomplete steps. Keep the existing progress calculation and navigation handlers. |
| 21st.dev **Header 1** (`8964`) | Metadata and source inspected. It has a sticky scroll-reactive header and animated mobile menu; source uses generic nav/logo placeholders, extra local components, portal/body-overflow behavior, and non-GSAP animation utilities. | **Use the sticky/mobile-menu pattern, not the code.** Build a small custom header with AnyMD anchors, existing login/profile/sign-out state, unchanged destinations, accessible menu state, and scoped GSAP entrance/scroll behavior. |
| 21st.dev **Infinite Moving Cards** (`20136`) | Metadata describes reverse direction, pause-on-hover, and endless tracks. Source retrieval disconnected, so behavior is not verified. | **Do not select it**; Magic UI source plus the project's existing marquee is inspectable and better grounded. |
| 21st.dev **Text Editor Card** (`31793`) | Metadata describes Markdown preview with copy/download and loading/error states. | **Borrow only the file-tab/status framing.** Preserve the existing `DocumentGenerator` copy, download, rebuild, feedback, and polling handlers. |
| Existing local Radix/shadcn **Accordion** and **RadioGroup** | Local implementations retain semantic Radix behavior and are already wired into the product. The registry search did not return installable `@shadcn` items. | **Keep and restyle these local primitives.** Do not replace their keyboard/focus semantics or add redundant registry code. |

21st.dev provided two free source retrievals today; no further component code retrieval is required. Metadata searches remain sufficient for the remaining candidates. The visual-reference table above stays unchanged.

### Refero/GSAP research availability

- **Refero:** the approved `refero-design` skill was installed and its workflow/craft references were read. Live Refero MCP searches returned `NO_SUBSCRIPTION`; Firecrawl search supplied the external visual research instead. Several direct Firecrawl scrape/status calls disconnected, so no full gallery-page scrape is claimed.
- **GSAP documentation:** Context7 confirmed `gsap.matchMedia()` auto-reverts responsive animations and ScrollTriggers, and `@gsap/react` `useGSAP` provides scoped selectors and context cleanup. The implementation must use those lifecycle patterns.

### Design decision ledger

| Decision | Source | Application |
|---|---|---|
| Composer is the first visual anchor and far-left desktop card | User-selected direction 1 | Landing hero grid places the idea composer in the left column and concise product promise to its right. |
| Blue is a restrained brand accent | User choice | Use `#006EFF` for action, selection, progress, and focus; do not paint every section blue. |
| Screenshots must be genuine product captures | User requirement; Awwwards/DesignKey product-UI pattern | Capture current AnyMD routes after the redesign and use them in the marquee. |
| Exactly ten landing sections | Existing E2E expects ten direct child sections; user requires at least nine | Preserve ten section units, redesign their composition and order, and keep stable in-page anchors. |
| One active question, visible progress, editable review | Existing clarification state machine; Dribbble onboarding references | Redesign the shell around the current state machine and keep all validation/navigation handlers intact. |
| Animate important content with GSAP | User requirement; Context7 GSAP docs; Refero motion craft | Use scoped, staggered ScrollTrigger reveals and one controlled story transition; reduced-motion resolves content immediately. |

## 4. Visual System

### Color roles

Use a cool light foundation with blue as the identity accent:

- Canvas: `#F5F7FA`.
- Primary surface: `#FFFFFF`.
- Primary text: `#172033`.
- Secondary text: `#58677A`.
- Structural border: `#D9E1EA`.
- Brand/action accent: existing `#006EFF`.
- Accent-soft state: existing `#E8F1FF`.
- Hover/action blue: `#0058CC`.

Use blue for primary action, selected/active state, progress, link focus, and a small number of section markers. Do not use low-contrast blue for body text. Avoid gradients and invented trust colors. Error and success states keep their semantic meaning and accessible contrast.

### Typography

- Use Geist Sans for navigation, UI, headings, body, labels, controls, and product interfaces. Use Instrument Serif 400 only for the landing hero's editorial tagline; use the system monospace stack only for code/Markdown previews.
- Hero H1 uses Geist Sans 700–800 at `clamp(2.75rem, 4.8vw, 4.75rem)` on desktop and 40–48px on mobile. The Instrument Serif tagline uses `clamp(2.4rem, 4.3vw, 4.25rem)` on desktop and 36–44px on mobile.
- Landing section H2 uses Geist Sans at 44–56px on desktop and 32–38px on mobile. Body copy is 16–18px on desktop / 15–16px on mobile with 1.5–1.65 line-height; navbar is 13–14px, composer/CTA 14–15px, and microcopy 12–13px.
- Keep hero H1-to-tagline spacing at 2–8px, tagline-to-paragraph at 20–26px, and paragraph-to-composer at 24–30px. Display headings use 0.95–1.05 line-height, balanced wrapping, and a controlled measure.
- All headings, labels, prices, and long generated values must wrap safely. Use `min-width: 0`, `text-wrap: balance` for short headings, and `overflow-wrap: anywhere` only where long user content requires it.

### Layout and components

- Content container: `min(1200px, calc(100% - 2 * fluid-gutter))`; fluid gutters narrow to 16px on 320px screens.
- Spacing tokens: 4, 8, 12, 16, 24, 32, 48, 64, 88.
- Radius roles: 8px for controls, 12px for product panels, 16px for major framed screenshots; no pill-shaped everything.
- Cards are used for specific tasks, product state, or price packages, never as the default container for every section.
- Buttons have explicit primary/secondary/quiet roles, minimum 44px touch targets, visible focus, and stable label widths.
- The navbar is a compact sticky header with desktop anchor links, session-specific profile/login actions, the existing CTA, and a real mobile menu state. Its links and return destinations remain unchanged.

## 5. Landing Page Composition

Keep **ten** `main > section` units so the existing route/section smoke assertion can remain stable. Every section gets a distinct layout; the footer remains outside the section count.

1. **Hero and idea composer:** two-column composition; composer card at the far left, promise and supporting copy to the right. Hero title remains controlled in scale. On mobile, use a deliberate vertical order and a visible submit affordance. Research anchor: [Userpilot's Lovable/Linear examples](https://userpilot.com/blog/saas-landing-pages/) and the real-product-UI principle in [DesignKey](https://www.designkey.studio/post/saas-website-design-patterns-that-convert-2026).
2. **Real product showcase:** two infinite screenshot lanes in opposite directions. Use actual captures of AnyMD routes, full screenshot frames with captions and responsive aspect ratios. Hover/focus pauses; reduced-motion shows a still, manually scrollable gallery. Research anchor: [Blackbook's SaaS product/UI case](https://www.awwwards.com/inspiration/case-study-saas-product-design-with-dashboard-ui-and-data-visualization-blackbook-talk-to-my-agent) and the inspected [Magic UI Marquee](https://magicui.design/docs/components/marquee) component pattern.
3. **How the workflow moves:** three-stage scroll story from idea to decisions to files. Desktop may pin one panel briefly with a scrubbed GSAP transition; mobile remains normal flow. Research anchor: [Synapser Studio's Awwwards scroll-story](https://www.awwwards.com/inspiration/scroll-driven-storytelling-synapser-studio).
4. **Output files:** editorial three-file composition for `prd.md`, `AGENTS.md`, and `SESSION.md`. Any excerpts must come from actual output templates or generated output and be labeled accurately. Research anchor: [Behance SaaS landing case study](https://www.behance.net/gallery/226313475/SAAS-Landing-Page-Website-Design-UIUX-Case-Study) and [Cloud ERP landing case](https://www.behance.net/gallery/238575793/Cloud-ERP-Landing-page-(ERP-SaaS)).
5. **Use cases and scope:** asymmetrical feature composition for new products, major features, and project handoff. Explain what AnyMD does and does not do; no fabricated outcome claims. Research anchor: the capability/workflow grouping in [Ledgr FinTech SaaS](https://www.behance.net/gallery/217370955/Ledgr-FinTech-SaaS-UIUX-Design-Case-Study) and [HRMS SaaS dashboard case](https://www.behance.net/gallery/243950145/HRMS-SaaS-Dashboard-Design-Product-Design-Case-Study).
6. **Skills and connections:** a clear contrast between task guidance (Skills) and external service access (MCP), preserving the current truthful product distinction. Research anchor: [HRMS workflow grouping](https://www.behance.net/gallery/243950145/HRMS-SaaS-Dashboard-Design-Product-Design-Case-Study); product truth is governed by the existing AnyMD copy and behavior.
7. **Visual direction:** a product-native specimen for theme and design brief context, using the existing theme preview behavior and genuine interface captures rather than illustrative cards. Research anchor: the capability surfaces in [Cloud ERP SaaS](https://www.behance.net/gallery/238575793/Cloud-ERP-Landing-page-(ERP-SaaS)); AnyMD's available theme presets remain the source of truth for choices.
8. **Draft handling:** a horizontal, responsive local-draft-to-submission state path. Copy remains precise about local draft, submitted generation request, provider, and persisted job result. Research anchor: the honest capability-boundary pattern in [DesignKey's SaaS review](https://www.designkey.studio/post/saas-website-design-patterns-that-convert-2026); the actual local/submitted boundary is sourced from AnyMD behavior, not borrowed product claims.
9. **Pricing:** existing one-time packages, existing checkout CTA/behavior, clear token details, no fabricated savings or recurring plan. Research anchor: the transparent package hierarchy summarized in [SaaS pricing examples](https://schematichq.com/blog/saas-pricing-page-examples).
10. **FAQ and close:** split editorial composition with the existing accessible accordion and a direct CTA that links to the existing idea composer. Research anchor: [Awwwards' storytelling collection](https://www.awwwards.com/awwwards/collections/storytelling/) for the close as the final narrative beat; retain the existing Radix/shadcn accordion semantics for the FAQ.

Do not add logos, testimonials, customer counts, performance numbers, or social proof because verified assets/data for those claims are not present. Use product screenshots and precise output descriptions as product proof.

## 6. Application Route Design

All app surfaces use `min-height: 100svh` rather than fixed viewport height, so small screens and long states can scroll without clipping.

### `/clarify`

- Treat as a professional product-intake workspace.
- Desktop: narrow left progress/context rail, focused question canvas, and a secondary context panel for the idea/selected stack when useful; the current question remains the visual focus.
- Single-choice, text, theme, stack, custom-stack, empty, validation, and review states keep their current semantics and handlers.
- Back/continue actions stay reachable in normal flow; no fixed footer may cover errors or fields.
- Mobile: condensed progress header, one primary column, no decorative side rail, touch-friendly answer rows, and a stacked action row.

### `/skills`

- Full-height review workspace with compact context summary, category grouping, a visible loading/fallback/error state, and a clear completion state.
- Preserve the current recommendation behavior and only the existing recommendation continuation interaction; do not invent editable selection semantics.

### `/generate`

- Full-height document workbench with document tabs, preview mode controls, summary area, copy/download/rebuild actions, feedback state, progress, quota/auth errors, and retry state.
- On desktop use a compact summary rail beside the document; on mobile move summary above tabs, allow tabs to wrap/scroll inside their own bounded region, and keep page width within viewport.
- Markdown remains textually exact; presentation may wrap safely inside its own code surface.

### `/login` and `/signup`

- Full-viewport auth surfaces in the same color/type system, with a restrained product context panel on wide screens and a purpose-built one-column mobile arrangement.
- Preserve labels, form names, validation, provider availability, OAuth actions, callback/redirect behavior, and error presentation.
- Keep current Indonesian auth copy unless a separate copy/localization decision is approved.

### `/pricing` and `/profile`

- `PricingTable` keeps its existing token package data, auth check, idempotency header, and checkout request; only visual hierarchy and responsive package layout change.
- Profile remains an account identity/details view. Do not add settings, usage stats, billing history, or other product capabilities.

## 7. GSAP Motion System

### Required motion coverage

All meaningful headings, paragraphs, labels, product panels/cards, navigation entrance, section transitions, and workflow steps receive GSAP-directed entrances or state transitions. Motion is staggered by semantic group so the hierarchy is legible; it must not fire every object at once.

### Architecture and behavior

- Use the installed `gsap`, `ScrollTrigger`, and `@gsap/react`; do not add animation packages.
- Build a shared, scoped page-motion layer using `useGSAP` and `gsap.matchMedia`. Every context and ScrollTrigger must be reverted on teardown and responsive-query changes.
- Landing hero: a short, ordered timeline for nav, composer, then text, matching the selected composer-left layout.
- Landing sections: ScrollTrigger reveal for `h2`, lead paragraphs, list items, and product panels with one stagger per local group. Use transform/opacity only for reveals; no layout-property animation.
- Story section: desktop-only pin/scrub transition, limited to one bounded section. Mobile uses normal scroll and short reveals.
- Marquee: GSAP `ease: "none"`, duplicated equal-width screenshot tracks, exact loop travel, reverse direction on row two, pause on pointer hover and keyboard focus, resume when focus leaves.
- App flows: brief route-entry/step transition around the existing current question, progress meter tween, tabs and selected-state feedback; state and validation updates remain immediate and interruptible.
- Button press/hover feedback uses short GSAP/CSS-token transitions; do not delay form submission or route navigation for decorative completion.
- `prefers-reduced-motion: reduce`: no pin, scrub, displacement reveal, or auto-playing marquee. Content starts fully visible; progress and state feedback update without movement.
- If JavaScript fails, headings, prose, controls, and screenshots remain visible and usable.

## 8. Protected Behavior And Files

### Frozen behavior

No changes to API route handlers/contracts, server actions, auth/session/OAuth/password flow, Stripe checkout/webhook/token ledger, generation provider/queue/poll/retry, database schema/migrations/queries, analytics event names/consent/retention, IndexedDB schema/timing/submit boundary, validation rules, skill recommendation logic, or output document contracts.

The current worktree already contains frontend and other user changes. Read and preserve existing functional edits before modifying those files. Do not run broad staging commands or discard user changes.

### Expected edit surface

- Presentation: `app/page.tsx`, `app/layout.tsx` only if required for presentation/font metadata, `app/globals.css`, route page shells, presentation components under `components/`, and actual screenshot assets under `public/`.
- Add only small presentational components/hooks where that avoids duplicating layout or GSAP lifecycle code.
- Keep route constants, `onSubmit`/`onClick` behavior, API payloads, state transitions, and URL destinations intact when changing JSX composition.
- No `lib/`, `app/api/`, `db/`, migration, auth config, Stripe, or provider file changes for this redesign.

### Existing behavior selectors to preserve where practical

Keep stable form labels, landmarks, roles, IDs and route behavior used by current E2E: `#idea`, `.wizard`, `.clarify-stage`, `.theme-card`, `.stack-option`, `.skill-card`, `.pricing-card`, `.document-markdown`, and the current accessible button/heading names where the copy does not have a strong reason to change. If copy changes require a test update, update only UI-facing expectations, not application logic.

## 9. Responsive, Accessibility, And Copy Acceptance

- Verify 320x800, 360x800, 390x844, 430x932, 768x1024, 1024x768, 1280x800, 1440x900, and 1920px+ desktop widths.
- No page-level horizontal overflow at any viewport; screenshots, Markdown, long skill names, error messages, e-mail, account IDs, and generated content must wrap or have an explicitly contained internal scroller.
- Keyboard focus, `aria-expanded`, labels, radio semantics, accordion behavior, 44px touch targets, skip links, contrast, 200% zoom, and focus visibility remain intact.
- Keep one meaningful `h1` per route and preserve title/canonical/JSON-LD and crawlable internal links.
- Copy remains truthful, concise, product-specific, and free of em dashes, filler marketing, false capabilities, and unsupported claims.
- The marquee's pause mechanism must work both on pointer hover and keyboard focus; reduced-motion must not require an interaction to reveal content.

## 10. Verification Plan

After the implementation plan is approved and work is complete:

1. Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run test:e2e -- --reporter=line`, `npm audit --omit=dev`, and `git diff --check`.
2. Start AnyMD from this repository on the E2E's expected port (`3011` in `playwright.config.ts`), not the unrelated Next.js servers discovered on ports 3000 and 3101.
3. Verify all eight UI routes in a real browser at desktop and mobile widths; test signed-in/signed-out variants where existing test state permits.
4. Complete the idea → clarify → skills → generate path, and test key loading/error/review states available without external credentials.
5. Check page/body `scrollWidth <= innerWidth`, screenshot crop fidelity, reduced-motion behavior, console errors, and failed requests.
6. Capture true product screenshots only after the actual route screens have been implemented and verified. Use them for the landing marquee; do not check in synthetic wireframes as product evidence.

## 11. Out Of Scope

- Backend changes, database changes, new APIs, auth/payment/generation behavior changes, new product capabilities, or changes to output contracts.
- Full localization, pricing/product strategy changes, real customer logo collection, fake testimonials, or synthetic usage metrics.
- Additional dependencies for a marquee, animation, state management, or UI kit. Existing GSAP and Radix/shadcn primitives are sufficient.
- Scroll hijacking, full-page forced-scroll navigation, constant ambient animation, and motion that ignores reduced-motion preferences.
