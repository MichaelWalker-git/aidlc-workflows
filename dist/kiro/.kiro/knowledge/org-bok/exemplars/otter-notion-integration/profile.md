---
repo_url: https://github.com/MichaelWalker-git/otter-notion-integration
notable_paths:
  - cdk/lib/classifier-stack.ts
  - lambda/classifier/handler.ts
  - cdk/lib/api-nested-stack.ts
  - cdk/lib/resource-nested-stack.ts
  - cdk/lib/opensearch-index-handler.ts
  - lambda/api/project/create.ts
  - src/helpers/project.ts
  - README.md
---

# Exemplar Profile: Otter-Notion Integration — Transcript Routing Pipeline

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Automatically file Otter.ai meeting transcripts into the correct per-project
Notion page with no manual triage: Zapier delivers the transcript file to
S3, AI decides which project it belongs to, and the summary plus full
transcript land in the matching Notion page (default parent page as
fallback). The Cognito-guarded admin CRUD UI exists because projects (name,
description, Notion page URL) are the classification ground truth and must
be human-curated. Same author/domain as meeting-crm — the Notion-routing
sibling. Prototype maturity: no tests, no CI, single squashed commit.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An event-driven serverless CDK pipeline: S3 upload (via a dedicated Zapier
IAM user whose credentials are CDK outputs) → classifier Lambda → Titan
embeddings → OpenSearch kNN shortlist → Claude adjudication + summarization
→ Notion write. A root stack composes resource and API nested stacks
(DynamoDB projects table, VPC OpenSearch with kNN, Cognito, six
`NodejsFunction` routes).

- **Serverless + S3 drop-box won** because meeting volume is bursty and low,
  and Zapier can only do simple uploads — the bucket decouples the SaaS
  trigger from the heavier AI pipeline at near-zero idle cost.
- **Embeddings + LLM two-stage routing**: pure kNN is too fuzzy for a final
  decision and pure LLM over all projects doesn't cost-bound; kNN shortlists
  (top-K, trimmed `_source`, sliced descriptions), then a low-temperature
  strict-JSON classification prompt with a brace-slicing JSON fallback
  adjudicates.
- **OpenSearch index bootstrap as a CloudFormation custom resource**:
  idempotent exists-check, a ContentHash property forcing updates on schema
  change, a deliberate no-op on Delete to preserve data, and an explicit
  "create v2 + alias-swap, never mutate mappings" note.
- **Least-privilege third-party integration user**: the Zapier IAM user gets
  object-level S3 read/write split from bucket-level list, with credentials
  surfaced as outputs so the external SaaS is configured from deploy
  outputs — the README documents exactly this handshake.

## Key Patterns

- Dual-store write on project CRUD: DynamoDB as source of truth plus three
  embeddings (name/description/combined) indexed into OpenSearch in the same
  handler — a seam to note, not transactional.
- API-limit-aware Notion writer: batching under the 100-blocks-per-request
  limit, rich-text chunking, and an appended-vs-created result contract.
- `{prefix}-{envName}-` naming with a typed env union and env-conditional
  removal policies; `lambdaCommonProps` spread for uniform fleet config.
- Joi validation at the API boundary and a tiny generic typed response
  helper used by every handler.
- Anti-patterns flagged, not imitated: a live-looking Notion token literal
  in CDK source (rotate), hardcoded account/VPC IDs, `Cors.ALL_ORIGINS`, a
  duplicate unused table that will orphan on destroy, duplicated theme trees
  in the copied frontend scaffold, and no tests or CI.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the classifier handler, the custom-resource index
bootstrap, and the dual-write CRUD are the canonical implementations. If the
repo is unreachable, note "deep dive unavailable" and continue from this
profile.