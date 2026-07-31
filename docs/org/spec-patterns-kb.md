# Spec: Org Patterns KB — authoritative AWS architecture patterns in the Org BoK

Implementation-facing synthesis of [ADR-001–005](adr/) and the
[glossary](glossary.md) (grilling session, 2026-07-30).

## Problem Statement

Org engineers and AIDLC agents repeatedly re-derive the same AWS architecture decisions — how we do multi-tenant JWT isolation, how we pool Lambda→RDS connections, when we route reads to replicas, how we wire Sentry — from scratch, from memory, or from whichever repo someone happens to remember. The org already has proof-from-production (45 distilled exemplar profiles in the Org BoK) and an Architect with strong opinions, but no single authoritative place where an agent (or human) can look up "what is the org's blessed way to do X on AWS". The result: inconsistent architectures across projects, repeated scars (mistakes the org already paid for once), and Architect time burned re-explaining the same decisions.

## Solution

A patterns knowledge base inside the Org BoK: `core/knowledge/org-bok/patterns/`, organized by the Architect's classification (multi-tenancy, data-layer, serverless-compute, idp, genai, full-stack, eventing, iac, observability). Each pattern is one opinionated page — When to use / Our approach / Exemplars / Gotchas / References — carrying `status`/`reviewed`/`owner` frontmatter and a standing precedence header. A small `INDEX.md` (trigger keywords → path → status) is the entire retrieval layer: four wired agents (architect, aws-platform, devsecops, operations) read it at every activation and open only the pattern files relevant to the current task. Patterns are the org-wide architecture authority; an affirmed team/project memory rule may override one for its space as a documented exception. The KB ships to every harness dist via the existing packager, is pinned by a new shape test, and lands as a full-ceremony release.

This effort is governed by five accepted ADRs in `docs/org/adr/` (001 location, 002 authority/precedence, 003 lifecycle/freshness, 004 retrieval/enforcement, 005 content pipeline/release) and the vocabulary in `docs/org/glossary.md`. The implementation must conform to them; deviations require amending the ADR first.

## User Stories

1. As an AIDLC architect agent, I want to read a patterns index at activation, so that I know which org architecture decisions exist before I design anything.
2. As an AIDLC architect agent, I want to open only the pattern files whose trigger keywords match my current task, so that I get org guidance without flooding my context.
3. As an AIDLC aws-platform agent, I want the org's blessed data-layer patterns (connection pooling, read replicas) available at activation, so that infrastructure specs default to the org way instead of a textbook way.
4. As an AIDLC devsecops agent, I want the org's Sentry observability pattern available at activation, so that security and monitoring wiring follows the org's actual configuration and incident history.
5. As an AIDLC operations agent, I want the same Sentry pattern at activation, so that observability setup and incident response use the org's real conventions.
6. As any wired agent, I want each INDEX.md row to show the pattern's status, so that I can calibrate trust (blessed = binding default, draft = advisory) before opening the file.
7. As any wired agent, I want every pattern file to open with a standing precedence header, so that reading a pattern in isolation still tells me to check the active space's memory for documented exceptions.
8. As an agent resolving a conflict, I want a deterministic precedence rule (pattern = org default; affirmed team/project rule naming the pattern = space-scoped exception), so that I never have to guess or interrupt a human for a documented case.
9. As the org Architect, I want pattern files to be the org-wide source of truth for architecture decisions, so that changing a blessed approach happens once, by PR under my review, not by editing memory in one space.
10. As the org Architect, I want to review concrete draft pages rather than author patterns from scratch, so that my involvement is the smallest viable unit of my time (the blessed-vs-legacy call and the scars).
11. As the org Architect, I want my approval to be what flips a pattern from `draft` to `blessed`, so that nothing becomes binding org law without my sign-off.
12. As the AIDLC customizer (p.lysanets), I want `status: draft | blessed | deprecated`, `reviewed: YYYY-MM-DD`, and `owner:` frontmatter on every pattern, so that lifecycle state is machine-checkable and visible.
13. As the AIDLC customizer, I want a quarterly freshness cadence re-verifying each pattern against its exemplar repos, so that a stale "blessed" file doesn't actively mislead agents that treat explicit context as org law.
14. As the AIDLC customizer, I want a pattern whose exemplar diverged to drop back to `draft` until re-blessed, so that trust calibration stays honest between reviews.
15. As the AIDLC customizer, I want deprecated patterns to stay in place with a pointer to their successor for one review cycle, so that agents following old links land on a redirect instead of a 404.
16. As a pattern author, I want a per-pattern content pipeline (distill exemplar if missing → code-read the specific mechanism → draft → Architect review → merge), so that pattern content is extracted from real org code rather than reproduced from model knowledge.
17. As a pattern author, I want Tennis Systems, Paradise Law, Punch and Chance, and Service Delivery Platform added to the distill allowlist and batch-distilled, so that the v1 patterns can cite their exemplars.
18. As a pattern author, I want a topic admission rule (a file exists only if it carries at least one org-specific decision, default, exemplar, or scar), so that the KB stays thin and opinionated instead of mirroring AWS's surface area.
19. As a pattern author, I want pure-textbook AWS content to remain reference links inside existing files, so that maintenance load grows with org decisions, not with AWS documentation.
20. As a v1 reader, I want the `multi-tenancy/` pages (`jwt-tenant-isolation.md`, `tenant-data-partitioning.md`, `tenant-onboarding.md`) to ship as `draft` now, so that I get multi-tenancy guidance immediately with calibrated trust rather than waiting on the Architect's SDP audit. *(Amended 2026-07-31 with ADR-005: broadened from the single JWT page after the code-read surfaced org decisions across the whole class.)*
21. As a v1 reader, I want `data-layer/connection-pooling.md`, `data-layer/read-replicas.md`, and `observability/sentry.md` in the initial release, so that the highest-demand decisions are covered from day one.
22. As a team lead with a legitimate constraint (e.g. a customer-mandated stack), I want to record a documented exception in my space's team.md/project.md that names the pattern and the reason, so that my space can deviate without weakening the org default for everyone else.
23. As an org engineer on any harness (Claude Code, Kiro, Kiro IDE, Codex, opencode), I want the patterns KB shipped in my `dist/<harness>/` tree by the existing packager, so that I get it by copying the dist, with no clone/fetch machinery.
24. As a repo maintainer, I want a shape test pinning pattern frontmatter, required sections, bidirectional INDEX↔file consistency, the precedence header, and the four agents' activation wiring, so that template erosion and index drift fail CI instead of silently degrading retrieval.
25. As a repo maintainer, I want the KB to land with full release ceremony (version bump, CHANGELOG entry, README badge, packager parity, t68 green), so that org installs actually see the feature and CI stays green.
26. As a maintainer merging upstream, I want everything org-owned confined to `org-bok/`, agent activation-list lines, and one short `org.md` delegation section, so that upstream merges rarely collide with org customization.
27. As a future consumer outside AIDLC (e.g. a Sentry root-cause bot), I want the patterns directory to be cleanly extractable to its own repo with content unchanged, so that a second consumer only changes the KB's address, not its shape.
28. As a reader of any pattern, I want relative cross-links to exemplar profiles, so that the evidence behind each decision is one hop away in any harness.
29. As an agent reading a `draft` pattern, I want the explicit instruction to treat it as advisory ("verify before relying on it"), so that unreviewed content never masquerades as org law.
30. As the org.md reader, I want a short architecture-patterns delegation section (same shape as the existing code-style pointer), so that the rule layer names the patterns KB as the architecture authority without duplicating its content.

