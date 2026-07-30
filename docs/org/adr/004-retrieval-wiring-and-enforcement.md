# ADR-004: No search agent — INDEX.md read at activation by four wired agents; shape enforced by a unit test

- **Status:** accepted
- **Date:** 2026-07-30
- **Deciders:** p.lysanets (grilling session)

## Context

The KB needs a retrieval mechanism and a guard against template erosion.
The framework's existing pattern is that domain agents load org knowledge
directly at activation (`aidlc-architect-agent.md` → architecture-principles
guide; `aidlc-developer-agent.md` → code-style/UI guides); no intermediary
search agent exists anywhere in the design.

## Decision

1. **No dedicated search agent.** Retrieval = `INDEX.md`, a deliberately
   small catalog (one line per pattern: trigger keywords → file path →
   status). The intelligence lives in the index, not in a new agent.
2. **v1 wiring: four agents** get one activation-list line — *"Read
   `{{HARNESS_DIR}}/knowledge/org-bok/patterns/INDEX.md`; open only the
   pattern files relevant to the current task"*:
   - `aidlc-architect-agent`, `aidlc-aws-platform-agent` (multi-tenancy,
     data-layer consumers)
   - `aidlc-devsecops-agent`, `aidlc-operations-agent` (sentry.md
     consumers — wired so the v1 observability file has readers)
   `developer` and `architecture-reviewer` wiring deferred to v2.
3. **Read timing: always at activation** (index only; pattern files opened
   on task match). Matches the existing ordered activation-load lists;
   deterministic rather than reliant on agent judgment.
4. **Shape enforcement: a `t*`-numbered unit test** in `tests/unit/`
   asserting: every `patterns/**/*.md` (except INDEX.md) has required
   frontmatter (`status`, `reviewed`, `owner`) and required sections
   (When to use / Our approach / Exemplars / Gotchas / References); every
   INDEX.md row resolves to an existing file; every pattern file appears in
   INDEX.md. Same pin style as `t68`.

## Consequences

- Zero new mechanism to document or port across the five harnesses.
- Standing context cost is bounded: one small index read per activation for
  four agents.
- The index is a single point of drift — mitigated by the bidirectional
  index↔file assertions in the test.

## Rejected alternatives

- **Dedicated retrieval agent** — adds a dispatch hop, loses the domain
  agent's task context when judging relevance, and introduces a new
  mechanism the framework doesn't have. Reconsider only if the KB is
  extracted to a separate repo consumed outside AIDLC.
- **Task-triggered consult** — zero standing cost but relies on the agent
  deciding to look exactly when it doesn't know a pattern exists.
- **Wiring all six candidate agents in v1** — context cost without v1
  content for developer/architecture-reviewer to consume.