# AnyMD Frontend-Only Redesign Contract

Status: implementation contract
Date: 2026-09-24
Owner: AnyMD frontend work

## Objective

Redesign the complete AnyMD visual experience one page and one section at a time. The redesign must improve hierarchy, brand clarity, copy quality, mobile and desktop usability, accessibility, SEO, and interaction polish without changing the product behavior that already works.

This document is the contract for the redesign. Every implementation decision must be traceable to a section below, the existing `DESIGN.md`, or a reviewed product requirement.

## Product And Design Source Of Truth

- Product purpose and truthful capability claims come from `PRODUCT.md`.
- Existing visual tokens and the Blueprint Studio direction come from `DESIGN.md`.
- The current product prepares `prd.md`, `AGENTS.md`, `SESSION.md`, and optional `CLAUDE.md`; it does not execute generated code.
- The visual system currently uses a deliberate white and voltage-blue language. Do not add unrelated accent colors, invented proof, fake metrics, or generated website claims.
- If the visual direction changes materially, update `DESIGN.md` before implementing the change. Do not silently create a second design system in page-specific CSS.

## Non-Negotiable Scope Lock

The following are frozen and must not change during a visual redesign:

- API routes, HTTP methods, request schemas, response schemas, status codes, and error contracts.
- Neon schema, migrations, queries, repositories, persistence semantics, and database ownership.
- Auth.js configuration, sessions, OAuth callbacks, credentials auth, password handling, and route protection.
- Stripe Checkout, webhook verification, token ledger, debit, credit, purchase, refund, and quota behavior.
- Generation queue, leases, retries, polling, provider selection, prompts, parsing, and failure semantics.
- IndexedDB draft persistence, local draft timing, draft recovery, and submit boundaries.
- Analytics event names, consent rules, retention, actor identity, and metric queries.
- Validation rules, URL structure, route guards, navigation destinations, and business logic.
- Generated document contracts and the structure of `prd.md`, `AGENTS.md`, `SESSION.md`, and optional `CLAUDE.md`.

Do not rewrite a working flow merely to make its markup look cleaner. Preserve the existing state machine and change only presentation, layout, content clarity, and interaction affordances.

## Allowed Changes

- Layout, page composition, responsive breakpoints, and component placement.
- Typography, color roles, spacing, borders, shadows, surfaces, and visual assets.
- Accessible markup improvements that preserve behavior and state semantics.
- Presentation of loading, empty, error, success, quota, checkout, and recovery states.
- Frontend copy improvements that remain truthful and do not alter API or product contracts.
- CSS transitions and animations that do not alter state, timing, persistence, or navigation semantics.
- Component extraction only when it reduces duplication or makes responsive and accessibility behavior safer.

## Required Skills

Load and apply the relevant skills before changing a page or component. The skill is not complete until its applicable checks are represented in the implementation or verification notes.

- `design-taste-frontend`: establish a distinctive visual direction and reject generic AI layouts.
- `frontend-ui-engineering`: implement production-quality, semantic, responsive UI.
- `responsive-design`: choose mobile-first constraints, fluid sizing, container behavior, and breakpoint transitions.
- `accessibility` and `accessibility-compliance`: preserve WCAG-oriented semantics, keyboard use, focus, labels, contrast, reduced motion, and touch usability.
- `seo`: preserve and improve metadata, heading hierarchy, canonical URLs, internal links, and structured data without inventing claims.
- `copywriting`: make page copy specific, useful, and conversion-aware without overpromising.
- `avoid-ai-writing`: remove generic, inflated, repetitive, or machine-sounding copy.
- `visual-design-foundations`: validate typography, color roles, spacing rhythm, and icon use.
- `interaction-design`: make state changes and controls legible without decorative motion.
- `performance`: avoid unnecessary assets, layout thrashing, and animation cost.
- `web-design-guidelines`: review the final UI against interface quality and usability patterns.

Use existing project dependencies and components where possible. Do not add a dependency only to reproduce a common interaction that CSS, semantic HTML, or the current stack already supports.

## Page And Section Inventory

Implement and verify the following surfaces in order. A section is not considered complete until its desktop, mobile, keyboard, reduced-motion, copy, and overflow behavior are checked.

### 1. Landing Page: `/`

1. Header and navigation
   - Logo, primary anchors, profile or login state, sign-out state, and start CTA.
   - Desktop navigation must remain readable without crowding.
   - Mobile navigation must have a deliberate compact layout; never allow links or actions to force viewport overflow.
