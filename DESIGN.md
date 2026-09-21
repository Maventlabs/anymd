# AnyMD Design System

> Blueprint Studio: shared product system

## Visual Thesis

AnyMD should feel like a rough product thought becoming an executable interface in front of the user. The visual system uses only pure white and voltage blue, alternating at section scale rather than scattering accent colors across a neutral page. The compact idea composer is the main instrument. Opposing rows of 16:9 website previews show the destination without claiming that generation is already available.

## Color Roles

| Role | Value | Rule |
| --- | --- | --- |
| Voltage blue | `#006EFF` | Full section background or all foreground content on white |
| Pure white | `#FFFFFF` | Full section background or all foreground content on blue |
| Blue soft | `#E8F1FF` | Input hover and quiet UI state on white only |
| Blue mid | `#80B7FF` | Secondary blue swatch and non-text decoration only |

- White sections use blue text, borders, icons, and controls.
- Blue sections use white text, borders, icons, and controls.
- Do not reintroduce cream, black, gray surfaces, decorative gradients, or unrelated accent colors.
- Opacity variants may only be derived from the section foreground color.

## Typography

- Family: Inter for display, body, labels, and controls.
- Display: 700-800 weight, tight tracking between `-0.04em` and `-0.065em`.
- Body: 400 weight, `1.58` line height, maximum measure `70ch`.
- Utility labels: 700 weight, uppercase, compact tracking.
- Do not use serif display typography on the Fase 1 landing page.

## Layout

- Maximum content width: `1240px`.
- Major sections alternate white and blue from top to bottom.
- Desktop section padding: approximately `88-144px`; mobile: `72-96px`.
- Hero centers one promise and one compact composer rather than presenting a dashboard.
- The process uses a sticky narrative column with scrolling steps, adapted from UI Layouts Sticky Scroll.
- The preview gallery uses two full-width Magic UI marquees in opposite directions.

## Components

- Hero atmosphere: ReactBits Laser Flow, blue on white, restrained opacity.
- Heading reveal: ReactBits Split Text with scoped GSAP and reduced-motion fallback.
- Idea composer: compact 21st.dev prompt-composer pattern adapted to existing AnyMD state.
- Website previews: Magic UI Marquee, two rows, 16:9 placeholder frames until real images exist.
- FAQ: shadcn Accordion using the section's white-on-blue color roles.
- Advanced stack: compact disclosure panel with horizontal provider choices and visible labels.
- Shared surfaces: auth, pricing, and generated-document routes reuse the same blue/white instrument language, thin rules, square work surfaces, and explicit state strips.

## Motion

- Motion follows the transformation from idea to interface: reveal, advance, handoff.
- Headings reveal by word; supporting blocks rise with a short blur; structural rules draw left to right.
- Preview rows move continuously in opposite directions and pause on hover.
- Cursor trail exists only in the Process section and disappears on coarse pointers.
- All animation is scoped, cleaned up on unmount, and disabled by `prefers-reduced-motion`.
- Content remains visible without JavaScript.

## Imagery

- Fase 1 uses labeled 16:9 website-preview placeholders.
- Replace placeholders with real AnyMD-made website screenshots later without changing marquee geometry.
- No background image is required for the current direction. If art is introduced later, it must be supplied as a user-approved 16:9 asset rather than improvised in CSS.

## Do

- Let color own entire sections.
- Keep the composer compact and immediately usable.
- Use borders, type scale, and motion to create hierarchy.
- Label synthetic or placeholder examples honestly.
- Preserve keyboard focus, semantic headings, responsive behavior, and readable contrast.

## Do Not

- Do not add cream or dark sections.
- Do not place blue body text directly on a blue section or white body text directly on white.
- Do not use generic equal-card grids as the page structure.
- Do not invent customer proof, pricing, benchmarks, or generated examples.
- Do not turn AnyMD into an AI app builder in the copy.

## Blueprint Studio Tokens

- `--blueprint-ink`: `#006EFF` for actions, rules, headings, and blue sections.
- `--blueprint-paper`: `#FFFFFF` for primary surfaces and inverse content.
- `--blueprint-soft`: `#E8F1FF` for quiet input, notices, and document code surfaces.
- `--blueprint-line`: a low-opacity voltage-blue rule for structure.
- `--blueprint-line-strong`: a stronger voltage-blue rule for field and workbench boundaries.
- `--blueprint-radius`: `12px` for instrument surfaces; pills remain limited to small controls.
- `--blueprint-shadow`: an offset blue shadow reserved for the emphasized pricing package and primary composer.

Auth uses the same white form / blue brand split as the rest of the product. Pricing reads as a token ledger with one emphasized package. Generation reads as a document workbench with a summary rail, document sections, and explicit status messaging. All three surfaces preserve the existing responsive and reduced-motion rules.
