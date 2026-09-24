# SESSION.md

This is the execution ledger for the current product build. It is mutable
state, not product requirements. Keep historical evidence concise and update
the current state after every task or phase.

## Current State

| Field | Value |
|---|---|
| Product | [Product name] |
| Current phase | [Phase name] |
| Current task | [One task only] |
| Priority | [High/P0 | Medium/P1 | Low/P2] |
| Execution mode | [Breadth pass | Depth pass | QA | Security | Observability] |
| Status | [Not started | In progress | Blocked | Verified] |
| Next action | [One concrete next action] |
| Last verified commit | [commit or unknown] |
| Last verified environment | [local | staging | production] |
| Last updated | [ISO-8601 timestamp] |

## Execution Rules

- Read `prd.md`, `AGENTS.md`, and this file before working.
- Follow production breadth-first order for all `High/P0` features.
- Continue automatically after a phase passes its acceptance and verification gates.
- Do not repeat completed E2E runs unless source, config, provider, environment,
  failure state, or release gate changed.
- A local adapter, isolated unit test, compile, or build is prework, not completion.

## Completion Evidence

### [Phase or Task ID] - [Task title]

| Field | Value |
|---|---|
| Priority | [High/P0 | Medium/P1 | Low/P2] |
| Status | [Prework | In progress | Verified | Blocked] |
| Provider/boundary | [Real provider or durable boundary] |
| Environment | [local | staging | production] |
| Skills used | [actual skill names] |
| MCP tools used | [actual MCP tools or none available] |
| Commands | [commands actually run] |
| E2E path | [journey and result] |
| Persistence evidence | [database/storage/session evidence] |
| Failure/recovery evidence | [failure path and result] |
| Timestamp | [ISO-8601 timestamp] |

**Evidence:**

- [Link, artifact, log reference, screenshot, or concise result]

**Notes:**

- [Important limitation, fallback, or decision]

## E2E Retest Ledger

| Journey | Environment | Commit | Result | Retest when |
|---|---|---|---|---|
| [User journey] | [environment] | [commit] | [pass/fail] | [specific change condition] |

Do not rerun a passing journey without a listed retest condition. If a retest
is required, add a new row rather than erasing the previous evidence.

## Observability Evidence

| Metric/event | Definition | Source | Window/timezone | Consent | Result |
|---|---|---|---|---|---|
| DAU | Distinct active `actor_key` per UTC day | [durable store/query] | [window] | [required/confirmed] | [result] |
| MAU | Distinct active `actor_key` in rolling 30 days | [durable store/query] | [window] | [required/confirmed] | [result] |
| Traffic | Page views and unique actors | [durable store/query] | [window] | [required/confirmed] | [result] |

Local synthetic fixtures may verify metric logic but must not be reported as
production traffic or production MAU/DAU.

## Decisions And Blockers

### Decisions

- [Decision, date, and rationale]

### Blockers

- [Blocker, owner, required action, and whether it is a valid pause gate]

## Files Changed

- [path] - [reason]

## Handoff

- Current state: [one sentence]
- Work completed: [one sentence]
- Remaining risk: [one sentence]
- Next action: [one concrete action]
