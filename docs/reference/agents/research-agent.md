# aidlc-research-agent -- Technical Reference

## Identity

| Field | Value |
|-------|-------|
| Name | aidlc-research-agent |
| Tier | **judgment** |
| Allowed Claude Code Tools | Read, Edit, Write, Glob, Grep, AskUserQuestion |
| Disallowed Claude Code Tools | Task |

---

## Stage Ownership

### Lead Stages

| Stage | Name | What This Agent Does |
|-------|------|----------------------|
| precedent-research | Precedent Research | Walks the Org BoK's curated exemplar index against the captured intent, loads only the matching exemplar profiles, and writes the reference brief (selected exemplars + rationale, patterns to follow, UI directives, precedence rule, deep-dive pointers — or an honest "no matching precedent") |

### Support Stages

None — the stage runs inline with the research persona alone.

---

## Collaboration Patterns

### Receives From

| Source | Artifacts |
|--------|-----------|
| aidlc-product-agent | Intent statement, stakeholder map |

### Hands Off To

| Target | Artifacts |
|--------|-----------|
| aidlc-architect-agent | Exemplar architecture and rationale for feasibility and application design |
| aidlc-design-agent | UI directives for mockups |
| aidlc-developer-agent | Patterns and deep-dive pointers for code generation |

---

## Knowledge Sources

### Methodology (Tier 1)

Path: `.claude/knowledge/aidlc-research-agent/`

| File | Content |
|------|---------|
| precedent-research-method.md | The index-walk method: intent-to-precedent matching, brief authoring, the precedence rule, and deep-dive degradation |

The agent is also the only wiring of the Org BoK's exemplar side: the curated
index at `.claude/knowledge/org-bok/index.md` plus the exemplar profiles under
`.claude/knowledge/org-bok/exemplars/<slug>/profile.md`, of which it loads
only the profiles the index match selects. (The BoK's cross-cutting guides
under `org-bok/guides/` are wired separately — as standing Tier-1 knowledge
for the architect, developer, quality, and design agents — and the research
agent does not load them.)

### Team (Tier 2)

Path: `aidlc/knowledge/aidlc-research-agent/` (the space-level knowledge dir; user-managed)

A space-level directory the team creates when it has content (the engine ships `aidlc/knowledge/` empty). Populated by the team with organization-specific
research aids such as additional matching heuristics or local exemplar
curation conventions.

---

## Cross-References

- [Agent Reference Overview](README.md)
- [Agent Guide: aidlc-research-agent](../../guide/agents/research-agent.md)
- [Stage Documentation](../04-stages/)
- Source: [`dist/claude/.claude/agents/aidlc-research-agent.md`](../../../dist/claude/.claude/agents/aidlc-research-agent.md)