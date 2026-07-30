# ADR-001: Patterns KB lives in `core/knowledge/org-bok/patterns/` in this fork

- **Status:** accepted
- **Date:** 2026-07-30
- **Deciders:** p.lysanets (grilling session); Architect input from planning conversation

## Context

The org needs a knowledge base of AWS architectural patterns and best
practices (multi-tenancy/JWT, connection pooling, read replicas, Sentry
observability, and a backlog of further topics). Candidate homes: a separate
reusable repo (the Architect's "one repository" phrasing), the space-level
knowledge layer (`aidlc/spaces/<space>/knowledge/`), or the fork's
`core/knowledge/org-bok/` where 45 distilled exemplar profiles already live.

## Decision

Patterns live at `core/knowledge/org-bok/patterns/`, beside
`org-bok/exemplars/`, in this fork (`v2-customization` lineage). **This fork
is the org repo** — the Architect's "one reusable repository" is satisfied by
other consumers reading this repo; no separate extraction now.

Directory layout mirrors the Architect's classification:

```
core/knowledge/org-bok/patterns/
├── INDEX.md
├── multi-tenancy/
├── data-layer/
├── serverless-compute/
├── idp/
├── genai/
├── full-stack/
├── eventing/
├── iac/
└── observability/
```

## Consequences

- Distribution is solved by the existing packager: `bun scripts/package.ts`
  ships patterns to every `dist/<harness>/` tree; no clone/fetch machinery.
- Cross-links to exemplars are relative paths
  (`../exemplars/<repo>/profile.md`) readable by any agent.
- Upstream merge risk is low: upstream never touches `org-bok/`.
- If a second consumer outside AIDLC materialises (e.g. Ivan's Sentry
  root-cause bot), extract the directory to its own repo then — content
  unchanged, only its address; AIDLC pulls it in as a packaging step.

## Rejected alternatives

- **Separate repo now** — pays sync/distribution complexity today for a
  second consumer that does not yet exist.
- **Space-level knowledge** — keeps `core/` clean for upstream merges but
  ships per-install instead of via dist, breaking the "one source, many
  harnesses" property the fork relies on.