## Implementation Decisions

All decisions below were made in the 2026-07-30 grilling session and are recorded as ADRs 001–005 under `docs/org/adr/`; the glossary in `docs/org/glossary.md` defines the vocabulary and must be used in all authored content.

- **Location (ADR-001):** the patterns KB lives beside the exemplars in the Org BoK inside this fork; this fork *is* the org repo. Nine class subdirectories mirror the Architect's classification: multi-tenancy, data-layer, serverless-compute, idp, genai, full-stack, eventing, iac, observability. Distribution is the existing packager — no new mechanism. Extraction to a separate repo is deferred until a second non-AIDLC consumer materializes.
- **Authority and precedence (ADR-002):** pattern files are the org-wide architecture authority. `org.md` gains a short delegation section pointing at the patterns KB — the same delegation shape as the existing code-style pointer, including "affirmed memory rules override" semantics. A team/project memory rule may override a pattern for its space only as a documented exception naming the pattern and the reason. Every pattern file carries a standing precedence header so it is self-describing when read in isolation. "Our approach" sections may use normative language.
- **Lifecycle (ADR-003):** frontmatter `status: draft | blessed | deprecated`, `reviewed: YYYY-MM-DD`, `owner:` on every pattern. Architect approval flips draft→blessed. Freshness is quarterly, owned by the AIDLC customizer; a diverged exemplar sends the pattern back to draft. Deprecated files keep a successor pointer for one review cycle, then leave the index. Drafts ARE indexed and shipped (rejected alternative: hiding drafts).
- **Retrieval (ADR-004):** no search agent. INDEX.md is the whole retrieval layer — one line per pattern: trigger keywords → path → status. Exactly four agents get one new activation-list line ("Read the patterns INDEX.md; open only the pattern files relevant to the current task"): architect, aws-platform, devsecops, operations. The line uses the `{{HARNESS_DIR}}` token so the packager projects it per harness. developer and architecture-reviewer wiring is deferred to v2.
- **Pattern page template:** When to use / Our approach / Exemplars / Gotchas / References, preceded by the frontmatter block and the precedence header. Exemplar citations are relative links (`../exemplars/<repo>/profile.md`). Scars live in Gotchas.
- **Content pipeline (ADR-005):** per pattern — distill the exemplar repo if missing (existing `/aidlc-distill` / batch machinery) → agent code-read of the specific mechanism (JWT claims path, pool config, replica routing) → draft the page → Architect review → merge. Step zero: add Tennis Systems, Paradise Law, Punch and Chance, and Service Delivery Platform to the distill allowlist and batch-distill them.
- **v1 content:** six files — the `multi-tenancy/` class (`jwt-tenant-isolation.md`, `tenant-data-partitioning.md`, `tenant-onboarding.md`; all ship `draft`, not blocked on the SDP audit — amended 2026-07-31 with ADR-005 from the single JWT page), `data-layer/connection-pooling.md`, `data-layer/read-replicas.md`, `observability/sentry.md` (sources: Sentry org config, Ivan's root-cause bot, the Architect's incident stories). Remaining classes (serverless-compute, idp, genai, full-stack, eventing, iac) start as empty directories, filled incrementally under the topic admission rule.
- **Topic admission rule:** a pattern file is admitted only with at least one org-specific statement (decision, default, exemplar, or scar). Textbook AWS content is a reference link, never a file. The AWS exam-Q&A idea stays out unless pattern files prove to need few-shot scenarios.
- **Release ceremony:** version bump in the authored version tool, CHANGELOG heading + bullets, README badge bump, packager regeneration with the parity check green — per the repo's Changelog Policy. Docs policy applies: grep docs/ and README for stale references in the same commit.
- **Working rule:** edit `core/` only; `dist/<harness>/` trees are regenerated, never hand-edited.

