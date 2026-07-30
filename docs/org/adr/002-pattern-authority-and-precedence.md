# ADR-002: Pattern files are the org-wide architecture authority; team/project memory may declare documented exceptions

- **Status:** accepted
- **Date:** 2026-07-30
- **Deciders:** p.lysanets (grilling session)

## Context

The framework separates the rule layer (`memory/org|team|project.md`,
resolver-loaded, narrower layers specialise) from the knowledge layer
(methodology, guides). Pattern files blur this: "Our approach" carries org
decisions ("we use RDS Proxy for Lambda→RDS"), which could collide with an
affirmed memory rule (e.g. team.md: "we use pgbouncer").

Existing precedent points both ways: `org.md` § Code Style delegates the
blessed-tools list to the org-bok guide (`guides/code-style.md`) but states
"affirmed memory rules override the guide".

## Decision

1. **For architecture decisions, the pattern file is the org-wide source of
   truth.** `org.md` gains a short section pointing at
   `knowledge/org-bok/patterns/` as the architecture-patterns authority —
   the same delegation shape as the existing code-style pointer.
2. **A team/project memory rule may override a pattern for its space as a
   documented exception.** This preserves the resolver model (narrower
   layers specialise). The exception must name the pattern it deviates from
   and the reason.
3. Every pattern file carries a standing header stating this precedence, so
   an agent reading a pattern in isolation knows to check the active space's
   memory for exceptions.

## Consequences

- Agents resolve conflicts deterministically: pattern = default, affirmed
  team/project rule = space-scoped exception.
- Org-wide changes to a blessed approach happen by PR to the pattern file
  (Architect review), not by editing memory in one space.
- The template's "Our approach" section may state decisions; it does not
  need to avoid normative language (rejects the "split by kind" discipline
  burden).

## Rejected alternatives

- **Memory always wins, patterns advisory** — makes patterns toothless
  exactly where the Architect wants uniformity (multi-tenancy done one way).
- **Patterns non-overridable** — inverts the resolver's layered design and
  blocks legitimate per-project constraints (e.g. customer-mandated stack).
- **Agent surfaces every conflict to a human** — maximal friction; reserved
  for cases where an exception exists but is undocumented.