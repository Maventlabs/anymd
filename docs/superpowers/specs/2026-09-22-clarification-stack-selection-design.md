# AnyMD Clarification-First Stack Selection

**Status:** Approved for implementation
**Date:** 22 September 2026

## Goal

Keep the landing page focused on one action: describing the product idea. Technology decisions should be introduced only after AnyMD understands the product type and project scope.

## User Flow

1. User writes the product idea on the landing page.
2. AnyMD asks for the product type: Website, Web App, or Mobile App.
3. AnyMD asks for project scale: MVP, production product, or complex platform.
4. AnyMD asks whether stack decisions should be selected manually or recommended automatically.
5. Automatic mode recommends a compatible stack from the curated catalog.
6. Manual mode exposes the same catalog by category, with `Open` available for every category.
7. The review step displays the resulting stack choices before skill recommendations and generation.

## Landing Contract

- The hero contains the idea textarea, starter examples, privacy note, and submit control.
- The hero does not contain an Advanced menu, stack picker, stack counter, or direct stack-edit controls.
- The landing page does not contain a separate stack-preferences section that links back to the composer.
- Existing draft state remains compatible: an empty stack means no preference.

## Recommendation Contract

Automatic selection is deterministic and constrained to the curated catalog. It uses:

- product type;
- project scale;
- user-specified constraints from clarification;
- privacy and auth requirements;
- payment requirements;
- existing stack decisions, when present.

The recommender must not invent provider names or silently replace explicit user choices. If evidence is insufficient, it leaves the category open.

## Manual Selection Contract

Manual selection reuses the existing `stackOptions` catalog and the current draft shape. Each category supports one selected option or `Open`. Manual selection is shown in clarification, not on the landing page.

The catalog must contain at least 10 named options in every applicable category. `Open` is an additional choice and does not count toward the minimum. The initial categories are:

- Frontend framework
- Backend framework
- Database
- Authentication
- Payment gateway
- Hosting/deployment
- Mobile framework, when the product type includes Mobile App

The catalog may contain more than 10 options, but the UI must never silently render a category with fewer than 10 named options unless the category is explicitly marked as not applicable to the selected product type.

## Catalog and Icons

- Keep one source of truth for stack categories and options.
- Prefer official Simple Icons slugs when available.
- Every named option must have a verified icon mapping before it can enter the catalog.
- Use a local Lucide or neutral product icon as the explicit fallback when an official Simple Icons slug is unavailable. A missing or broken icon is not an acceptable fallback.
- The icon must be rendered visibly beside the option label in manual choices, automatic recommendations, and the review summary. It must not appear only on hover, in metadata, or in a tooltip.
- Visible labels remain mandatory; icons supplement the label and must have an accessible name through the surrounding control.
- Add a catalog validation test that fails when an option is missing its icon mapping or when any category has fewer than 10 named options.

## Analytics and Verification

The implementation should emit only consented aggregate events for:

- product type selected;
- project scale selected;
- automatic versus manual mode selected;
- clarification abandonment step.

The first implementation slice is UI and state behavior. Live provider generation and Neon-dependent smoke tests remain separate gates.

## Acceptance Criteria

- No Advanced or stack-preference control is rendered on the landing page.
- Submitting a valid idea still routes to `/clarify`.
- Existing clarification review still renders an empty stack as `No preference`.
- Every applicable stack category contains at least 10 named options plus `Open`.
- Every named stack option renders a visible icon in manual selection, automatic recommendation, and review.
- The stack catalog remains available for the clarification implementation.
- Landing, typecheck, lint, unit tests, and build remain green.
