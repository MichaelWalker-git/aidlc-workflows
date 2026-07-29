---
repo_url: https://github.com/MichaelWalker-git/main_records
notable_paths:
  - packages/backend/src/repositories/BaseRepository.ts
  - packages/backend/src/server.ts
  - packages/backend/src/services/BedrockClient.ts
  - packages/infrastructure/bin/app.ts
  - packages/e2e/fixtures/auth.ts
  - .interface-design/system.md
  - packages/backend/src/__tests__/records.test.ts
  - aidlc-docs/requirements-coverage.md
---

# Exemplar Profile: Maine Records — State Archives RMS RFP Demo

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A working demo build to win a state RFP (Maine State Archives records
management, RFP# 202603058): the deliverable is a live, presentable proof of
capability plus the proposal, not a production system. The RFP scores on
AI-assisted classification/OCR/search, RBAC + MFA, audit, retention/
disposition workflows, and physical+digital record unification — so the real
Bedrock AI features got full builds while enterprise plumbing (SAML, SIEM,
CloudFront/WAF, monitoring) was stubbed as documented, re-enable-able seams.
Budget was a first-class constraint (~$178/month target). Presentation was
part of the engineering scope: presenter scripts, demo-warmup, seeded
personas.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An npm-workspaces TypeScript monorepo (shared types, Express backend, React
SPA, CDK infrastructure, six Lambda packages, Playwright e2e) running as ALB
→ ECS Fargate over Aurora Serverless v2 PostgreSQL behind RDS Proxy.

- **Postgres-for-everything won on cost**: pgvector (HNSW) instead of
  OpenSearch, tsvector + pg_trgm instead of managed search, Claude Vision
  instead of Textract, Recharts instead of QuickSight — every omission is
  written down with its replacement named and the omitted CDK stacks kept in
  source as an upgrade path.
- **Bedrock is invoked via raw HTTPS with a bearer key, never SDK/IAM**, and
  every AI Lambda fails fast if the key is missing — "never silently bill
  the host AWS account for inference." The rule is stated in CLAUDE.md and
  mirrors the org's other production pipelines.
- **Async AI pipeline via SQS Lambdas**: upload → presigned S3 → OCR (Claude
  Vision `tool_use`) → classification (Claude Sonnet `tool_use`) → Titan
  embeddings → pgvector.
- **The record lifecycle is an exported state-machine constant**
  (`VALID_TRANSITIONS`, annotated with its RFP requirement ID) — testable
  and referenced from e2e; a 3-approver disposition workflow and legal-hold
  destruction blocks encode the archives domain.
- **Clean 3-layer Express app**: routes → constructor-injected services →
  a generic `BaseRepository<T>` over Knex; auth, authorization, audit,
  validation, and error handling are middleware.

## Key Patterns

- Documented cost-driven degradation: each "we don't deploy X" names its
  production replacement, in CLAUDE.md and narrated stack comments, with the
  estimated monthly cost pinned.
- Mock-at-the-seam testing: Jest + supertest suites mock exactly the
  external seams (Bedrock client, S3/SQS SDKs, a chainable Knex mock) and
  exercise real routers and middleware.
- `data-testid` as the stable UI contract (338 occurrences); Playwright
  selects exclusively by testid, with typed role-scoped fixtures around four
  demo personas.
- Requirements traceability: a coverage matrix maps every RFP requirement ID
  to Met/Partial/Roadmap and its demo moment; RFP IDs appear as code
  comments.
- A committed `.interface-design/system.md`: audience, personality
  ("institutional, authoritative, calm"), borders-only depth, token tables
  drawn from Maine's state identity — encoded 1:1 in the Tailwind config.
- cdk-nag AwsSolutionsChecks app-wide, stage-prefixed stack names, typed
  cross-stack props.
- Anti-patterns flagged, not imitated: a live-looking Bedrock key and demo
  passwords committed in docs, hard-coded account IDs, no CI workflows, and
  a lint script with no ESLint config. (Rotate any committed credentials.)

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the base repository, the Bedrock client, and the
stack composition are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.