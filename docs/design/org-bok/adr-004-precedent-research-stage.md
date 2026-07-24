# ADR-004: New CONDITIONAL ideation stage `precedent-research`, sibling of `market-research`

**Status:** Accepted (2026-07-23)

## Context

The BoK must be consulted early enough that feasibility (1.3), rough mockups
(1.6), and everything downstream can build on organizational precedent — the
SA's framing is RFP intake, an ideation-time concern. Existing stage
`market-research` (1.2) already does research at that graph position, but it
answers an external question (competitive analysis, build-vs-buy) with
external sources; internal-precedent research is a different question with
different sources and a different lead agent.

## Decision

Add a new stage, slug **`precedent-research`**, in ideation directly after
`intent-capture` (displayed as 1.2; existing 1.2–1.7 renumber display-only,
since slugs are identity). It **sits alongside `market-research` as a
sibling** — both consume the intent, both are CONDITIONAL, and they can run
in parallel. Merging into market-research (entangled conditions, wrong lead
agent) and replacing it (loses build-vs-buy analysis) were rejected.

**Gate:** CONDITIONAL with a deterministic, sensor-style file check evaluated
at routing time — `org-bok/index.md` exists and lists ≥1 exemplar (same
pattern as reverse-engineering's brownfield gate). Since the BoK ships in
core (ADR-002) this is effectively always-on for this fork, but degrades
gracefully for stripped copies. Composer-driven gating was rejected (couples
the composer to the BoK and strains its "scoring, not exploring" contract);
ALWAYS-with-graceful-no-op was rejected as a wasted dispatch.

**Behavior:** the lead agent (ADR-005) reads the intent, reasons over
`index.md`, loads only matching exemplar profiles, and produces the
**reference brief** artifact (ADR-006). The stage definition follows the
standard protocol (`docs/reference/15-stage-definition.md`); after authoring,
`aidlc-graph compile` regenerates `stage-graph.json`/`scope-grid.json` and
`aidlc-runner-gen.ts` regenerates the runner skill.

## Consequences

- Precedent is available to all downstream ideation/inception/construction
  stages via the brief's artifact edges.
- One new stage file + graph recompile; display renumbering of later ideation
  stages must be checked in docs (`docs/reference/04-stages/ideation.md`).