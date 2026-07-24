# ADR-002: Build directly in core/, not as an AIDLC plugin

**Status:** Accepted (2026-07-23)

## Context

The repo has a plugin mechanism (`docs/reference/18-plugin-mechanism.md`) that
can contribute stages, agents, knowledge, contributions, sensors, and tools —
a plausible carrier for an org body-of-knowledge. But this repository is
already an org-owned fork of AI-DLC, and plugins currently cannot seed memory
rules or space-level (Tier-2) knowledge.

## Decision

Implement the feature **directly in `core/`** (stage, agent, knowledge,
spliced steps in existing stages). The BoK content lives at
`core/knowledge/org-bok/` and ships through the normal
`bun scripts/package.ts` pipeline into every `dist/<harness>/`, so every
project that copies a dist gets the BoK automatically.

## Consequences

- Simplest to build and debug; no plugin-mechanism gaps to work around.
- The fork diverges further from upstream AI-DLC; merging upstream updates
  gets harder over time. Revisit plugin packaging if that pain materializes
  or if the plugin mechanism gains memory/space-knowledge seeding.
- Alternatives rejected for v1: full plugin (blocked by seeding gaps),
  hybrid plugin+core patches (more moving parts than the fork situation
  justifies), space-level Tier-2 drop-in (per-project manual copying, and no
  home for the routing `index.md` the research stage depends on), and a new
  top-level `bok/` authored tree (touches every harness manifest and the
  packager for little gain over a `core/knowledge/` subtree).