# 03 — Pattern: data-layer/connection-pooling (draft)

**What to build:** The org's connection-pooling decision as a pattern page: an agent facing Lambda→RDS work reads the INDEX, matches the trigger keywords, opens the file, and gets the org default (with exemplar citations and scars) instead of textbook advice. Pipeline per ADR-005: agent code-read of the actual pool configuration in the relevant exemplar repos → draft the page → indexed. Ships as `draft` (advisory) pending Architect review.

**Blocked by:** 01 (exemplar profiles to cite), 02 (skeleton, template, index, shape test).

**Status:** ready-for-agent

- [ ] Page follows the template: frontmatter (`status: draft`, `reviewed`, `owner`), precedence header, all five sections
- [ ] "Our approach" states the org decision extracted from real repo code, not model knowledge; satisfies the topic admission rule (at least one org-specific decision/default/exemplar/scar)
- [ ] Exemplars section cites profiles via relative links
- [ ] INDEX.md row added (trigger keywords → path → status)
- [ ] Shape test, packager, and parity check green