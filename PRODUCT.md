# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo developers and small teams starting a new product or a substantial multi-step feature with an AI coding agent. They need to turn an incomplete idea into a structured, executable starting point without writing a PRD manually.

## Product Purpose

AnyMD turns a freely written product idea into a focused clarification journey and two agent-ready Markdown documents: `prd.md` for what to build and `AGENTS.md` for how the coding agent should work.

## Positioning

AnyMD prepares documents rather than executing code. Its generated guidance tells coding agents to check automatically recommended local skills and use them when installed and relevant, while treating MCP access as a separate capability that must be verified.

## Operating Context

Users write an idea in any language, optionally record existing stack decisions, answer adaptive clarification questions, choose a curated theme, review automatic skill recommendations, and review generated documents before carrying the Markdown into Claude Code, OpenCode, Cursor, Codex, or a similar coding environment.

## Capabilities and Constraints

- Current preview supports idea entry, six optional stack categories, Unicode-safe validation, output-language and theme clarification, automatic recommendations from a curated 25-skill catalog at `/skills`, and AI-refined document review at `/generate`.
- `GET /api/skills` prefers a validated structured remote catalog, caches successful fetches for six hours, and falls back to a version-controlled snapshot.
- `POST /api/generate` validates the complete handoff, resolves recommended skill IDs server-side, and returns `prd.md`, `AGENTS.md`, and optional `CLAUDE.md` as stable sectioned documents.
- `prd.md` follows `PRD-Template-Output-AnyMD.md`, emits Mermaid source, and remains within a tested 4,000-word hard cap. Section rebuild preserves all non-target sections.
- Input is valid at 20-5,000 trimmed Unicode code points.
- The current preview calls a maintainer-configured OpenAI-compatible provider from the server. It reviews structured sections or exact raw Markdown, copies documents and the initialization prompt, and downloads Markdown from browser memory. Generation jobs, quota claims, token balances, and Stripe webhook state are persisted in Neon; the product does not install skills or verify local skill availability.
- Default output is exactly `prd.md` and `AGENTS.md`; the Claude-specific `CLAUDE.md` importer is opt-in rather than a third default document.
- Public responses apply a restrictive baseline CSP, deny framing and unused camera/microphone/geolocation access, disable MIME sniffing, and limit referrer disclosure.
- AnyMD is intended for new products and substantial features, not every small code change.

## Brand Commitments

- Product name: AnyMD.
- Built by Maventlabs and planned as open source.
- Use the primary logo from `public/brand/anymd-logo.png` and the PWA mark from `public/brand/anymd-mark.png`.
- Voice is direct, thoughtful, specific, and honest about what is not implemented.

## Evidence on Hand

- Product requirements: `docs/PRD-AnyMD-Product.md` (private local roadmap, ignored by Git).
- Phase 1-5 tests cover idea validation, stack retention, question branching, clarification progress, skill resolution, provider response normalization and retry, strict generated-bundle validation, public API errors, section rebuild, responsive raw/structured review, clipboard, and download.
- No customer testimonials, production benchmarks, generated websites, or pricing evidence is available; future surfaces must not fabricate them.

## Product Principles

- Clarify before generating.
- Produce fewer, more useful documents.
- Keep skills and MCP conceptually separate.
- Preserve user control over stack decisions and data handling.
- Show current capability honestly and label future behavior clearly.

## Accessibility & Inclusion

The web experience supports keyboard navigation, visible focus, semantic controls, reduced motion, responsive layouts, and multilingual free-text input.
