# AnyMD Design System

> Product-first workspace: clear decisions, real interface proof, agent-ready output.

## Visual Thesis

AnyMD should make the path from rough idea to a usable coding-agent brief visible. The landing hero puts the working idea composer in the far-left desktop column and the product promise beside it. Across marketing and app routes, cool light surfaces provide calm reading space; the existing voltage blue is reserved for action, progress, selection, and focus. Actual AnyMD screens, not CSS wireframes, show the product at work.

## Color Roles

| Role | Value | Rule |
| --- | --- | --- |
| Canvas | `#F5F7FA` | Cool neutral page background |
| Surface | `#FFFFFF` | Forms, document panes, and screenshot frames |
| Ink | `#172033` | Main headings and body text |
| Secondary text | `#58677A` | Supporting prose and metadata; preserve contrast |
| Structural line | `#D9E1EA` | Dividers, input borders, and panel boundaries |
| AnyMD blue | `#006EFF` | Primary action, active state, progress, focus, and sparse markers |
| Blue soft | `#E8F1FF` | Selected/quiet state surfaces only |
| Action hover | `#0058CC` | Primary button hover/pressed state |

- Blue is an accent, not a default full-section background.
- Never use low-contrast blue for body text; derive state tints from the approved roles.
- Keep success, warning, and error colors semantic and readable.
- Do not add decorative gradients, invented trust colors, or random accent colors.

## Typography

- Use Geist Sans for navigation, UI, headings, body, labels, controls, and product interfaces. Use Instrument Serif 400 only for the landing hero's editorial tagline; never use it in forms, cards, dashboards, or app routes. Keep system monospace for code/Markdown only.
- Hero H1: Geist Sans 700–800, `clamp(2.75rem, 4.8vw, 4.75rem)` desktop and `40–48px` mobile, line-height `0.95–1.0`, tracking near `-0.04em`.
- Hero tagline: Instrument Serif 400, `clamp(2.4rem, 4.3vw, 4.25rem)` desktop and `36–44px` mobile, line-height near `0.98`.
- Keep the landing hierarchy controlled: navbar `13–14px`, small brand `14–16px`, hero/body copy `15–18px`, composer `14–15px`, microcopy `12–13px`, section eyebrow `11–12px`, and section H2 `44–56px` desktop / `32–38px` mobile.
- Hero H1-to-tagline spacing is `2–8px`, tagline-to-paragraph `20–26px`, and paragraph-to-composer `24–30px`. Body line-height is `1.5–1.65`; display headings use `0.95–1.05` with balanced wrapping.
- Keep body copy within `65–75ch`; product headings should remain readable at 320px and 200% zoom.
- Use centralized responsive type tokens, not per-section arbitrary sizes. Serif is limited to the hero editorial tagline; all landing section headings remain sans.

## Layout

- Container max width: `1200px`; mobile gutter: `16px`; desktop gutter is fluid.
- Spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 88px`.
- Surface radius roles: `8px` controls, `12px` product panels, `16px` large screenshot frames.
- Use purpose-driven asymmetric grids; do not repeat equal icon-card rows for every section.
- App routes use `min-height: 100svh`, not fixed viewport height; content may scroll when a state needs space.
- All layouts must remain contained at `320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920px`.

## Component Roles

- Hero composer: existing `IdeaWizard` state and submit behavior, restyled as a compact left-anchored input instrument.
- Shared page reveals: scoped `PageMotion` with `useGSAP`, data-marked headings/prose/panels, and reduced-motion fallback.
- Landing hero heading: existing GSAP `SplitText`, used selectively to avoid duplicate animation.
- Intake: existing `ClarificationFlow` state machine within a progress/context rail and central question stage.
- Showcase: existing Magic UI marquee structure adapted to GSAP and real route captures, with opposite directions and hover/focus pause.
- FAQ and answer choices: existing Radix Accordion and RadioGroup remain the semantic primitives.
- Document workbench: existing `DocumentGenerator` handlers and API bindings within tabs, summary rail, and responsive Markdown surfaces.
- Navbar: custom AnyMD header with current auth/profile actions, anchor destinations, and a responsive accessible menu.

## Landing Section Map

Keep ten direct `main > section` elements for the existing E2E contract, in this order:

1. Composer-left hero.
2. Two-lane real-screenshot showcase.
3. Idea-to-brief scroll story.
4. Three output-file composition.
5. Use cases and product scope.
6. Skills versus MCP access.
7. Visual direction preview.
8. Draft handling and submission boundary.
9. Transparent one-time token pricing.
10. FAQ and closing action.

Every section gets a different composition within this one design language. Do not add customer logos, testimonials, usage numbers, unsupported claims, or synthetic product screenshots.

## Motion

- GSAP is the sole animation engine for this redesign. Use `useGSAP`, scoped contexts, `gsap.matchMedia()`, and ScrollTrigger cleanup.
- Animate visible heading, paragraph, label, card, and product panel entrances in semantic groups; vary stagger/order to establish hierarchy rather than making every element move simultaneously.
- Use a single bounded pin/scrub scene in the landing workflow story on wide screens; keep native vertical scrolling on mobile.
- The two screenshot lanes run as seamless GSAP timelines, one left-to-right and one right-to-left; pause on pointer hover and keyboard focus.
- Keep motion on transforms and opacity. No scroll listeners, layout-property tweening, cursor trails, decorative infinite wobble, or delayed form/navigation actions.
- Under `prefers-reduced-motion: reduce`, disable pin/scrub/reveal displacement/autoplay; keep all text, screenshots, controls, progress, and state visible.
- Preserve the existing question-stage transition where it already owns current-state changes; do not double-animate it with page-entry motion.

## Imagery And Proof

- Landing showcase screenshots must be generated from the actual local AnyMD routes after the redesign, at a fixed desktop viewport and saved as optimized WebP assets.
- Screenshots must retain the original route UI and readable proportions; captions name the route/state shown.
- Use accurate text/output excerpts only. If no verified customer proof exists, use product evidence instead of invented logos, testimonials, metrics, or benchmarks.

## Do / Do Not

- Do use typography, spacing, clear surfaces, real product captures, and one purposeful story interaction to distinguish sections.
- Do preserve keyboard focus, labels, landmarks, form state, accessible names, status announcements, and existing route destinations.
- Do not replace component handlers or application state to make a visual redesign easier.
- Do not use generic hero wireframes, stock testimonial walls, dummy dashboard figures, scroll hijacking, or mixed old/new visible systems.
