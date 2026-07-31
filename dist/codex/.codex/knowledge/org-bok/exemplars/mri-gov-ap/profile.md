---
repo_url: https://github.com/MichaelWalker-git/mri-gov-ap
notable_paths:
  - infra/lib/constructs/lambda-factory.ts
  - infra/bin/app.ts
  - packages/llm-http-client/src/index.ts
  - packages/erp-batch/src/columns.ts
  - services/approval/src/routing/engine.ts
  - web/src/theme.ts
  - .github/workflows/deploy-dev.yml
  - COST.md
---

# Exemplar Profile: MRI Gov AP — Municipal AP Approval Pipeline

## Ask / Context

MRI/MTS, an outsourced finance department serving ~10 New Hampshire
municipalities, asked for an AI-assisted accounts-payable pipeline: cut manual
invoice keying and scale toward ~10,000 invoices/month without linear headcount
growth. Phase 1 was an MVP piloted on Danville, NH (+1 town). The client cared
most about "never a wrong payment" — 100% GL-code validation was the only
committed SLA — and required deployment into their own AWS account. Approvers
are non-technical municipal staff.

## Architecture & Why

A TypeScript pnpm monorepo — pure Lambda service packages, an AWS CDK app that
owns every resource, and a React SPA — around a document pipeline: S3-triggered
ingestion → Claude-vision extraction → deterministic totals reconciliation →
confidence gate → config-driven approval routing → just-in-time ERP write-back.

- **The legacy ERP, not the AI, was the load-bearing constraint.** Live
  integration with the client's Clarion/Postgres ERP was rejected outright, so
  the architecture treats the ERP as a file-exchange boundary: nightly
  reference-data push into a per-tenant Aurora mirror, pipe-delimited batch
  files out over SFTP. The system never reads the client's live database.
- **Serverless won on cost** — bursty pilot volume needed ≈$0 idle spend
  (`COST.md` documents the posture with named guardrails), and the vendor
  reused its existing serverless + Bedrock patterns (auto_rfp) for speed.
- **Fail-closed everywhere, because government money.** The confidence gate
  routes uncertainty to human review; validation outages hold invoices rather
  than approve them; the audit log is append-only; routing-rule versions are
  stamped at submission so config changes cannot alter in-flight approvals.
- **No-login single-use mobile approval links** (email → tap approve/reject)
  were driven by the non-technical approver base, and drove the token table,
  SES, and public-route design.
- **Config-driven routing engine** (pure function, no AWS, no I/O) exists
  because the approval threshold matrix was an unresolved external dependency
  — the architecture was shaped to absorb late-arriving client decisions
  (column contract, matrix, SFTP details) without redesign.

## Key Patterns

- Infra/services seam: handler packages carry zero `aws-cdk-lib` dependency;
  the CDK app owns all resources and points `NodejsFunction`s at service
  entrypoints by path. Handlers stay unit-testable without provisioning mocks.
- `LambdaFactory` construct: shared IAM roles keyed by narrow permission
  profiles, explicit `LogGroup`s, standardized esbuild/ESM bundling, late-bound
  cdk-nag suppressions — with the tradeoffs documented in the code.
- Contract-as-file: one column-contract module drives the ERP batch builder,
  serializer, and parser, guarded by property-based round-trip tests — when the
  client's real spec landed, one file changed.
- LLM access is a sealed chokepoint: one wrapper package is the only path to
  Claude (dual bearer/IAM auth, model tiering, env-var overrides); no service
  imports the provider SDK.
- cdk-nag on every synth; a finding without a co-located reasoned suppression
  fails the build.
- Decision commentary in code: dated, named decisions with the why, so the repo
  explains its own architecture.
- Design tokens as a tiny TS module with a named aesthetic ("municipal
  records": ink-on-paper neutrals, one deep-teal accent, monospace for money,
  IDs, and GL codes) — calm, dense, trustworthy; built for data validation,
  not decoration.
- Multi-tenant by convention at every layer: a `TENANTS` registry in
  shared-types plus a secret-name helper carry the tenant→physical mapping;
  onboarding a town is one CDK entry plus a runbook. (Corrected 2026-07-31 by
  the multi-tenancy patterns code-read: the `@mri/tenant-context` package that
  claims to be the single source of truth is a stub nothing imports — services
  hand-build the prefixes it defines.)

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the `LambdaFactory` construct, the sealed LLM client, and the
column-contract module are the canonical implementations to imitate. If the
repo is unreachable, note "deep dive unavailable" and continue from this
profile.