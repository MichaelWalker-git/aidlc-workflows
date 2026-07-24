# 05 — `/aidlc-distill` session skill

**Parent spec:** `docs/design/org-bok/SPEC.md` (design: ADR-001).

**What to build:** A solution architect authoring the BoK runs `/aidlc-distill` (the fork's 4th session skill) in this fork's repo, pointing it at an org repo path or URL. The session analyzes the repo reverse-engineering-style, then interviews the SA for the tacit knowledge code can't reveal — the original ask/context and why the architecture was chosen — and drafts: an exemplar `profile.md` in the required shape (ask, architecture, why, key patterns, repo URL + notable file paths), a proposed `index.md` entry (project-type tags, tech stack, "use when…" guidance), and proposed additions to the cross-cutting guides where it spots org-wide conventions. The SA reviews, edits, and commits — the skill drafts, the human curates. Re-running against a repo that already has a profile refreshes it rather than duplicating.

**Blocked by:** 01 — Tracer bullet (profile + index formats), 03 — Guides (guide formats to propose updates against). Ticket 04's pointer fields should be respected if landed; coordinate.

**Status:** ready-for-agent

- [ ] `/aidlc-distill` ships as the 4th session skill and satisfies the existing session-skill contract seams: frontmatter contract, spec conformance, line budget, and the session-skills read-only/data-plane contract (it writes only BoK drafts, never workflow state)
- [ ] The session flow covers: repo analysis → human interview for ask/why → draft profile → propose index entry → propose guide updates → hand off to human curation (no auto-commit)
- [ ] Drafted profiles conform to the content-shape required sections (verified against the same shape tests as the fixture exemplar)
- [ ] Re-run against an existing exemplar updates/refreshes the draft rather than creating a duplicate
- [ ] Dist regenerated; packaging parity green; skill roster pins (3→4 session skills) and any skill-count checks updated
- [ ] Docs updated: SA-facing authoring guidance (how to distill a repo, curation expectations), skill listed wherever session skills are enumerated; version bump + CHANGELOG per changelog policy
- [ ] New tests carry `covers:` headers; coverage registry regenerated