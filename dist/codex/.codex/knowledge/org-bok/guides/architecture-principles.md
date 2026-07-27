# Org Guide: Architecture Principles

This is a cross-cutting Org BoK guide — organization-wide architecture
defaults distilled across reference projects, not tied to any single
exemplar. It loads as standing Tier-1 knowledge for the architect agent on
every project, whether or not the precedent-research stage ran. Sections
marked *Fill in* are placeholders a solution architect completes when
adopting the framework; the structure and the shipped defaults are real.
`/aidlc-distill` proposes additions when it spots org-wide conventions; a
solution architect curates and commits them.

## How to Use This Guide

- Treat every statement here as the organization's default position, not a
  hard rule. Defaults are overridden by affirmed memory rules (`org.md`,
  `team.md`, `project.md`) and, on brownfield work, by locally discovered
  affirmed practices.
- When a reference brief is present, its exemplar-specific patterns are more
  specific than this guide — apply them first, and use this guide for
  everything the brief does not cover.
- When you deviate from a default, record the deviation and its rationale in
  the stage's decision artifact (ADR or equivalent) — silent deviation is the
  failure mode this guide exists to prevent.

## Precedence

Stated verbatim: on greenfield work, BoK guidance is the default; on
brownfield work, locally discovered and affirmed practices win — consistency
with the codebase you are in beats org ideals.

## Principles

The organization's standing architecture defaults. Each principle carries its
rationale so an agent can judge when a project genuinely falls outside it.

1. **Start with the simplest topology that has an ownership boundary to
   justify it.** A modular monolith owned by one team beats microservices
   owned by nobody. Split services only along real team-ownership seams.
2. **Boundaries first, internals second.** Component boundaries and the
   contracts between them are the architecture; internal structure is
   refactorable detail.
3. **Version-controlled contracts at every seam.** Provisioning, APIs, and
   schemas are expressed as reviewed, versioned artifacts (IaC modules,
   OpenAPI specs, migration files) — never as ad-hoc console or API calls.
4. **Design for auditability.** Every state-changing action should leave a
   reviewable trail (pull request, audit event, migration history). If an
   action cannot be audited, redesign the seam so it can.
5. *Fill in: additional org principles, one numbered entry each — statement
   in bold, then the rationale and the boundary where it stops applying.*

## Technology Defaults

The org's default picks for common capability decisions. *Fill in each row —
the shipped rows are format examples a solution architect replaces.*

| Capability | Default | Use something else when… |
|------------|---------|--------------------------|
| *Fill in: e.g. service runtime* | *e.g. Node.js + TypeScript* | *e.g. compute-bound workloads with a profiling case* |
| *Fill in: e.g. infrastructure* | *e.g. Terraform modules from the platform catalog* | *e.g. the capability has no catalog module yet* |
| *Fill in: e.g. persistence* | *e.g. PostgreSQL* | *e.g. access pattern is genuinely key-value at scale* |

## Deviation Process

*Fill in: where architecture deviations are recorded and who affirms them —
e.g. "an ADR in the project record, affirmed by the platform architecture
guild." Until filled in, the default is: record the deviation as an ADR in
the stage's decision artifact and surface it at the next human checkpoint.*
