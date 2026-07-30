# 07 — Release ceremony for the patterns KB

**What to build:** The KB lands as a user-visible release per repo policy (ADR-005): an org install that copies a fresh `dist/<harness>/` gets the patterns KB, and the CHANGELOG/README tell them it exists. Also the docs sweep the Documentation Policy requires.

**Blocked by:** 02, 03, 04, 05, 06 — everything shipping in the release.

**Status:** ready-for-agent

- [ ] Authored version tool bumped; README badge bumped; matching CHANGELOG heading + bullets (summary paragraph with any upgrade instruction, bullets on what users invoke/see)
- [ ] Version/changelog/badge sync pin (t68) green
- [ ] `bun scripts/package.ts` regenerated all dists; `--check` parity green
- [ ] docs/ and README grepped for stale references to anything this effort added or renamed; fixed in the same commit
- [ ] Full unit tier green, including the new shape test