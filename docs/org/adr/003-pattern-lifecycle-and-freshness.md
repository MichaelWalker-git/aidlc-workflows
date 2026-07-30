# ADR-003: Pattern lifecycle via frontmatter status; cadence-based freshness owned by the AIDLC customizer

- **Status:** accepted
- **Date:** 2026-07-30
- **Deciders:** p.lysanets (grilling session)

## Context

Patterns enter as drafts (e.g. multi-tenancy is blocked on the Architect's
Service Delivery Platform audit) but agents read whatever is indexed. AWS
practices drift and exemplar repos get rewritten; a stale "blessed" file
actively misleads agents, which treat explicit context as org law.

## Decision

1. **Frontmatter status field** on every pattern file:
   `status: draft | blessed | deprecated`, plus `reviewed: YYYY-MM-DD` and
   `owner:`. Agents treat `draft` as advisory ("verify before relying on
   it") and `blessed` as binding default. The Architect's approval flips
   draft→blessed. `INDEX.md` shows status per row so agents see it before
   opening the file.
2. **Freshness is cadence-based and owned by p.lysanets** (the AIDLC
   customizer role): each pattern is re-verified against its exemplar repos
   quarterly; `reviewed:` is updated on each pass. A pattern whose exemplar
   diverged goes back to `draft` until re-blessed.
3. `deprecated` files stay in place (with a pointer to the successor) for
   one review cycle, then move out of the index.

## Consequences

- The multi-tenancy file can ship in v1 as `draft` without waiting for the
  SDP audit; agents get guidance now with calibrated trust.
- `reviewed:` gives agents and humans a visible staleness signal.
- The shape test (ADR-004) enforces that the frontmatter fields exist; it
  cannot enforce that reviews actually happen — that stays a human cadence.

## Rejected alternatives

- **Drafts excluded from dist/index** — drafts would get zero real-world
  exercise before blessing; also hides the v1 multi-tenancy content.
- **No formal states** — relies entirely on PR discipline; fails the moment
  a blessed exemplar is rewritten without anyone touching the pattern file.
- **Event-driven re-distill flagging** — better long-term (ties freshness to
  the distill pipeline via a citation map), deferred until the KB is large
  enough to justify the machinery; revisit at ~20+ patterns.