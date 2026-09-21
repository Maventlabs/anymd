# AnyMD Blueprint Studio Visual Redesign

## Status

Approved. Implementation started after functional work and browser verification.

## Decision

Refine the existing AnyMD visual language into a shared **Blueprint Studio** system across the landing page, authentication, pricing, and document-generation surfaces.

The redesign keeps the existing voltage-blue and white identity. It should feel like product thinking becoming an executable project brief, not like a generic AI dashboard or AI app builder.

## Context

The functional product phases are complete, but the visual system is currently strongest on the landing page. Auth and pricing work, yet read as adjacent pages rather than parts of one product. The existing `DESIGN.md` defines a useful Fase 1 foundation but explicitly leaves the final system open.

Constraints:

- Preserve existing behavior, routes, auth, billing, generation, and accessibility guarantees.
- Keep `#006EFF` and `#FFFFFF` as the primary visual roles.
- Do not introduce cream, dark surfaces, gradients, unrelated accent colors, or invented product proof.
- Do not reframe AnyMD as an AI app builder.
- Maintain responsive desktop/mobile layouts and reduced-motion behavior.
- Prefer the smallest structural change that produces a coherent system.

## Goals

- Make all primary surfaces feel like one product.
- Make the idea composer the central product instrument.
- Make token pricing understandable as a finite document-generation budget.
- Make generated documents feel like an inspectable workbench output.
- Establish reusable visual tokens and surface primitives instead of page-specific styling.
- Improve hierarchy, state visibility, focus treatment, and mobile behavior without changing product semantics.

## Non-Goals

- No database, API, auth, Stripe, AI-provider, queue, or quota changes.
- No new product features or navigation sections.
- No new image-generation dependency.
- No redesign of copy strategy beyond concise UI labels required by layout.
- No replacement of the existing brand logo.
- No claim that placeholder previews are customer work or generated output.

## Visual Direction

### Color

- Voltage blue: `#006EFF` for primary surfaces, actions, and foreground content on white.
- Pure white: `#FFFFFF` for primary surfaces and foreground content on blue.
- Blue soft: `#E8F1FF` for quiet input and selected states on white.
- Blue mid: `#80B7FF` for non-text decoration only.
- Derived opacity values may use only the active section foreground color.

No gray or black cards are added. Borders, rules, and spacing create hierarchy.

### Typography

- Continue using Inter across display, body, labels, and controls.
- Use high-contrast scale rather than additional font families.
- Keep display tracking tight and body copy readable.
- Use uppercase utility labels sparingly for stage names, metadata, and state labels.

### Shape and Texture

- Prefer square or lightly rounded instrument surfaces over nested card stacks.
- Use thin rules, numbered stages, registration marks, and small metadata labels as the visual signature.
- Avoid decorative grids that compete with the composer or document content.

## Surface Specifications

### Landing

- Hero remains a single promise followed by the compact idea composer.
- Composer becomes a clear workbench: prompt area, optional context controls, primary action, and a small stage indicator.
- Process section presents `idea -> decisions -> documents` as a connected sequence, not three generic feature cards.
- Preview gallery continues to use honest labeled placeholders until real assets exist.
- FAQ remains visually subordinate and uses the established accordion behavior.

### Authentication

- Preserve the existing split layout and routes.
- Align form spacing, labels, buttons, focus states, and provider actions with composer primitives.
- Brand panel uses the same stage language as the landing page without adding a second visual theme.
- Error, pending, and provider-disabled states must remain explicit and readable.

### Pricing

- Keep one-time token packages and non-expiring token semantics.
- Reframe the page as a token ledger: package amount, resulting generation capacity, price, and purchase action.
- Use one emphasized package treatment only where the current product already has a supported recommendation; do not invent social proof or savings claims.
- Make signed-in and signed-out purchase states obvious without changing checkout behavior.

### Generator and Preview

- Treat generation as a document workbench rather than a dashboard.
- Desktop layout: compact context/outline rail, primary document preview, and action rail for copy/download/rebuild.
- Mobile layout: document preview first, with outline and actions collapsing into accessible disclosure controls.
- Loading, retry, timeout, and terminal failure states share one status language with the rest of the product.
- Preserve Markdown content, copy behavior, downloads, and rebuild behavior exactly.

## Shared Primitives

- `stage-label`: numbered or uppercase stage metadata.
- `blueprint-rule`: horizontal structural divider with responsive behavior.
- `instrument-surface`: white or blue section-aware surface with border and padding tokens.
- `primary-action` and `secondary-action`: shared focus, disabled, hover, and active states.
- `status-strip`: compact state messaging for loading, success, retry, and failure.
- `document-frame`: readable Markdown preview container with stable width and overflow handling.

These should be implemented with existing CSS/component patterns first. Add a component only when the same behavior is used by at least two surfaces.

## Motion

- Keep existing scoped GSAP behavior where it already exists.
- Use motion only for reveal, advance, and handoff: heading reveal, composer activation, stage transition, and document readiness.
- Avoid idle wobble, decorative looping motion, and motion that delays access to content.
- Respect `prefers-reduced-motion` by showing content immediately and disabling non-essential transforms.
- Ensure all transitions remain deterministic and safe for browser screenshot and E2E verification.

## Responsive Rules

- Preserve the existing maximum shell width and mobile-first collapse behavior.
- At narrow widths, remove decorative stage marks before reducing readable type or control size.
- Never require horizontal scrolling for auth forms, pricing actions, or generated document content.
- Keep primary actions reachable without scrolling past large decorative regions.
- Test at a small mobile viewport, a laptop viewport, and a wide desktop viewport.

## Accessibility Requirements

- Preserve semantic landmarks and heading order.
- Preserve visible `:focus-visible` treatment on both white and blue surfaces.
- Inputs retain associated labels, autocomplete metadata, and error announcements.
- Disclosure controls remain keyboard-operable and expose expanded state.
- Status messages use appropriate live-region behavior without interrupting unrelated input.
- Maintain readable contrast for text, borders, disabled states, and provider actions.

## Implementation Boundaries

- First consolidate tokens and shared primitives in `app/globals.css` and existing shared components.
- Then update one vertical slice at a time: landing, auth, pricing, generator.
- Do not perform a broad rewrite of `app/globals.css` without preserving working selectors and states.
- Keep product copy changes limited to layout-fit and state clarity.
- Verify each slice before moving to the next.

## Acceptance Criteria

- Landing, auth, pricing, and generator visibly share the Blueprint Studio language.
- No functional regression in auth, checkout, generation, copy, download, rebuild, or error states.
- `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- Existing E2E coverage remains passing except for the documented external Neon timeout condition.
- Desktop and mobile screenshots show no clipping, overflow, unreadable text, or inaccessible controls.
- Reduced-motion rendering keeps all content and actions available without animation.
- No new unapproved palette, dependency, product claim, or persistent data behavior is introduced.

## Alternatives Considered

### Quiet Document Studio

Would use a calmer editorial treatment with fewer rules and less motion. Rejected for now because it would weaken the existing voltage-blue identity and make the product feel less distinctive.

### Instrument Panel

Would push toward a technical, dense, developer-tool interface. Rejected for now because it risks making the first-run idea composer feel intimidating and dashboard-like.

## Approval Gate

Implementation plan: consolidate shared tokens in `app/globals.css`, then align landing, auth, pricing, and generator styles in that order. Verify unit/build gates after the CSS pass and verify desktop/mobile browser rendering before marking the redesign complete.
