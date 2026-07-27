# Org Guide: Code Style

This is a cross-cutting Org BoK guide — organization-wide code style and
engineering-practice defaults distilled across reference projects, not tied
to any single exemplar. It loads as standing Tier-1 knowledge for the
developer and quality agents on every project, whether or not the
precedent-research stage ran. Sections marked *Fill in* are placeholders a
solution architect completes when adopting the framework; the structure and
the shipped defaults are real. `/aidlc-distill` proposes additions when it
spots org-wide conventions; a solution architect curates and commits them.

## How to Use This Guide

- Treat every statement here as the organization's default position. Defaults
  are overridden by affirmed memory rules (the `## Code Style` section of
  `org.md`/`team.md`/`project.md` always wins) and, on brownfield work, by
  locally discovered affirmed practices.
- When a reference brief is present, its patterns-to-follow are more specific
  than this guide — apply them first, and use this guide for everything the
  brief does not cover.
- For the quality agent: these defaults are review criteria — flag deviations
  in generated code, but flag them as style findings, never as functional
  defects.

## Precedence

Stated verbatim: on greenfield work, BoK guidance is the default; on
brownfield work, locally discovered and affirmed practices win — consistency
with the codebase you are in beats org ideals.

## Naming & Structure

Org-wide defaults for how code is named and laid out.

- Names state intent at the call site: functions are verb-first, booleans
  read as predicates (`isReady`, `hasProfile`), and abbreviations are
  avoided unless they are domain vocabulary.
- One concept per file; the file name matches the exported concept.
- *Fill in: org-specific layout conventions — e.g. package/module topology,
  test-file placement, barrel-file policy.*

## Formatting & Linting

- Formatting is a tool's job, never a review comment: every repo carries a
  committed formatter and linter config, and CI enforces both.
- *Fill in: the org's canonical formatter/linter configs and where to copy
  them from — e.g. a shared config package, or a reference repo's config
  named in an exemplar profile's deep-dive pointers.*

## Errors & Logging

- Validate inputs at the boundary and fail fast with meaningful errors;
  never swallow exceptions silently.
- *Fill in: org error-handling and logging conventions — e.g. structured
  logging shape, error-type taxonomy, retry/backoff defaults.*

## Testing Practices

- Every behavior change ships with a test that fails without it; every fixed
  defect gets a regression test first.
- Tests are independent — no execution-order or shared-state coupling.
- *Fill in: org testing conventions — e.g. test naming, fixture policy,
  coverage stance beyond the memory layer's `## Testing Posture`.*

## Review Checklist

What the quality agent checks generated code against, beyond functional
correctness. *Fill in: the org's review checklist — the shipped entries are
format examples a solution architect extends.*

- [ ] Names read as intent at the call site
- [ ] No formatting or lint deviations from the committed configs
- [ ] Errors carry enough context to debug without a reproduction
