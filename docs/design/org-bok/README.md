# Organizational Body of Knowledge (Org BoK) — Design Overview

**Status:** Designed (grilling session, 2026-07-23). Not yet implemented.

## Problem

This fork must carry the organization's accumulated body of knowledge — architecture
decisions, engineering practices, code style, and a UI design language — so that
AI-DLC workflows produce output that follows organizational precedent instead of
generic LLM defaults ("doesn't look LLM-generated"). Agents should know *which*
past projects to consult for a given ask (an RFP-style decision tree) without
crawling the whole repo library at runtime.

## Solution shape

1. **Distill offline, ship in the fork.** Reference repos are distilled into
   curated markdown (exemplar profiles + cross-cutting guides) via a new
   `/aidlc-distill` session skill, reviewed by a human, and committed under
   `core/knowledge/org-bok/`. The packager ships it to every `dist/<harness>/`.
2. **Route at runtime with a research agent.** A new CONDITIONAL ideation stage,
   `precedent-research` (displayed as 1.2, sibling of `market-research`), is led
   by a new `aidlc-research-agent`. It reads the intent, reasons over the curated
   `index.md` decision tree, loads only the matching exemplar profiles, and writes
   a **reference brief** artifact.
3. **Consume via artifact edges + spliced steps.** Feasibility, refined-mockups,
   application-design, and code-generation add `reference-brief` to `consumes:`
   plus a prose step directing agents to follow its exemplar patterns. Cross-cutting
   guides additionally load as Tier-1 knowledge in targeted agent dirs.
4. **Deep dives are opt-in.** Profiles carry repo URLs + notable file paths;
   downstream agents may fetch real files with ambient git credentials, degrading
   gracefully when auth is unavailable.

## Domain model

```
core/knowledge/org-bok/
├── index.md                     # curated decision tree: exemplar list, tags,
│                                #   "use when…" guidance (research agent only)
├── exemplars/
│   └── <exemplar-slug>/
│       └── profile.md           # the ask/context, chosen architecture, why,
│                                #   key patterns, repo URL + notable file paths
└── guides/                      # distilled ACROSS repos, targeted Tier-1 placement:
    ├── architecture-principles.md   # → aidlc-architect-agent
    ├── code-style.md                # → aidlc-developer-agent, aidlc-quality-agent
    └── ui-design-language.md        # → aidlc-design-agent, aidlc-developer-agent
```

Runtime artifact: **reference brief** — produced by `precedent-research`,
naming the selected exemplars, the patterns to follow (including concrete UI
directives: tokens, spacing, component conventions, copy tone), the precedence
rule versus locally discovered practices, and deep-dive pointers.

## Data flow

```
  [offline, in this fork]                  [runtime, per project]
  org repo ──/aidlc-distill──▶ profile.md      intent-capture (1.1)
  human interview: ask + why   guides/*.md          │
  human curates, commits       index.md             ▼
                                        precedent-research (1.2, CONDITIONAL:
                                        org-bok/index.md exists, ≥1 exemplar)
                                        lead: aidlc-research-agent
                                                    │ produces: reference-brief
                    ┌───────────────┬───────────────┼────────────────┐
                    ▼               ▼               ▼                ▼
              feasibility     refined-mockups  application-     code-generation
                 (1.3)            (2.5)        design (2.6)         (3.5)
```

## Decisions (ADRs)

| ADR | Decision |
|-----|----------|
| [ADR-001](adr-001-offline-distillation.md) | Distill offline via `/aidlc-distill` skill; curated markdown checked into the fork |
| [ADR-002](adr-002-package-in-core.md) | Build directly in `core/`, not as an AIDLC plugin |
| [ADR-003](adr-003-exemplar-profiles-and-guides.md) | Two entity types: per-repo exemplar profiles + cross-cutting guides, routed by a curated `index.md` |
| [ADR-004](adr-004-precedent-research-stage.md) | New CONDITIONAL ideation stage `precedent-research`, sibling of `market-research` |
| [ADR-005](adr-005-research-agent.md) | New 15th persona `aidlc-research-agent` leads the stage |
| [ADR-006](adr-006-brief-consumption.md) | Reference brief flows via `produces`/`consumes` edges plus spliced prose steps; UI directives ride in the brief |
| [ADR-007](adr-007-deep-dive-pointers.md) | Markdown-first; opt-in deep dives via repo URL + paths with ambient git auth |
| [ADR-008](adr-008-precedence-and-wiring.md) | Locally discovered practices outrank BoK guides on brownfield; guides get targeted per-agent Tier-1 placement |

See [glossary.md](glossary.md) for terms and [SPEC.md](SPEC.md) for the implementation-ready spec.

## Out of scope for v1 (deferred)

- **Conflict affirmation gate** — diffing BoK guides against practices-discovery
  output and routing conflicts through an affirmation gate (v2; v1 states a
  static precedence rule in the brief).
- **Anti-generic UI sensor** — a deterministic `aidlc-ui-fingerprint` sensor
  flagging known LLM tells in generated frontend code (considered, not committed).
- **CodeKB MCP integration** — querying a live org-wide index instead of / in
  addition to checked-in markdown.
- **Plugin packaging** — revisit if upstream mergeability becomes painful or the
  plugin mechanism gains memory/space-knowledge seeding.