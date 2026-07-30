# 02 — Patterns KB skeleton, wired and pinned end-to-end

**What to build:** The complete patterns-KB mechanism with no opinion content yet, so every later content ticket is "add one file and one index row." A wired agent activating in any harness reads the patterns INDEX.md and knows to open only task-relevant pattern files; CI fails if the shape ever erodes.

Per ADR-001/002/004:

- `core/knowledge/org-bok/patterns/` with the nine class subdirectories (multi-tenancy, data-layer, serverless-compute, idp, genai, full-stack, eventing, iac, observability) and an `INDEX.md` (one line per pattern: trigger keywords → path → status; empty of rows for now, but its format documented in place)
- The pattern page template: frontmatter (`status` draft|blessed|deprecated, `reviewed` date, `owner`), the standing precedence header, and the five sections (When to use / Our approach / Exemplars / Gotchas / References)
- `org.md` gains the short architecture-patterns delegation section, same shape as the existing code-style pointer
- Exactly four agents (architect, aws-platform, devsecops, operations) get one activation-list line: read the patterns INDEX.md, open only pattern files relevant to the current task — using the `{{HARNESS_DIR}}` token
- One new `t*`-numbered unit test over the shipped dist bytes pinning: frontmatter validity, the five required sections outside code fences, the precedence header, bidirectional INDEX↔file consistency including status agreement, and the four agents' projected activation lines (conventions: the stage-compartment-headers pin's fence-aware walker and `// covers:` header style)

**Blocked by:** None — can start immediately (parallel with 01).

**Status:** ready-for-agent

- [ ] Patterns directory + INDEX.md exist in core and project into every harness dist via the packager
- [ ] Template with frontmatter, precedence header, and five sections is documented where pattern authors will find it
- [ ] org.md delegates architecture-patterns authority to the KB with the affirmed-memory-overrides exception semantics (ADR-002)
- [ ] The four wired agents carry the activation line; developer and architecture-reviewer are NOT wired (deferred to v2)
- [ ] New shape test passes and demonstrably fails on: missing frontmatter field, missing section, INDEX row without a file, file without an INDEX row, status mismatch, missing agent wiring line
- [ ] `bun scripts/package.ts` + `--check` green