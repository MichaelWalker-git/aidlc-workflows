---
repo_url: https://github.com/MichaelWalker-git/blueprint-checker
notable_paths:
  - .projenrc.ts
  - src/stacks/DevStage.ts
  - src/stacks/ProcessingStack.ts
  - src/resources/lambda/ada-analysis/handler.ts
  - src/shared/prompts/base-prompt.ts
  - frontend/.interface-design/system.md
  - test/integration/pipeline.test.ts
  - docs/severity-methodology.md
---

# Exemplar Profile: Blueprint Checker — ADA Compliance Review Product

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A venture-style product bet rather than a client-services build: automated
ADA compliance checking of architectural blueprints, where Claude vision does
the first pass and licensed human reviewers (Tier 1/Tier 2) provide the
defensible sign-off — the multi-tier review workflow is the core product
mechanic, not an add-on. The repo carries its own competitive analysis,
pricing strategy ($1/sheet baseline), and money-back-guarantee doc;
engineering decisions map 1:1 to identified competitive gaps. Buyer persona:
plan reviewers and CASp consultants.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-managed AWS CDK TypeScript app: ten stacks composed in one
stage-parameterized Stage (auth, VPC, Aurora + RDS Proxy, storage, DynamoDB,
processing, WebSocket, API, frontend, monitoring), a React/Vite/Tailwind SPA,
and a processing pipeline of presigned-URL upload → SQS with DLQ → Step
Functions (PDF analysis → text extraction → scale check → Docker-Lambda image
conversion → Claude ADA analysis).

- **Serverless because pre-revenue idle cost had to stay near zero** —
  pay-per-request compute and storage, with the dominant cost deliberately
  shifted to per-analysis Bedrock usage. (The mid-project Aurora + RDS Proxy
  addition is the one always-on exception — accepted when the domain outgrew
  single-table DynamoDB.)
- **Aurora/Drizzle was added mid-project when the domain outgrew single-table
  DynamoDB** (orgs, projects, submittals, RFIs, change orders, and bids are
  relational); the DynamoDB stack is retained for migration continuity —
  newer handlers use Drizzle.
- **Bedrock via Bearer API key (Secrets Manager, cached) rather than IAM
  SigV4** — chosen for the simplicity/portability of the Anthropic-style
  calling convention.
- **Data-driven LLM prompts**: compliance standards live as JSON config and a
  prompt builder assembles the system prompt — a new compliance domain (fire
  egress shipped alongside ADA) is new config, not new prompt code.
- **AI output classification is auditable, not vibes**: severity
  (CRITICAL/MAJOR/MINOR) is a published formula with worked examples in a
  committed methodology doc.
- **The design language is a trust play for the buyer**: tokens named after
  the physical plan-review table — "Blueprint Navy", "Warm Paper", ink-weight
  text hierarchy, "Stamp" verdict colors — with signature rules (borders-only
  depth, tabular-nums on data, mono for standard refs).

## Key Patterns

- Projen with a CI drift guard: hand-edit only `.projenrc.ts`; the build
  workflow diffs regenerated files and fails on mutation.
- Stage-parameterized single Stage class with `isProd` switches for
  retention, PITR, and versioning — environment parity by construction.
- Typed cross-stack props with documented cycle-breaking: every non-obvious
  dependency ordering has an inline comment naming the cycle it avoids;
  late-bound wiring via post-construction configure calls.
- Atomic claim pattern: reviewer claims use DynamoDB conditional writes with
  a 15-minute timeout to prevent double-booking.
- Pipeline contract test: an integration test explicitly verifies the data
  contracts between Step Functions stages.
- Feature flags as per-stage typed config: defaults plus per-stage overrides
  — dev gets everything, prod is conservative.
- Deploy workflow injects infra outputs into the frontend build
  (`cdk-outputs.json` → `VITE_*` vars), with differentiated S3 cache-control
  (immutable hashed assets vs no-cache HTML) and CloudFront invalidation.
- Committed design system (`frontend/.interface-design/system.md`) with named
  tokens, signature rules, and copy-paste default snippets.
- CLAUDE.md as a real onboarding doc: build commands, data model, and named
  code patterns, written for an AI pair but equally useful to humans.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the ada-analysis Lambda, the prompt builder, and the design
system file are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.