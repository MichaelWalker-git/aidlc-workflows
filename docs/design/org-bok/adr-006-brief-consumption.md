# ADR-006: Reference brief flows via artifact edges plus spliced prose steps; UI directives ride in the brief

**Status:** Accepted (2026-07-23)

## Context

In this repo, stages declare `produces`/`consumes` artifact edges, but agents
only reliably *act* on an artifact when a prose step tells them to. The
"doesn't look LLM-generated" goal in particular fails if the UI design
language is merely *available* rather than *directed*.

## Decision

1. `precedent-research` declares `produces: reference-brief`.
2. **feasibility (1.3), refined-mockups (2.5), application-design (2.6), and
   code-generation (3.5)** add `reference-brief` to `consumes:` **and** gain a
   short prose step: *load the reference brief and follow its exemplar
   patterns; if the brief is absent (stage skipped), proceed without it.*
   Rough-mockups (1.6) gets the same treatment so early UI work is already
   on-language.
3. The brief itself carries **concrete UI directives** extracted from the
   selected exemplar and `ui-design-language.md`: design tokens, spacing and
   layout conventions, component patterns, and copy tone — phrased as
   directives for the mockup and code-generation stages, not background
   reading.
4. The brief states the precedence rule of ADR-008 explicitly so downstream
   agents don't ping-pong between BoK and local conventions.

Rejected: edges-only (nothing prioritizes exemplar patterns; the styling goal
doesn't land) and writing findings into `project.md` memory (briefs are
project-specific prose, not ALWAYS/NEVER rules — it abuses the memory layer's
contract).

A deterministic anti-generic-UI sensor (`aidlc-ui-fingerprint`, flagging
known LLM tells such as default gradient heroes and emoji-bullet feature
grids) was considered and deferred — see "Out of scope" in the README.

## Consequences

- Four-to-five existing stage files gain an edge + one step each; the graph
  recompile picks up the new edges; required-sections sensors can later check
  brief presence.
- When `precedent-research` is skipped (no BoK), downstream prose explicitly
  tolerates the missing artifact — no dangling hard dependency.