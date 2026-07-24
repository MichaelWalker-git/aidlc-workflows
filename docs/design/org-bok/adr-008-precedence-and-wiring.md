# ADR-008: Local discovered practices outrank BoK guides; guides get targeted per-agent Tier-1 placement

**Status:** Accepted (2026-07-23)

## Context

Two integration hazards with existing machinery:

1. **Precedence.** On brownfield projects, `practices-discovery` (2.2) already
   infers code style and conventions from the *current* repo and promotes
   affirmed practices to team memory. BoK guides state *org-wide* defaults.
   The two can disagree.
2. **Context budget.** Knowledge dirs load wholesale into agent context. If
   every agent loads every guide (or raw exemplar profiles), the context
   bloat defeats the SA's "doesn't need to crawl the whole library" goal.

## Decision

**Precedence:** BoK guides are the default for greenfield work. On brownfield,
**locally discovered, affirmed practices win** — consistency with the codebase
you're in beats org ideals. The reference brief states this rule explicitly
(ADR-006). A conflict-diff + affirmation gate (routing BoK-vs-local conflicts
through the same gate practices-discovery uses) is the correct v2; v1 ships
the static rule. "BoK wins, local logged as debt" was rejected as a churn-risk
default.

**Guide wiring (Tier-1 placement):**

| File | Loaded by |
|------|-----------|
| `guides/architecture-principles.md` | aidlc-architect-agent |
| `guides/code-style.md` | aidlc-developer-agent, aidlc-quality-agent |
| `guides/ui-design-language.md` | aidlc-design-agent, aidlc-developer-agent |
| `index.md` + `exemplars/**` | aidlc-research-agent **only** |

Other agents receive exemplar content exclusively through the reference
brief. All-guides-in-`aidlc-shared` was rejected (14 agents × all guides is
exactly the bloat to avoid); brief-only guide delivery was rejected (guides
would vanish whenever the research stage is skipped, undermining them as
standing defaults).

## Consequences

- Physical layout: guides live under `core/knowledge/org-bok/` as the
  authored home, with per-agent wiring done at packaging time (symlink/copy
  into the agent knowledge dirs by `package.ts`) or by placing files directly
  in agent dirs and reserving `org-bok/` for index + exemplars —
  implementation may choose either, but the loading table above is the
  contract.
- Memory (`org.md` Code Style, etc.) continues to load before knowledge for
  every agent; guides complement, never contradict, affirmed memory rules.