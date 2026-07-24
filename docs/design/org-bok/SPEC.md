# Spec: Organizational Body of Knowledge (Org BoK)

**Status:** Ready for agent. Pending publication to the issue tracker (gh unauthenticated at authoring time — apply `ready-for-agent` when published).
**Design basis:** the ADRs and glossary in this directory (`docs/design/org-bok/`). Terms below follow [glossary.md](glossary.md); every "why" is recorded in ADR-001…008.

## Problem Statement

Our delivery teams run AI-DLC workflows on new client asks (often RFP-shaped), but the generated architectures, code, and especially UIs come out generic — they ignore the organization's accumulated experience and "look LLM-generated." The knowledge that would fix this lives scattered across our past project repositories: which architecture we chose for which kind of ask and why, how we actually write code, and what our design language looks like. Agents can't consult it today, and crawling the whole repo library at runtime is too slow, too token-expensive, and needs credentials we can't assume.

## Solution

Ship the organization's body of knowledge inside this fork as curated, distilled markdown, and teach the workflow to route each project's intent to the right precedent:

- **Offline:** a new `/aidlc-distill` session skill turns a reference repo plus a human interview (the ask, the rationale) into an **exemplar profile**, and proposes updates to **cross-cutting guides** (architecture principles, code style, UI design language). A human curates and commits the output into the fork's knowledge layer; the packager ships it to every harness dist.
- **Runtime:** a new CONDITIONAL ideation stage, **`precedent-research`** (displayed 1.2, sibling of `market-research`), led by a new **`aidlc-research-agent`**, reads the captured intent, reasons over the curated **index** (the decision tree), loads only the matching exemplar profiles, and produces a **reference brief** — including concrete **UI directives** — that feasibility, mockups, application design, and code generation consume via artifact edges plus explicit prose steps. Profiles carry repo pointers for opt-in **deep dives** with ambient git credentials.

## User Stories

### Distillation (authoring the BoK)

1. As a solution architect, I want a `/aidlc-distill` session skill I can point at one of our existing repos, so that its architecture and practices are captured as reusable knowledge without me writing documents from scratch.
2. As a solution architect, I want the distillation session to interview me for the original ask and the reasons behind the architecture, so that tacit knowledge that isn't in the code ends up in the exemplar profile.
3. As a solution architect, I want the distillation session to draft a single, concise exemplar profile (ask, architecture, why, key patterns, repo pointers) rather than a verbose multi-file dump, so that agents can load it as few-shot context cheaply.
4. As a solution architect, I want the distillation session to propose additions to the cross-cutting guides when it spots org-wide conventions, so that recurring practices get promoted out of individual exemplars.
5. As a solution architect, I want the distillation session to propose an index entry (project-type tags, tech stack, "use when…" guidance) for the new exemplar, so that the decision tree stays current with minimal effort.
6. As a solution architect, I want to review and edit everything the distillation session drafts before committing, so that the BoK stays curated and trustworthy.
7. As a solution architect, I want to re-run `/aidlc-distill` against a repo that already has a profile, so that I can refresh stale knowledge after the exemplar evolves.
8. As a framework maintainer, I want the BoK to live in the authored core and flow through the normal packaging pipeline, so that every project that copies a dist gets the BoK with zero extra steps.

### Routing (precedent research at runtime)

