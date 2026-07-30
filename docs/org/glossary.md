# Org Customization Glossary

Terms used across the org-customization effort (Org BoK, patterns KB,
distill pipeline) in this fork. Framework-level terms (Bolt, gate, space,
scope) are defined in upstream docs; this glossary covers what the org
added on top.

- **Org BoK** — the org's Body of Knowledge under
  `core/knowledge/org-bok/`: distilled exemplar profiles, guides
  (code-style, ui-design-language, architecture-principles), and the
  patterns KB. Org-owned; upstream never touches it.
- **Exemplar** — a real org repository distilled into a profile
  (`org-bok/exemplars/<repo>/profile.md`) by the `/aidlc-distill` flow.
  Exemplars are evidence: pattern files cite them as proof-from-production.
- **Pattern (file)** — one opinionated page under `org-bok/patterns/<class>/`
  recording an org architecture decision: When to use / Our approach /
  Exemplars / Gotchas / References. The org-wide authority for that
  decision (ADR-002); carries `status`/`reviewed`/`owner` frontmatter
  (ADR-003).
- **Pattern classification** — the Architect's taxonomy shaping the
  `patterns/` subdirectories: multi-tenancy, data-layer, serverless-compute,
  idp, genai, full-stack, eventing, iac, observability.
- **INDEX.md (patterns index)** — the retrieval layer: one line per pattern
  (trigger keywords → path → status). Wired agents read it at every
  activation and open only matching pattern files (ADR-004). No search
  agent exists.
- **Blessed** — pattern status meaning "Architect-approved org default;
  binding on agents absent a documented space exception". `draft` =
  advisory, pending review/audit; `deprecated` = superseded, pointer to
  successor.
- **Documented exception** — an affirmed team.md/project.md rule that
  overrides a blessed pattern for that space, naming the pattern and the
  reason (ADR-002).
- **Scar** — a recorded failure from org history ("we tried X on Y, it
  broke at scale") captured in a pattern's Gotchas section; one of the four
  content sources that make a file admissible.
- **Topic admission rule** — a pattern file exists only if it carries at
  least one org-specific statement (decision, default, exemplar, or scar);
  pure-textbook AWS content stays a reference link (ADR-005).
- **Distill (allowlist / batch)** — the existing `/aidlc-distill` +
  `aidlc-distill-batch` machinery that turns allowlisted org repos into
  exemplar profiles; step zero for any pattern lacking its exemplars.
- **Shape suite / shape test** — the `t*`-numbered unit test pinning
  pattern-file frontmatter, required sections, and bidirectional
  INDEX↔file consistency (ADR-004).
- **Freshness cadence** — quarterly re-verification of each pattern against
  its exemplar repos, owned by the AIDLC customizer; recorded in the
  `reviewed:` frontmatter date (ADR-003).