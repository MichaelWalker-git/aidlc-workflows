# 02 — Downstream consumption: reference-brief edges and prose steps

**Parent spec:** `docs/design/org-bok/SPEC.md` (design: ADR-006, ADR-008 precedence rule).

**What to build:** When a project's precedent-research stage has produced a reference brief, the downstream stages actually use it: feasibility, rough-mockups, refined-mockups, application-design, and code-generation each list the brief among their inputs and carry an explicit step to load it and follow its exemplar patterns. Mockup and code-generation work receives the brief's concrete UI directives (design tokens, spacing/layout conventions, component patterns, copy tone) so generated UI follows the org design language instead of generic LLM styling. When the brief is absent because the stage was skipped, every consumer proceeds cleanly without it — no hunting, no failure. The brief contract itself is finalized in this ticket: selected exemplars + rationale, patterns to follow, UI directives as imperatives, the precedence rule (brownfield: locally discovered affirmed practices outrank BoK guidance), deep-dive pointers, and an honest "no matching precedent" form.

**Blocked by:** 01 — Tracer bullet (the stage, agent, and `reference-brief` artifact must exist).

**Status:** ready-for-agent

- [ ] Feasibility, rough-mockups, refined-mockups, application-design, and code-generation each add `reference-brief` to `consumes:` plus one prose step: follow the brief's exemplar patterns; if the brief is absent, proceed without it
- [ ] Grid validation proves every new consumes edge has an on-path producer, with the conditional shape correct for a CONDITIONAL producer
- [ ] The reference-brief contract (sections listed above, including UI directives and the stated precedence rule) is defined in the research agent's stage steps and reflected in the fixture exemplar's expected output shape
- [ ] The brief's "no matching precedent" form is specified so downstream agents are told not to force-fit an exemplar
- [ ] Dist regenerated; packaging parity, stage-graph drift, and SKILL-table checks green; artifact/edge pins updated
- [ ] Docs updated where stage inputs/steps are documented; version bump + CHANGELOG per changelog policy
- [ ] New/changed tests carry `covers:` headers; coverage registry regenerated