9. As a delivery team member starting a new AI-DLC project, I want a precedent-research stage to run right after intent capture, so that organizational precedent informs everything downstream from feasibility onward.
10. As a delivery team member, I want the research agent to select only the exemplars relevant to my intent using the curated index, so that context stays small and I don't pay for crawling the whole library.
11. As a delivery team member, I want the stage to produce a reference brief naming the selected exemplars, the patterns to follow, and why they match my ask, so that downstream agents and humans share one statement of precedent.
12. As a delivery team member with an RFP-style ask (e.g. "build an IDP"), I want the index's "use when…" guidance to route me to the projects we built for similar asks, so that proposals and designs start from proven shapes.
13. As a delivery team member on a project with no matching precedent, I want the brief to say so honestly rather than force-fit an exemplar, so that downstream stages don't imitate irrelevant patterns.
14. As a user of a stripped copy of the framework (no BoK present), I want the precedent-research stage to be skipped automatically by a deterministic gate, so that the workflow degrades gracefully instead of erroring.
15. As an orchestrator maintainer, I want the stage's conditional gate to be a deterministic file check (index exists with at least one exemplar), so that routing stays compiled and predictable rather than LLM-judged.
16. As a delivery team member, I want precedent-research and market-research to be independent sibling stages, so that internal precedent and external market analysis can both run (or be skipped) on their own merits.

### Consumption (downstream stages)

17. As an architect agent running feasibility, I want the reference brief in my inputs with an explicit step to follow its exemplar patterns, so that constraint analysis builds on what worked before.
18. As a design-facing agent producing rough or refined mockups, I want the brief's UI directives (tokens, spacing, component conventions, copy tone), so that mockups follow the org design language from the first draft.
19. As a developer agent in code generation, I want the brief's patterns and the code-style guide, so that generated code matches how the organization actually writes software.
20. As an architect agent in application design, I want the selected exemplar's architecture and rationale, so that I reuse proven structure instead of inventing a novel one.
21. As any downstream agent, I want a clear instruction on what to do when the brief is absent (stage was skipped), so that I proceed cleanly without hunting for a missing artifact.
22. As a client stakeholder reviewing generated UI, I want the output to reflect the organization's design language rather than generic LLM styling, so that deliverables look like our work.

### Guides and precedence

23. As an architect agent, I want the architecture-principles guide loaded as standing knowledge, so that org defaults apply even when precedent-research was skipped.
24. As a developer or quality agent, I want the code-style guide loaded as standing knowledge, so that style conventions apply to all code work, not just brief-carrying projects.
25. As a design or developer agent, I want the UI design-language guide loaded as standing knowledge, so that the "not LLM-looking" baseline always applies.
26. As a compliance or operations agent, I want to NOT load UI tokens and exemplar profiles, so that my context isn't bloated with irrelevant material.
27. As a developer agent on a brownfield project, I want locally discovered, affirmed practices to outrank BoK guides — stated explicitly in the brief — so that I keep consistency with the codebase I'm in instead of churning it toward org ideals.

### Deep dives

28. As a downstream agent needing higher fidelity, I want the profile's repo URL and notable file paths, so that I can fetch a real lint config or canonical component instead of imitating a description.
29. As a downstream agent without credentials for an exemplar repo, I want the deep-dive to degrade gracefully with a note, so that a failed fetch never fails my stage.
30. As a solution architect authoring a profile, I want to record which files in the repo are worth fetching, so that deep dives are targeted rather than exploratory crawls.

### Maintenance and safety

31. As a framework maintainer, I want the new stage, agent, and knowledge subtree covered by the existing structural test pins (agent count, stage walk, knowledge inventory, packaging parity), so that drift and hand-edited dists are caught in CI.
32. As a framework maintainer, I want the new artifact edges validated by the existing graph-integrity checks, so that a consumes edge without a producer is rejected at compile time.
33. As a framework maintainer, I want documentation (stage tables, agent counts, guides) updated in the same change, so that docs never contradict the shipped surface.

## Implementation Decisions

All decisions were made in the grilling session and recorded as ADRs in this directory; the ones that shape implementation:

