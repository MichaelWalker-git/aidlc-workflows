# 03 — Cross-cutting guides with targeted Tier-1 wiring

**Parent spec:** `docs/design/org-bok/SPEC.md` (design: ADR-003 guides, ADR-008 wiring table and precedence).

**What to build:** The three cross-cutting guides ship as real template content — `architecture-principles.md`, `code-style.md`, and `ui-design-language.md` — and load as standing Tier-1 knowledge for exactly the agents that need them: architecture principles for the architect; code style for the developer and quality agents; UI design language for the design and developer agents. The index and exemplar profiles remain visible to the research agent only. Because guides are standing knowledge, the org's defaults (including the "not LLM-looking" UI baseline) apply even on projects where precedent-research was skipped. Agents outside the wiring table (compliance, operations, …) see none of this — no context bloat. Guide content states its own precedence posture: org default on greenfield, outranked by locally discovered affirmed practices on brownfield.

**Blocked by:** 01 — Tracer bullet (org-bok subtree + knowledge-inventory pins must exist). Independent of 02; can run in parallel with it.

**Status:** ready-for-agent

- [ ] The three guides exist with substantive template content (real structure and guidance placeholders an SA can fill, not lorem)
- [ ] Guide loading follows the ADR-008 wiring table exactly; index + profiles stay research-agent-only; no guide lands in the all-agents shared area
- [ ] Content-shape tests (following the existing knowledge-doc prose-check pattern): index has required per-exemplar fields (tags, stack, "use when…"), each profile has required sections and a non-empty repo URL in frontmatter, each guide has its expected top-level headings and is non-empty
- [ ] Knowledge-inventory pins updated for the new files and their per-agent placement
- [ ] Guides state the precedence rule; wording consistent with the brief contract from ticket 02 (coordinate if 02 lands first)
- [ ] Dist regenerated; packaging parity green across harnesses
- [ ] Docs updated (knowledge system / customization guidance for SAs authoring guides); version bump + CHANGELOG per changelog policy
- [ ] New tests carry `covers:` headers; coverage registry regenerated