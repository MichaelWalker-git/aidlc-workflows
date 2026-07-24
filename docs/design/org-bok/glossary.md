# Org BoK — Glossary

Terms defined by this design, plus existing repo terms it leans on.

## New terms

- **Org BoK (Organizational Body of Knowledge)** — the curated, checked-in
  markdown corpus at `core/knowledge/org-bok/`: one index, N exemplar
  profiles, and cross-cutting guides. Distilled offline from the org's
  reference repositories.
- **Exemplar** — a past organizational project chosen as a reference ("if
  you're building an IDP, look at these"). Physically a directory
  `org-bok/exemplars/<slug>/`.
- **Exemplar profile (`profile.md`)** — the few-shot unit: the original
  ask/context, the architecture chosen and why, key patterns worth imitating,
  and deep-dive pointers (repo URL + notable file paths).
- **Cross-cutting guide** — a convention document distilled *across* exemplar
  repos rather than from one: `architecture-principles.md`, `code-style.md`,
  `ui-design-language.md`. Loaded as Tier-1 knowledge by targeted agents.
- **Index (`index.md`)** — the hand-curated decision tree over exemplars:
  project-type tags, tech stack, and "use when…" guidance. Read only by the
  research agent, which reasons over it to select profiles for the current
  intent.
- **Reference brief** — the runtime artifact produced by `precedent-research`:
  selected exemplars, patterns to follow, concrete UI directives, the
  precedence rule, and deep-dive pointers. Consumed by feasibility, mockups,
  application-design, and code-generation.
- **UI directives** — the brief's concrete, imperative styling instructions
  (design tokens, spacing/layout conventions, component patterns, copy tone)
  aimed at making generated UIs follow the org design language instead of
  generic LLM defaults.
- **Deep dive** — an opt-in runtime fetch of real files from an exemplar's
  repo using ambient git credentials, guided by the profile's notable-path
  list. Failure degrades gracefully; never a stage failure.
- **`precedent-research`** — the new CONDITIONAL ideation stage (displayed
  1.2, sibling of `market-research`) that turns intent + Org BoK into a
  reference brief. Gated on `org-bok/index.md` existing with ≥1 exemplar.
- **`aidlc-research-agent`** — the new 15th persona; sole lead of
  `precedent-research`; the only agent that loads the index and raw profiles.
- **`/aidlc-distill`** — the new 4th session skill; an interactive, offline
  distillation session that analyzes an org repo, interviews the human for
  ask/why, drafts a profile, proposes guide updates, and leaves curation and
  commit to the human.
- **Distillation** — the offline process of converting a reference repo +
  human tacit knowledge into an exemplar profile and guide updates.

## Existing repo terms this design relies on

- **Stage / stage graph** — one markdown file per workflow step with
  frontmatter edges (`produces`/`consumes`, `requires_stage`), compiled by
  `aidlc-graph compile` into `stage-graph.json`; the orchestrator routes off
  the compiled graph.
- **Tier-1 / Tier-2 knowledge** — Tier-1: framework-shipped, read-only
  per-agent knowledge (`.claude/knowledge/…`). Tier-2: team-managed,
  empty-at-bootstrap space knowledge (`aidlc/spaces/<space>/knowledge/…`),
  auto-loaded when present. The Org BoK ships at Tier-1.
- **Memory layer** — the layered rule system (`org.md` → `team.md` →
  `project.md` → phase), loaded before knowledge; holds affirmed
  ALWAYS/NEVER-style practices, not reference prose.
- **`practices-discovery` (2.2)** — the existing inception stage that infers
  local conventions from the current repo's evidence and promotes affirmed
  ones to team memory. Its output outranks BoK guides on brownfield (ADR-008).
- **codekb** — the existing per-space, per-repo store of 9 reverse-engineered
  artifacts (`aidlc/spaces/<space>/codekb/<repo>/`) for the *current* repo;
  the Org BoK is its cross-repo, org-level cousin with a different, few-shot
  shape.
- **CodeKB MCP** — the external multi-repo structural index the composer can
  query; out of scope for v1 but a candidate future backend.
- **Sensor** — a deterministic, advisory verification manifest; the pattern
  the `precedent-research` gate check borrows, and the shape a future
  anti-generic-UI check would take.