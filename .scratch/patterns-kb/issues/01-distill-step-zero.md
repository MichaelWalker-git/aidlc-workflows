# 01 — Distill step zero: four new exemplar repos

**What to build:** The four repos the v1 patterns will cite as evidence — Tennis Systems, Paradise Law, Punch and Chance, and Service Delivery Platform — become distilled exemplars in the Org BoK, exactly like the existing 45. After this ticket, a pattern author (or the research agent) can open each repo's profile and the exemplar index routes to them. Uses the existing `/aidlc-distill` allowlist + batch machinery (ADR-005 step zero); no new mechanism.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] All four repos added to the curated distill allowlist
- [ ] Batch distill run over them; each produces a profile under the Org BoK exemplars tree
- [ ] Each profile gets a reviewed entry in the exemplar index (tags, tech stack, "use when…", profile link)
- [ ] Packager regenerated and parity check green (profiles ship to every harness dist)