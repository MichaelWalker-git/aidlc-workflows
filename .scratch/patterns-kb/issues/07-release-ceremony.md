# 07 — Release ceremony for the patterns KB

**What to build:** The KB lands as a user-visible release per repo policy (ADR-005): an org install that copies a fresh `dist/<harness>/` gets the patterns KB, and the CHANGELOG/README tell them it exists. Also the docs sweep the Documentation Policy requires.

**Blocked by:** 02, 03, 04, 05, 06 — everything shipping in the release.

**Status:** done — shipped as 2.7.0 (commit 062a591), the consolidating minor closing 2.6.7–2.6.12

- [x] Authored version tool bumped; README badge bumped; matching CHANGELOG heading + bullets (summary paragraph with any upgrade instruction, bullets on what users invoke/see)
- [x] Version/changelog/badge sync pin (t68) green
- [x] `bun scripts/package.ts` regenerated all dists; `--check` parity green
- [x] docs/ and README grepped for stale references to anything this effort added or renamed; fixed in the same commit (none stale; README Key Features gained an Org BoK/patterns-KB pointer so the release is discoverable outside the changelog)
- [x] Full unit tier green, including the new shape test