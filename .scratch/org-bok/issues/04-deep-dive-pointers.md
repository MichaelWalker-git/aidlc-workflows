# 04 — Deep dives: repo pointers with graceful degradation

**Parent spec:** `docs/design/org-bok/SPEC.md` (design: ADR-007).

**What to build:** An agent that needs higher fidelity than the distilled markdown can reach into the real exemplar repo: each profile's frontmatter carries the repo's git URL and a short list of notable file paths (the real lint config, a canonical component, design tokens). The research agent may consult them while composing the brief, and downstream consumers may fetch a pointed-at file when the brief's deep-dive pointers say it helps — using whatever git credentials the session already has, with no new auth machinery. When credentials are missing or the repo is unreachable, the agent notes "deep dive unavailable" and continues from the markdown; a failed fetch is never a stage failure. The brief must remain fully usable from distilled markdown alone.

**Blocked by:** 01 — Tracer bullet (profile format), 02 — Downstream consumption (the brief contract and consumer steps this extends).

**Status:** done (2.6.3)

- [x] Profile frontmatter schema includes repo git URL + notable file paths; the fixture exemplar demonstrates it; content-shape tests cover the fields
- [x] Research-agent steps describe the opt-in deep dive and the degradation wording; the brief's deep-dive-pointers section carries URL + paths through to consumers
- [x] Downstream spliced steps (from ticket 02) gain the opt-in fetch guidance and the "deep dive unavailable" degradation — advisory, never a hard dependency; the note lands in the stage deliverable, not just chat (per ADR-007's "in its output")
- [x] Deterministic tests assert the prose/contract surfaces (pointer fields present, degradation wording in agent/stage steps); no tests fetch real credentialed repos
- [x] Dist regenerated; packaging parity green
- [x] Docs updated where profile authoring is described; version bump + CHANGELOG per changelog policy
- [x] New tests carry `covers:` headers; coverage registry regenerated

**Delivered beyond the letter (accepted in review):** Code Generation forwards the deep-dive pointers — with the fetch rule and its degradation verbatim — into the developer-subagent delegation prompt (omitted when Precedent Research was skipped); without this the agent actually writing code never sees the pointers. The Precedent Research stage reference (`docs/reference/04-stages/ideation.md`) also documents the markdown-first deep-dive contract, beyond the profile-authoring docs the checklist named.