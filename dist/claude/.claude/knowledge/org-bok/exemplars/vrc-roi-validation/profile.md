---
repo_url: https://github.com/MichaelWalker-git/vrc-roi-validation
notable_paths:
  - CLAUDE.md
  - lib/vrc-roi-validation-stack.ts
  - resources/worker/entrypoint.ts
  - resources/worker/documentProcessor.ts
  - shared/services/EcsQwen.ts
  - shared/helpers/construct.ts
  - test/infrastructure/alarms.test.ts
  - .github/workflows/cdk-deploy.yml
---

# Exemplar Profile: VRC ROI Validation — Multi-Patient Contamination QC Gate

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A satellite of the vrc-idp platform: automatically catch Release-of-
Information document bundles that contain a second patient's records before
they are released — a HIPAA-risk quality-control gate, not a full document
platform. Results post back as Pass/Fail into the existing VitalChart
workflow, with failed documents held for human review. Extracted into its own
repo so QC could scale, deploy, and fail independently of the main pipeline.
The accuracy posture tolerates false Fails (human review path) but not false
Passes.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A TypeScript CDK app — stage-per-environment, one main stack plus KMS/VPC
nested stacks — whose live runtime is a single long-running ECS Fargate
worker: S3 event → SQS → poll loop → unzip bundle → PDF-to-JPEG → per-page
patient extraction via the shared self-hosted Qwen vision endpoint → fuzzy
name/DOB matching → Pass/Fail to VitalChart → DynamoDB.

- **One ECS worker replaced an abandoned Step Functions + SageMaker +
  OpenSearch pipeline** (the legacy code remains in-tree, unwired, with
  CLAUDE.md mapping live vs dead code): multi-minute PDF+vision jobs exceeded
  Lambda's shape, one container is simpler to debug, and queue-depth
  autoscaling with scale-to-zero (dev/qa) plus Fargate Spot keeps cost down.
- **Self-hosted Qwen keeps PHI inside the VPC**; the endpoint is shared with
  vrc-idp by import, not duplicated.
- **Resilience seams are explicit**: graceful SIGTERM finishing the in-flight
  document, periodic SQS visibility extension, a callback-retry queue for
  failed VitalChart posts, retry-with-backoff and token budgeting in the
  model client.
- **Operational scar tissue is pinned as tests and alarms**: the "queued but
  zero tasks" alarm and the scale-in expression counting visible + in-flight
  messages encode fixed production regressions; infrastructure tests assert
  those load-bearing strings in the stack source.
- **GitOps deploy**: development/qa/production branches map to stages, tests
  gate deploys, OIDC role assumption, per-branch concurrency groups.

## Key Patterns

- Regression-pinning infrastructure tests: read the stack source and assert
  the exact expressions hard-won from incidents, each with a comment saying
  why.
- CLAUDE.md as a live/legacy code map: integration table with env vars, the
  naming gotcha, and "when in doubt, follow the import graph" — a model for
  AI-assisted maintenance of a repo carrying dead weight.
- Model client engineering: a self-hosted vision LLM treated as a fallible
  HTTP dependency — retryable status allowlist, exponential backoff, prompt
  sanitization, per-image token budgeting, truncation flag in the response.
- Two-tier deterministic naming: a `Labels` class for stack names and
  mandatory org tags plus `getCdkConstructId` for resources, failing fast on
  a missing STAGE.
- E2E as a deliberate separate tier against real AWS, excluded from CI, with
  a "real patient data — never commit" rule in its README.
- Config split cleanly: required env vars throw at synth/startup, tunables
  have defaults, secrets resolve at runtime behind a TTL cache.
- Business-outcome metrics (DocumentsPass/Fail/Error) derived from logs,
  alarms to SNS → Chatbot → Slack, dashboard in CDK — observability as code.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the worker entrypoint, the model client, and the
alarm tests are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.