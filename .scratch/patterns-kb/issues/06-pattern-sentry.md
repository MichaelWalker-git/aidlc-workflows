# 06 — Pattern: observability/sentry (draft)

**What to build:** The org's Sentry observability conventions as a pattern page — the file the devsecops and operations agent wiring exists to serve (ADR-004). Sources per ADR-005: the Sentry org configuration, Ivan's root-cause bot, and the Architect's incident stories (scars into Gotchas). Ships as `draft`.

**Blocked by:** 02 only — its sources are operational history, not the four new distills.

**Status:** ready-for-agent

- [ ] Page follows the template: frontmatter (`status: draft`, `reviewed`, `owner`), precedence header, all five sections
- [ ] Gotchas captures at least one scar from org incident history; satisfies the topic admission rule
- [ ] Exemplars/References cite the org Sentry config and bot rather than textbook Sentry docs alone
- [ ] INDEX.md row added
- [ ] Shape test, packager, and parity check green