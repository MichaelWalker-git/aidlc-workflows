---
repo_url: https://github.com/MichaelWalker-git/fax-ingestion
notable_paths:
  - backend-app/lib/backend-app-stack.ts
  - backend-app/lib/stages.ts
  - backend-app/stacks/resources/StepFunctionsStack.ts
  - backend-app/resources/lambda/stepFunction/02textExtract/
  - backend-app/shared/services/PromptGenerator.ts
  - backend-app/shared/helpers.ts
  - backend-app/sagemaker-provider.ts
  - client-app/src/api/api-config.ts
---

# Exemplar Profile: Fax Ingestion — HIPAA Fax Extraction Marketplace Product

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A HIPAA-conscious intelligent-document-processing product ingesting faxed
medical records for Home Health Agencies: extract structured
patient/referral fields with a vision LLM and let staff review results in a
web UI — packaged for resale via AWS Marketplace (marketplace deploy script,
tags, and context throughout say "product", not internal tool). Explicit
accuracy targets live in the prompt itself (">95% standard forms, >85%
handwritten"), which is why prompt changes needed measurable regression
checks.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A two-package monorepo: a CDK backend (nested-stack decomposition with an
explicit composition root) and a React 19/MUI review SPA on Amplify
Hosting. Pipeline: S3 upload → SQS throttle → Step Functions (Python/Docker
PDF-to-images → Node text-extract via SageMaker → file processing) →
output S3 + DynamoDB.

- **Self-hosted SageMaker (Qwen2.5-VL) over Bedrock**: PHI stays inside the
  customer's VPC on a customer-managed-KMS, VPC-isolated async endpoint; a
  vision model is required for fax images and handwriting; per-tenant
  Marketplace deployment favors an endpoint the template itself owns.
- **SQS as the throttling seam** between bursty fax batches and a fixed
  GPU-backed endpoint (Map-state page parallelism against reserved
  concurrency) — the queue absorbs bursts, the state machine gives per-page
  retry and observability.
- **Prompts are code with a typed field registry**: one source of truth
  (field name/format/tips per field) feeds prompt generation, schema
  validation, and gap-filling merge logic; Lambdas defensively re-parse LLM
  output.
- **Prompt engineering under test**: promptfoo configs A/B prompt strategies
  and temperature/top_p sweeps through a custom provider hitting the real
  deployed endpoint, with results committed.
- **Compliance as configuration**: cdk-nag framework selected by env var
  (HIPAA default; NIST/PCI/all), applied as Aspects at the Stage, with
  reasoned suppressions at every offending resource.

## Key Patterns

- Nested-stack-per-service decomposition with all wiring visible in one
  composition root; dependencies passed as typed props.
- Lambda infra/handler co-location (`index.ts` CDK factory + `handler.ts` +
  `helpers.ts`), numbered by pipeline order.
- Deterministic stage-prefixed naming with fail-fast on missing STAGE;
  `createDefaultLambdaRole` + policy-statement helper for consistent IAM.
- Runtime frontend config (`config.json` fetched at startup) so one SPA
  build serves every environment; Cognito bearer interceptor on a single
  axios instance.
- Async SageMaker inference with S3 result polling instead of long-lived
  synchronous calls.
- Anti-patterns flagged, not imitated: live dev endpoint/user-pool IDs
  committed in `amplify.yml`, a fully commented-out test suite, no CI on
  the infra package, and both aws-sdk v2 and v3 present.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the composition root, the prompt generator, and the
promptfoo provider are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.