2. Hero and idea composer
   - Product promise, supporting copy, laser atmosphere, and `IdeaWizard`.
   - Keep the primary action visible and usable at 320px wide.
   - Long ideas, validation messages, controls, and action rows must wrap inside the component.
3. Illustrative product showcase
   - Showcase heading, honesty label, preview frames, and marquee behavior.
   - Marquee motion may clip only its decorative track inside a bounded section; it must never create page-level horizontal scroll or hide essential content.
4. How it works
   - Sticky narrative column, process steps, numbers, descriptions, and status labels.
   - On mobile, convert the sticky two-column story into a readable single flow.
5. Output files
   - `prd.md`, `AGENTS.md`, and `SESSION.md` document surfaces.
   - Three document surfaces may become a stacked sequence on narrow screens; do not force a three-column layout below its readable width.
6. Clarify the brief
   - Explanation, example question, and adaptive-question framing.
   - Preserve the distinction between clarification and assumption.
7. Skills and tools
   - Skills versus MCP comparison, icons, labels, and descriptions.
   - Preserve the product distinction between local guidance and external tool access.
8. Visual direction
   - Type specimen, palette, visual rules, and explanation.
   - Keep swatches and specimen content meaningful, labeled, and accessible.
9. Draft handling and privacy
   - Browser draft, submit boundary, queued server-side state, privacy note, and lock icon.
   - Copy must remain precise about what stays local and what is sent after submission.
10. FAQ
   - Accessible accordion, questions, answers, CTA, and intended-use framing.
   - Accordion content must expand within the viewport and must not clip or push the page wider.
11. Landing pricing
   - Pricing heading, quota explanation, `PricingTable`, signed-in behavior, and return path.
   - Preserve the existing pricing and checkout semantics; only change visual presentation.
12. Footer
   - Brand, product description, privacy anchor, source link, and attribution.
   - Links must wrap or stack on mobile rather than overflow.

### 2. Authentication: `/login` and `/signup`

1. Auth shell and brand entry.
2. Heading, explanation, and mode-specific copy.
3. Email and password fields, labels, validation, and password affordances.
4. Google and GitHub OAuth actions when configured.
5. Loading, server error, invalid credential, and duplicate-account presentation.
6. Login/signup mode switch and return navigation.

Keep auth errors understandable without exposing implementation details. Preserve provider availability, form names, submit behavior, and redirect behavior.

### 3. Clarification Flow: `/clarify`

1. Product context and progress indicator.
2. Question heading, question body, and optional explanation.
3. Text, choice, and multi-choice answer controls.
4. Validation and required-answer feedback.
5. Back, continue, skip, and completion actions.
6. Loading, recovery, and draft persistence messaging.

On mobile, question content must remain the dominant surface. Actions should be reachable without excessive scrolling and should not be fixed in a way that obscures answers.

### 4. Skill Review: `/skills`

1. Context summary and progress state.
2. Recommended-skill list and skill descriptions.
3. Selection controls, selected state, and deselection state.
4. Advanced stack or disclosure controls.
5. Back and continue actions.
6. Loading, empty, error, and retry presentation.

Long skill names, descriptions, URLs, and labels must wrap. No card may impose a fixed minimum width that exceeds the viewport.

### 5. Document Generation: `/generate`

1. Generation header and progress state.
2. Summary rail or summary block.
3. Document navigation or tabs.
4. Structured document view.
5. Raw Markdown view and code-like content surface.
6. Section rebuild controls and rebuild state.
7. Copy and download actions.
8. Token, quota, checkout, and authentication messaging.
9. Pending, success, partial, error, retry, and recovery states.
10. Mobile document navigation and action layout.

Document content must be readable on narrow screens. Prefer wrapping, stacked metadata, and responsive tabs over forcing the application shell wider. If a code surface genuinely requires horizontal scrolling, contain it inside the output surface, provide an accessible label, and ensure the page itself remains within the viewport.

### 6. Pricing: `/pricing`

1. Pricing header, logo, and return navigation.
2. Pricing promise and token explanation.
3. Package table or package list.
4. Included quota, token expiry statement, and package details.
5. Signed-out CTA and signed-in checkout action.
6. Checkout loading, success, cancellation, and error presentation.

On mobile, package content must become a readable stack or an explicitly bounded comparison view. Never rely on page-level horizontal scrolling to expose a pricing package.

### 7. Profile: `/profile`

1. Profile header, back navigation, and sign-out action.
2. Account heading and account explanation.
3. Identity block and avatar treatment.
4. Account details list.
5. Loading, unauthenticated redirect, and error presentation if applicable.