- **Packaging: directly in core, not a plugin** (ADR-002). The BoK content, stage, agent, skill, and knowledge wiring are authored in the core source and projected to every harness dist by the standard packager. The packager also performs the graph recompile and stage-runner generation.
- **Domain model** (ADR-003): a BoK knowledge subtree with three artifact kinds — `index.md` (curated decision tree: per-exemplar tags, stack, "use when…"), `exemplars/<slug>/profile.md` (ask/context, architecture + why, key patterns, repo URL + notable file paths in frontmatter), and `guides/` (`architecture-principles.md`, `code-style.md`, `ui-design-language.md`). Profiles are the few-shot unit; guides are standing defaults.
- **New stage `precedent-research`** (ADR-004): ideation phase, directly after intent-capture, displayed 1.2 with display-only renumbering of later ideation stages (slugs are identity). CONDITIONAL; the gate is a deterministic file check at routing time — index present with ≥1 exemplar entry — following the same pattern as the brownfield gate. Frontmatter declares `produces: reference-brief`, consumes the intent artifact, `lead_agent: aidlc-research-agent`, and the standard Sensors/Learn compartments.
- **New agent `aidlc-research-agent`** (ADR-005): 15th persona, judgment tier, standard frontmatter contract (name = filename, non-empty description, no allowedTools, disallowedTools includes Task). Sole loader of the index and raw profiles via its Tier-1 knowledge dir. Steps: read intent → reason over index → load matching profiles only → optional deep dive → write reference brief.
- **Reference brief contract** (ADR-006): names selected exemplars and rationale; carries patterns-to-follow; carries concrete UI directives (design tokens, spacing/layout conventions, component patterns, copy tone) phrased as imperatives for mockup and code-gen stages; states the precedence rule; includes deep-dive pointers; when no exemplar matches, says so explicitly.
- **Consumption wiring** (ADR-006): feasibility, rough-mockups, refined-mockups, application-design, and code-generation each add `reference-brief` to `consumes:` plus one prose step: load the brief and follow its exemplar patterns; if absent, proceed without it. Edges-only was rejected — prose steps are what make agents act.
- **Deep dives** (ADR-007): markdown-first. Profiles carry git URL + notable paths; downstream agents may fetch with ambient credentials; failure degrades to a note, never a stage failure. No new auth machinery.
- **Precedence** (ADR-008): greenfield → BoK guides are the default; brownfield → practices-discovery's affirmed local conventions win. v1 ships this as a static rule stated in the brief; a conflict-affirmation gate is v2.
- **Guide wiring** (ADR-008): targeted Tier-1 placement — architecture-principles → architect; code-style → developer + quality; ui-design-language → design + developer; index + profiles → research agent only. All-agents-shared placement rejected as context bloat.
- **New session skill `/aidlc-distill`** (ADR-001): the fork's 4th session skill; an interactive offline session (analyze repo → interview human for ask/why → draft profile → propose guide/index updates → human curates). It follows the existing session-skill contract (frontmatter, read-only guarantees with respect to workflow state — it writes only BoK drafts).
- **Prose hygiene**: all new core markdown uses the harness-dir token, never a literal harness path, per the core hygiene rule.
- **Versioning**: this is a user-visible feature — version bump, CHANGELOG entry, and README badge per the changelog policy, in the implementing PR.

## Testing Decisions

Principle: test external behavior at existing seams — the packaged dist bytes, the compiled graph, spawned tool output, and on-disk artifacts — never agent prose or LLM judgment. Whether a brief is *good* is a human/curation concern; whether the machinery routes, gates, compiles, packages, and degrades correctly is what the suite pins.

**Seams (confirmed with the user):** existing seams throughout, plus exactly one new seam — the deterministic BoK-gate predicate ("index exists with ≥1 exemplar"), exposed the same way the brownfield gate is, so the orchestrator-directive tests can drive it with fixtures. No SDK e2e journey in v1.

