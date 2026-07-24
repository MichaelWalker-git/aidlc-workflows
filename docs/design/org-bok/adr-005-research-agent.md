# ADR-005: New 15th persona `aidlc-research-agent` leads precedent-research

**Status:** Accepted (2026-07-23)

## Context

Someone must map the intent/RFP to relevant exemplars at runtime. Candidates:
a new dedicated persona, the architect agent (already leads feasibility and
consumes architecture knowledge), or the composer (already routes work
adaptively).

## Decision

Add **`aidlc-research-agent`** as a 15th agent in `core/agents/`
(`aidlc-research-agent.md`, standard frontmatter: `disallowedTools: Task`,
tier `judgment`). Its sole job: read the captured intent, walk the
`org-bok/index.md` decision tree, load only the matching exemplar profiles,
optionally deep-dive per ADR-007, and write the reference brief.

Its Tier-1 knowledge dir (`core/knowledge/aidlc-research-agent/`) is the
**only** place `index.md` and the exemplar profiles are wired; other agents
never load raw profiles (ADR-008).

The architect was rejected as lead — it conflates "find precedent" with
"design solution" and further loads an already-heavy context. The composer
was rejected — it is deliberately "scoring, not exploring"
(`core/agents/aidlc-composer-agent.md`), and exemplar selection is
exploration.

## Consequences

- One new persona to author and maintain, dispatched by the orchestrator like
  any stage lead (agents cannot spawn sub-agents).
- Documentation touchpoints: agent count references ("14 agents") in
  `AGENTS.md`, `docs/reference/05-agent-system.md`, and `docs/guide/` must be
  updated to 15 in the implementing commit.