## Testing Decisions

- **One new seam, at the highest level:** a single new `t*`-numbered unit test in the existing bun/TypeScript unit tier, asserting over the **shipped dist bytes** (the same tree the sibling structural pins t87/t68 read) rather than `core/` sources — so it exercises the packager projection for free. (Seam confirmed with the user.)
- The shape test pins, in one file: (a) every pattern file except INDEX.md has the three frontmatter fields with valid values (`status` ∈ draft/blessed/deprecated, `reviewed` a date, `owner` non-empty); (b) every pattern file has the five required section headings outside fenced code blocks (reusing the fence-aware whole-line heading convention from the stage-compartment pin); (c) the standing precedence header is present; (d) bidirectional INDEX↔file consistency — every INDEX row resolves to an existing file, every pattern file appears in exactly one INDEX row, and the row's status matches the file's frontmatter; (e) each of the four wired agent files contains the patterns-INDEX activation line (projected, i.e. with the harness directory substituted, not the raw token).
- Good tests here test **external behavior only**: the shipped bytes an org install actually receives. No test reaches into packager internals or asserts on `core/` file layout.
- **Existing seams reused, no additions:** the version/changelog/badge sync pin (t68) already guards the release ceremony; the packager `--check` byte-parity guard already catches hand-edited or stale dists. Neither needs modification beyond the ordinary bump.
- **Prior art:** the stage-compartment-headers pin (fence-aware required-heading walker over shipped stage files), the agent-frontmatter and file-structure structural twins, and the version-changelog sync pin — the new test follows their `// covers:` header and fixtures conventions.
- Content quality (is a pattern's advice *correct*?) is deliberately not machine-tested — that is the Architect review step and the quarterly freshness cadence (ADR-003 explicitly notes the test cannot enforce that reviews happen).

## Out of Scope

- **A separate patterns repository** — extraction happens only if a second non-AIDLC consumer materializes (ADR-001).
- **A dedicated search/retrieval agent** — rejected in ADR-004; the index is the retrieval layer.
- **Wiring developer and architecture-reviewer agents** — deferred to v2 (no v1 content for them to consume).
- **Event-driven re-distill freshness flagging** (citation map tying freshness to the distill pipeline) — revisit at ~20+ patterns (ADR-003).
- **Backlog pattern content** beyond the six v1 files — serverless-compute, idp, genai, full-stack, eventing, iac topics are admitted incrementally later under the admission rule.
- **The AWS exam-Q&A few-shot corpus** — stays out unless pattern files prove to need it (ADR-005).
- **Machine enforcement of the quarterly review cadence** — remains a human responsibility; only the frontmatter's existence is machine-checked.
- **Blessing the multi-tenancy patterns** — they ship `draft`; the Architect's Service Delivery Platform audit later blesses or amends them, outside this spec.
- **Space-level (per-install) knowledge placement** — rejected in ADR-001.

## Further Notes

- The Architect review step is intentionally the only human bottleneck in the pipeline, and deliberately the smallest one (review-a-draft, not author-from-scratch).
- Agents treat explicit context as org law — this is *why* status calibration and the freshness cadence exist. Any future change that widens what ships to agents should preserve the draft/blessed trust distinction.
- The four new distill-allowlist repos (Tennis Systems, Paradise Law, Punch and Chance, Service Delivery Platform) are accessible now; batch distill is step zero and can run before any pattern drafting starts.
- Upstream-merge safety is a standing design constraint: org-owned surface is confined to `org-bok/`, one `org.md` section, and four one-line agent edits. Keep it that way as the KB grows.
- ADRs 001–005 and the glossary are already authored on the `v2-customization` branch (staged, uncommitted at spec time) and are the normative record; this spec is the implementation-facing synthesis of them.