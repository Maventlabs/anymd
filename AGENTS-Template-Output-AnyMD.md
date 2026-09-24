# AGENTS.md

## Operating Contract

This file is generated together with `prd.md` and `SESSION.md`. Read all three
before changing the repository:

1. `prd.md` defines what must be built.
2. `AGENTS.md` defines how the implementation must be executed.
3. `SESSION.md` records current progress, evidence, decisions, and the next action.

The product hierarchy is authoritative in this order:

1. Product goal and measurable outcomes
2. Features and sub-features
3. Phases
4. Tasks
5. Acceptance criteria
6. Verification evidence

Do not mark a parent complete while a relevant child or its evidence is incomplete.

## Priority And Execution

Use one priority vocabulary:

- `High/P0`: release-blocking core behavior.
- `Medium/P1`: important behavior that can follow the core release.
- `Low/P2`: optional enhancement or polish.

Use **production breadth-first** execution. Establish a thin, real end-to-end
slice for every `High/P0` feature before deepening one feature. Then perform a
depth pass for edge cases, performance, accessibility, reliability, security,
and polish. Respect dependencies that genuinely block a slice.

## Completion Rule

**Completion rule:** a task may be checked only after the complete user journey
works end-to-end through its real configured provider or durable boundary,
including success, failure, persistence, and verification evidence. Local
adapters, isolated unit tests, and compile-only slices are implementation
prework.

Unit tests, mocks, local adapters, compile checks, and builds are necessary
prework but are not completion evidence by themselves. Do not stop because
those checks pass.

## Required Tools

- Use every installed skill that is relevant to the current task.
- Use every relevant MCP server/tool that is available in the environment.
- Verify provider credentials and MCP connectivity instead of inferring them.
- Record the actual skills, MCP tools, providers, commands, and results in `SESSION.md`.
- If a relevant skill or MCP is unavailable, record the fallback and its limitation.
- Never claim to have used a tool, skill, provider, or MCP that was not actually used.

## Production Code Standard

- Modify the existing production code path instead of building a throwaway adapter.
- Reuse existing modules, contracts, and design tokens before adding abstractions.
- Keep changes small, reversible, typed, validated, and observable.
- Implement success, failure, loading, persistence, retry, and recovery behavior.
- Do not add decorative controls, dead buttons, fake interactions, simulated success, or placeholder completion states.
- Keep secrets, raw IPs, prompts, document contents, and unnecessary PII out of logs and client bundles.

## Verification Protocol

For each task:

1. Read `SESSION.md` and inspect the current repository state.
2. Identify the real provider and durable boundary.
3. Implement the smallest production-ready slice.
4. Run focused unit/integration/contract checks.
5. Run the relevant E2E path through the real application boundary.
6. Verify success, failure, persistence, and recovery.
7. Update `SESSION.md` with evidence before starting the next task.

Do not repeat a completed E2E run unless source, configuration, provider,
environment, the previous result, or a release gate changed.

## Observability And Metrics

- Instrument only consented events from the PRD event contract.
- Use authenticated user IDs or salted anonymous IDs as `actor_key`.
- Never use raw IP as a product identity metric.
- Local runs validate schemas, collectors, and queries with synthetic fixtures.
- Real DAU, rolling 30-day MAU, traffic, activation, reliability, and payment
  metrics require a deployed durable event store.
- Default analytics retention is 90 days unless the PRD states another policy.
- Record metric definitions, timezone, window, consent state, source, and query evidence.

## Pause Gates

Continue automatically between tasks and phases. Pause only for:

- Missing or invalid credential required by the real boundary.
- Destructive or irreversible action.
- Real payment or financial side effect.
- Production mutation or deployment approval.
- Unresolved product, privacy, legal, or security decision.

Do not pause merely because a local adapter, unit test, compile, or build passed.

## Handoff

Before ending a run, update `SESSION.md` with:

- Current phase and task.
- Completed evidence and verification status.
- Last verified commit and environment.
- Files changed.
- Known blockers and decisions.
- The single next action.
