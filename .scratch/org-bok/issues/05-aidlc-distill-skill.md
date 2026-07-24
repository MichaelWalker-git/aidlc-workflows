# 05 — `/aidlc-distill` session skill

**Parent spec:** `docs/design/org-bok/SPEC.md` (design: ADR-001).

**What to build:** A solution architect authoring the BoK runs `/aidlc-distill` (the fork's 4th session skill) in this fork's repo, pointing it at an org repo path or URL. Before any analysis, the session resolves the target against a curated repo allowlist (`core/knowledge/org-bok/distill-allowlist.md` — hand-maintained like `index.md`, shipped by the packager); a target not on the list stops the session with a pointer to the allowlist file, and the repo is never read. For an allowed target, the session analyzes the repo reverse-engineering-style, then interviews the SA for the tacit knowledge code can't reveal — the original ask/context and why the architecture was chosen — and drafts: an exemplar `profile.md` in the required shape (ask, architecture, why, key patterns, repo URL + notable file paths), a proposed `index.md` entry (project-type tags, tech stack, "use when…" guidance), and proposed additions to the cross-cutting guides where it spots org-wide conventions. The SA reviews, edits, and commits — the skill drafts, the human curates. Re-running against a repo that already has a profile refreshes it rather than duplicating.

**Blocked by:** 01 — Tracer bullet (profile + index formats), 03 — Guides (guide formats to propose updates against). Ticket 04's pointer fields should be respected if landed; coordinate.

**Status:** ready-for-agent

- [ ] `/aidlc-distill` ships as the 4th session skill and satisfies the existing session-skill contract seams: frontmatter contract, spec conformance, line budget, and the session-skills read-only/data-plane contract (it writes only BoK drafts, never workflow state)
- [ ] The session flow covers: allowlist check → repo analysis → human interview for ask/why → draft profile → propose index entry → propose guide updates → hand off to human curation (no auto-commit)
- [ ] Repo allowlist ships as `core/knowledge/org-bok/distill-allowlist.md` (curated frontmatter list of allowed repo URLs/paths, glob entries permitted) and projects into every harness dist; the skill's step 0 loads it and refuses non-matching targets before any repo access
- [ ] The allowlist match predicate is deterministic and unit-tested at its own seam (missing/empty allowlist, exact-URL match, glob match, non-matching target), following the BoK-gate predicate pattern from ticket 01
- [ ] Drafted profiles conform to the content-shape required sections (verified against the same shape tests as the fixture exemplar)
- [ ] Re-run against an existing exemplar updates/refreshes the draft rather than creating a duplicate
- [ ] Dist regenerated; packaging parity green; skill roster pins (3→4 session skills) and any skill-count checks updated
- [ ] Docs updated: SA-facing authoring guidance (how to distill a repo, curation expectations), skill listed wherever session skills are enumerated; version bump + CHANGELOG per changelog policy
- [ ] New tests carry `covers:` headers; coverage registry regenerated