- **Structural pins move, at the same seams.** Agent-count pins move 14→15 (file-structure smoke, agent-loader unit, documentation-parity, opencode packaging); the new agent joins the agent-frontmatter contract walk. Stage walks grow 32→33 (frontmatter round-trip walk, SKILL table cross-checks, compartment-header walk); the runner-set pin moves 29→30; the artifact-count pin grows with `reference-brief`; scope EXECUTE-count pins are re-checked. The knowledge-inventory pins extend to cover the BoK subtree (12th agent dir + org-bok area + new totals).
- **Graph integrity at the existing compile seam.** The new `consumes: reference-brief` edges must validate against the grid validator (producer exists; conditional shape correct for a CONDITIONAL producer — following the optional/conditional-artifact seam already pinned in the suite). Stage-graph drift and SKILL-table consistency checks catch a missed recompile.
- **Gate behavior at the orchestrator-directive seam.** New state fixtures drive the spawned orchestrate-next engine: BoK present → directive enters precedent-research after intent-capture; BoK absent/empty index → stage skipped and routing proceeds to the next eligible stage. This mirrors the existing directive-table tests.
- **New-seam unit test for the gate predicate itself**: empty index, index without exemplar entries, well-formed index → boolean outcomes, plus its wiring into the compiled conditional.
- **Packaging parity as the umbrella.** The byte-parity check (`--check`) guards that stage, agent, skill, knowledge, and recompiled graph all project into every harness dist; per-harness packaging twins (codex/opencode/kiro smoke) confirm rosters.
- **Session-skill contract tests** for `/aidlc-distill` at the existing skill seams: frontmatter contract, spec conformance, line budget, and the session-skills read-only/data-plane contract.
- **Content-shape tests, prior art: knowledge prose checks.** Following the existing knowledge-doc test pattern (heading/region assertions on specific files): index has the required columns/fields per exemplar; each shipped profile has the required sections (ask, architecture, why, patterns, pointers) and non-empty frontmatter repo URL; guides are non-empty with expected top-level headings.
- **Coverage registry**: all new tests carry `covers:` headers; the registry is regenerated so enumeration gaps fail `--check`.

Explicitly not tested deterministically: exemplar selection quality, brief prose quality, UI output "looking non-generic" (a future advisory sensor, out of scope), and deep-dive fetches against real credentialed repos.

## Out of Scope

- **Conflict affirmation gate** — diffing BoK guides against practices-discovery output and routing conflicts through an affirmation gate (v2; v1 ships the static precedence rule).
- **Anti-generic UI sensor** (`aidlc-ui-fingerprint` or similar) — deterministic detection of LLM styling tells in generated frontend code.
- **CodeKB MCP backend** — querying a live org-wide index instead of, or in addition to, checked-in markdown.
- **Plugin packaging** — revisit if upstream mergeability becomes painful or the plugin mechanism gains memory/space-knowledge seeding.
- **Embedding repo files as assets at distill time** — the "embed critical, point for the rest" refinement of deep dives.
- **Automated BoK freshness/staleness tracking** — refresh is a manual `/aidlc-distill` re-run.
- **Populating the BoK with real org exemplars** — this spec delivers the mechanism plus template/fixture content; distilling actual org repos is follow-on content work by the solution architects.
- **SDK e2e journey for the new stage** — deliberately excluded from v1 test scope (confirmed with the user).

## Further Notes

- The SA's transcript framing maps directly: "distill some of those repos into Markdown" → exemplar profiles; "few shot prompt… example projects" → the profile as the few-shot unit; "decision tree… knows which repos to look at" → the curated index + research agent; "doesn't look LLM generated" → the UI design-language guide + the brief's UI directives.
- Suggested first implementation slice: stage file + research agent + stub index/fixture exemplar + graph recompile — this exercises the gate, the compile, and most moving pins end to end before the distill skill or guide content exists.
- The display renumbering of ideation stages (market-research et al. shift by one) is display-only, but the documentation-parity and SKILL-table tests will surface every place a number is written down; the docs sweep in the implementing commit must follow the documentation policy (grep docs and README for stale references).
- `plugins/test-pro`'s content-test pattern (validating authored content through the framework's real validators imported from dist) is good prior art for the BoK content-shape tests even though this feature is not a plugin.