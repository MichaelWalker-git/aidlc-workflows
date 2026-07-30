# Org Customization Docs

Design records for this fork's org-level customization of AIDLC. Kept
separate from the upstream docs trees (`docs/guide/`, `docs/reference/`,
`docs/harness-engineering/`) so upstream merges never collide with
org-owned decisions.

- [Glossary](glossary.md)
- [Spec — patterns KB](spec-patterns-kb.md) — implementation-facing synthesis of the ADRs below
- ADRs — patterns knowledge base (grilling session, 2026-07-30):
  - [ADR-001 — KB location: `core/knowledge/org-bok/patterns/` in this fork](adr/001-patterns-kb-location.md)
  - [ADR-002 — Patterns are the org architecture authority; space memory may document exceptions](adr/002-pattern-authority-and-precedence.md)
  - [ADR-003 — Lifecycle via frontmatter status; quarterly freshness cadence](adr/003-pattern-lifecycle-and-freshness.md)
  - [ADR-004 — No search agent; INDEX.md at activation for four agents; shape test](adr/004-retrieval-wiring-and-enforcement.md)
  - [ADR-005 — Content pipeline (distill → code-read → draft → review) and release ceremony](adr/005-content-pipeline-and-release.md)