Do not invent settings, usage data, billing history, or profile fields that the current product does not provide.

## Responsive Contract

Responsive behavior is a first-class requirement, not a final polish pass.

- Design mobile-first, then add desktop composition where the content benefits from it.
- Verify at minimum at 320x800, 360x800, 390x844, 430x932, 768x1024, 1024x768, 1280x800, and 1440x900.
- Treat 320px as the minimum supported layout width unless an existing browser constraint proves otherwise.
- Use fluid sizing with `clamp()`, `minmax(0, 1fr)`, `min-width: 0`, wrapping, and content-aware constraints instead of fixed desktop widths.
- Every grid must have a narrow-screen fallback. Every flex row must define how it wraps or stacks.
- Navigation, CTA groups, toolbars, tabs, pricing packages, document bars, and footer links must have an explicit mobile arrangement.
- Touch targets should be at least 44x44 CSS pixels where practical.
- Text must not be truncated when it carries meaning. Use wrapping before ellipsis; if ellipsis is necessary, expose the full value accessibly.
- Long user text, Markdown, skill names, URLs, error messages, and generated content must wrap with `overflow-wrap: anywhere` or an equivalent safe rule where needed.
- Icons must not shrink into illegible controls or create unexpected intrinsic width.
- Sticky and fixed elements must not cover essential content, keyboard focus, form actions, or error messages.
- Motion and marquees must degrade safely on coarse pointers, small screens, and reduced-motion preferences.
- Use `overflow: hidden` or `overflow: clip` only to contain a known decorative layer. Never use it to conceal a layout bug or hide essential content.

## No-Overflow Contract

Every page and component must satisfy all of the following:

- `document.documentElement.scrollWidth <= window.innerWidth` at each required viewport.
- `document.body.scrollWidth <= window.innerWidth` at each required viewport.
- No visible component extends beyond the viewport or is clipped at its interactive edge.
- No grid track, flex item, image, SVG, preformatted block, table, marquee, dialog, tooltip, or dropdown creates accidental page-level horizontal scroll.
- Images and media use responsive sizing and preserve their intended aspect ratio.
- Long words and generated content wrap without changing the document contract.
- Any intentional inner scroll region is bounded, labeled, keyboard-accessible, and does not move the page horizontally.
- Browser zoom at 200 percent remains usable for core flows where the existing browser and test setup support it.

Do not declare the overflow requirement satisfied merely because the body uses `overflow-x: hidden`. The cause must be fixed at the component or layout boundary.

## Accessibility Contract

- Keep one meaningful `h1` per page and preserve a logical heading order.
- Use semantic landmarks, buttons for actions, links for navigation, and labels for every form control.
- Preserve visible focus styles and logical keyboard order.
- Do not communicate state with color alone.
- Maintain readable contrast for text, icons, borders, focus rings, and disabled states.
- Dialogs, accordions, tabs, menus, disclosures, and tooltips must preserve their keyboard and screen-reader semantics.
- Respect `prefers-reduced-motion`; content and state changes must remain available without animation.
- Do not remove text labels merely to make a mobile toolbar look cleaner.
- Error messages must be associated with the relevant control and remain visible after validation.
- Verify touch and keyboard use independently; passing a mouse-only visual check is insufficient.

## SEO Contract

- Preserve or improve page titles, descriptions, canonical URLs, and meaningful route metadata.
- Keep heading text aligned with the actual product promise and page intent.
- Preserve valid JSON-LD and escape user-controlled or generated values before embedding them.
- Keep internal links crawlable and descriptive.
- Do not add keyword-stuffed copy, hidden text, fake reviews, fake metrics, or unsupported claims.
- Do not change route paths or indexing behavior without a separate SEO decision.
- Landing page copy must distinguish illustrative references from generated websites.

## Anti-AI-Slop Visual Rules

- No generic blue-purple or rainbow gradient as a substitute for art direction.
- No decorative gradient background by default. A gradient is allowed only when it has a documented product or interaction purpose and is approved in `DESIGN.md`.
- No default glassmorphism, excessive blur, floating dashboard mockups, or translucent cards without a clear hierarchy role.
- No interchangeable card grid where a stronger editorial, sequential, or tool-oriented composition is available.
- No excessive rounded rectangles, pill-shaped everything, oversized emoji, or decorative icons without meaning.
- No random glow, noise, grain, cursor trail, parallax, or hover effect added only to make a page feel busy.
- No fake customer proof, usage numbers, benchmark claims, generated websites, or testimonials.
- No invented product capabilities such as executing code, installing skills, or verifying MCP access in the browser.
- Use a limited palette with explicit color roles. Do not add a new accent color to solve a local hierarchy problem.
- Prefer typography, spacing, rules, contrast, and meaningful motion over decoration.
- Keep visual asymmetry intentional and make it collapse cleanly on mobile.

