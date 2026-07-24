# 01 — Tracer bullet: `precedent-research` stage, `aidlc-research-agent`, BoK skeleton, deterministic gate

**Parent spec:** `docs/design/org-bok/SPEC.md` (design: ADR-002, ADR-003, ADR-004, ADR-005 in `docs/design/org-bok/`).

**What to build:** A user starting an AI-DLC project on an install that ships an Org BoK sees a new `precedent-research` stage run right after intent-capture: the new research agent reads the intent, reasons over the BoK's curated `index.md`, loads the matching exemplar profile, and writes a `reference-brief` artifact naming the selected exemplar, the patterns to follow, and the rationale (or honestly stating that no precedent matches). A user on an install with no BoK (or an empty index) never sees the stage — the orchestrator skips it via a deterministic gate and routes to the next eligible stage. The BoK ships as a skeleton: a stub index plus one fixture exemplar profile demonstrating the required shape (ask/context, architecture, why, key patterns, repo pointers in frontmatter).

This is the tracer bullet: it cuts the complete path — knowledge subtree → stage frontmatter → agent persona → gate predicate → graph recompile → packaged dist → orchestrator routing — and every structural test pin moves with it.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Org BoK skeleton ships in the authored core (index + one fixture exemplar profile with all required sections) and projects into every harness dist via the packager
- [ ] New `precedent-research` stage: ideation, directly after intent-capture (display renumbering of later ideation stages is display-only), CONDITIONAL, `produces: reference-brief`, consumes the intent artifact, lead agent is the research agent, standard Sensors/Learn compartments present
- [ ] New `aidlc-research-agent` (15th persona, judgment tier) satisfies the agent frontmatter contract; its Tier-1 knowledge dir is the only place index + profiles are wired
- [ ] Gate predicate ("index exists with ≥1 exemplar entry") is deterministic, checked at routing time, and unit-tested at its own seam (empty index / no entries / well-formed index)
- [ ] Orchestrator-directive fixtures prove both paths: BoK present → directive enters precedent-research after intent-capture; BoK absent → stage skipped, routing proceeds
- [ ] Dist regenerated; packaging byte-parity check green; stage-graph drift and SKILL-table consistency checks green
- [ ] All moved pins updated: agents 14→15 (file-structure smoke, agent loader, documentation parity, per-harness packaging), stages 32→33 (frontmatter walk, SKILL table cross-checks, compartment headers), runners 29→30, artifact-count pin includes `reference-brief`, knowledge-inventory pins cover the new agent dir + org-bok subtree, scope EXECUTE-count pins re-checked
- [ ] New core markdown uses the harness-dir token, never a literal harness path
- [ ] Docs sweep per documentation policy (stage tables, agent counts, guides); version bump + CHANGELOG entry + README badge per changelog policy
- [ ] All new tests carry `covers:` headers; coverage registry regenerated