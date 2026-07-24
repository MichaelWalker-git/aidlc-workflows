# ADR-001: Distill org repos offline; check curated markdown into the fork

**Status:** Accepted (2026-07-23)

## Context

Agents need the org's body of knowledge (architecture decisions, practices,
UI language) without crawling entire repositories at runtime. The knowledge
must capture tacit context ("this was the ask, this is why we chose this
architecture") that is not recoverable from code alone. Options considered:
offline distillation checked into the fork, a runtime distillation stage per
project, an external CodeKB MCP index, and an offline/runtime hybrid.

## Decision

Distillation happens **offline, in this fork**, via a new `/aidlc-distill`
session skill (the fork's 4th session skill). Pointed at an org repo, it runs
reverse-engineering-style analysis, **interviews the human** for the ask and
the rationale, drafts an exemplar `profile.md`, and proposes updates to the
cross-cutting guides. A human curates the output before it is committed under
`core/knowledge/org-bok/`. Refresh is a manual re-run of the skill.

`/aidlc-distill` was chosen over a `/aidlc --distill` utility handler
(utility handlers are install-management ops, not multi-turn interview
sessions) and over an operation-phase stage (distillation targets arbitrary
org repos, not the current workflow's project).

## Consequences

- Deterministic, reviewable knowledge; no runtime repo credentials or token
  cost for distillation.
- The human interview step is the only reliable channel for the "why", which
  the SA's few-shot framing depends on.
- Content can go stale between re-runs; staleness is accepted and mitigated by
  deep-dive pointers (ADR-007).
- The existing reverse-engineering stage's 9-artifact codekb format was
  rejected as the profile shape: too verbose for few-shot loading and it
  captures no ask/why.