## Copy Contract

- Write in direct, specific, human language.
- State what AnyMD does and does not do.
- Remove filler, hype, vague AI language, repeated benefits, and unsupported superlatives.
- Avoid phrases such as "revolutionary", "seamless", "unlock your potential", "next-generation", and similar generic claims unless a specific, verifiable meaning is supplied.
- Do not use em dashes in UI copy or documentation produced for this redesign.
- Keep labels short and actions explicit: users should know what happens before they click.
- Preserve technical names where they are product contracts: `prd.md`, `AGENTS.md`, `SESSION.md`, `CLAUDE.md`, Skills, MCP, tokens, and generation.
- Run the final copy through `avoid-ai-writing` and `copywriting` review before marking a section complete.

## Section-By-Section Workflow

For each section, use this sequence and record the result in the relevant work log or PR description:

1. Capture the current screenshot and behavior at desktop and mobile sizes.
2. Identify the section's user job, state variants, content contract, and responsive risks.
3. Load the relevant design, responsive, accessibility, SEO, copy, and performance skills.
4. Implement the smallest visual change that solves the section's problem.
5. Test keyboard, focus, reduced motion, touch, loading, error, empty, success, and recovery states that the section exposes.
6. Check page-level and component-level overflow at every required viewport.
7. Compare the result against `DESIGN.md`, `PRODUCT.md`, and this contract.
8. Run the verification gate before moving to the next section.

Do not redesign all routes in one unverified batch. A later section must not invalidate a completed section's responsive or behavior checks.

## Protected Behavior Checklist

Before and after each increment, preserve these journeys:

- Signup, login, logout, OAuth initiation, and protected profile access.
- Free generation, paid token generation, quota exhaustion, and recovery states.
- Checkout creation, webhook handling, token balance, debit, purchase credit, and refund behavior.
- Clarification, stack selection, skill selection, IndexedDB draft persistence, and generation polling.
- Structured document review, raw Markdown review, section rebuild, clipboard copy, and download.
- `prd.md`, `AGENTS.md`, `SESSION.md`, and optional `CLAUDE.md` output structure.

## Verification Gate

Every visual redesign increment must pass:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `npm audit --omit=dev`
- `git diff --check`

The E2E suite must continue to use the fixed port `3011` and one worker because the tests share the Neon-backed development server.

Browser QA must additionally verify:

- No horizontal overflow at every required viewport.
- Desktop and mobile screenshots for the changed page and its important states.
- Keyboard navigation and visible focus.
- Reduced-motion rendering.
- Authenticated and unauthenticated variants where relevant.
- Loading, error, empty, success, quota, checkout, and recovery states where relevant.
- Console errors and failed network requests introduced by the change.

## Acceptance Criteria

- Only frontend presentation, accessible markup, content clarity, and visual assets change.
- No backend, database, auth, payment, analytics, generation, or business-logic files change for cosmetic reasons.
- If a presentational bug requires a logic change, document the exception and review it separately before implementation.
- Every listed route has a deliberate desktop and mobile composition.
- Every listed component is usable without accidental horizontal overflow.
- Core flows remain functionally identical.
- Keyboard navigation, focus visibility, semantic labeling, contrast, touch targets, and reduced-motion behavior remain valid.
- Before and after screenshots exist for landing, auth, clarification, skills, pricing, profile, and generation surfaces.
- Copy is specific, truthful, human, and free of generic AI patterns.
- No decorative gradient or other anti-slop violation is introduced without a documented design decision.

## Deferred Product Metrics

MAU/DAU verification is intentionally deferred until production has meaningful real traffic. No synthetic traffic should be presented as production usage evidence.

## Current External Verification State

- Google Search Console sitemap submission: completed by the operator.
- Google/GitHub OAuth manual verification: completed by the operator.
- Stripe sandbox webhook replay: pending CLI authentication and local/public endpoint setup.

## Latest Redesign Verification

- `npm run test:e2e -- --reporter=line`: 28 tests passed across desktop and mobile Chromium.
- The generation flow explicitly checks the 320px layout for page overflow, document cards, toolbar, navigation, Markdown output, and summary surfaces.
- The suite uses one worker and the fixed port `3011`.
- A known React hydration warning reports a client-added `caret-color` style in the idea textarea. It does not fail the suite and is isolated to the browser caret behavior used by the input component.
