# ADR-005: Content pipeline (distill → code-read → draft → Architect review) and release ceremony

- **Status:** accepted
- **Date:** 2026-07-30
- **Deciders:** p.lysanets (grilling session); Architect input from planning conversation

## Context

A pattern file's value is org opinion (blessed decisions, defaults, scars,
exemplars), not textbook AWS facts the model already knows. That opinion has
four sources: exemplar profiles + repo code, the Architect/team, model
knowledge + AWS docs (references only), and operational history (Sentry
config, Ivan's root-cause bot).

Tennis Systems, Paradise Law, Punch and Chance, and Service Delivery
Platform are not among the 45 distilled exemplars. All are accessible and
can join the curated distill allowlist now.

## Decision

1. **Per-pattern pipeline:** distill exemplar repo if missing (via the
   existing `/aidlc-distill` / batch skill) → agent code-read of the
   specific mechanism (JWT claims path, pool config, replica routing) →
   draft the pattern file → Architect reviews the draft (blessed-vs-legacy
   call, scars) → merge; approval flips `draft`→`blessed` (ADR-003).
   Draft-first inverts the interview cost: the Architect reviews a concrete
   page instead of authoring from scratch.
2. **Step zero for v1:** add Tennis Systems, Paradise Law, Punch and
   Chance, and Service Delivery Platform to the distill allowlist and run
   the batch distill over them.
3. **v1 content:** `multi-tenancy/jwt-tenant-isolation.md` (ships as
   `draft` pending the Architect's SDP audit),
   `data-layer/connection-pooling.md`, `data-layer/read-replicas.md`,
   `observability/sentry.md` (sources: Sentry org config + Ivan's bot +
   Architect's incident stories).
4. **Topic admission rule:** a new pattern file is added only when it
   carries at least one org-specific statement (decision, default,
   exemplar, or scar). Pure-textbook topics are links inside existing
   files, not files. Backlog (serverless-compute, idp, genai, full-stack,
   eventing, iac) admitted incrementally under this rule; the AWS
   exam-Q&A idea stays out unless pattern files prove to need few-shot
   scenarios.
5. **Release: full ceremony.** The KB lands as a user-visible release per
   repo policy — `core/tools/aidlc-version.ts` bump, `CHANGELOG.md` entry,
   README badge, `bun scripts/package.ts` + `--check` green, t68 green.

## Consequences

- The only human bottleneck is Architect review, deliberately the smallest
  step.
- The multi-tenancy pattern is not blocked on the SDP audit; the audit
  outcome later either blesses the file or amends it.
- The admission rule keeps the KB thin-and-opinionated; maintenance load
  grows with org decisions, not with AWS's surface area.

## Rejected alternatives

- **Author patterns from model knowledge alone** — reproduces what agents
  already know; misses the JWT/roles/pooling specifics the Architect
  explicitly asked to extract from real code.
- **Interview-first authoring** — asking the Architect to write or dictate
  patterns from scratch stalls; review-a-draft is the viable unit of their
  time.
- **Commit without version bump** — the KB changes dist-visible files;
  skipping ceremony fights t68 and hides the feature from org installs.