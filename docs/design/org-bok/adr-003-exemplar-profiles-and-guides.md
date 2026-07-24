# ADR-003: Two entity types — exemplar profiles and cross-cutting guides, routed by a curated index

**Status:** Accepted (2026-07-23)

## Context

The SA described two distinct knowledge shapes: few-shot exemplars ("these are
some example projects… this is what you would do, and this was the
architecture") and cross-cutting organizational conventions (code style, a UI
design language that "doesn't look LLM-generated"). One flat set of topical
files loses the project→solution few-shot framing; mirroring the codekb
9-artifact format per repo is too verbose to load as few-shot context.

## Decision

The BoK has **two entity types plus a routing index**:

```
core/knowledge/org-bok/
├── index.md                     # curated decision tree
├── exemplars/<slug>/profile.md  # one per reference repo
└── guides/                      # distilled ACROSS repos
    ├── architecture-principles.md
    ├── code-style.md
    └── ui-design-language.md
```

- **Exemplar profile** — one `profile.md` per reference repo: the original
  ask/context, the architecture chosen and *why*, key patterns worth
  imitating, and repo URL + notable file paths (ADR-007). This is the
  few-shot unit.
- **Cross-cutting guide** — conventions distilled across repos; standing
  defaults independent of any single exemplar.
- **`index.md`** — a hand-maintained decision tree listing each exemplar with
  project-type tags, tech stack, and "use when…" guidance. The research agent
  reads the index and reasons about the intent to pick profiles; no code does
  the matching. Frontmatter-tag filtering via a deterministic tool was
  rejected for v1 (tag extraction from a free-form RFP is itself an LLM step,
  so the determinism is partly illusory); "load everything" was rejected
  because it collapses beyond ~5 exemplars.

## Consequences

- v1 scope covers all three knowledge kinds the SA raised: architecture
  decisions, code style/practices, and visual/UI design language.
- Curation of `index.md` is a human responsibility; `/aidlc-distill`
  (ADR-001) proposes entries but does not own them.
- Raw profiles are loaded only by the research agent; other agents receive
  exemplar content through the reference brief (ADR-006, ADR-008).