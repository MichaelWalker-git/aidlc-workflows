---
repo_url: https://github.com/MichaelWalker-git/ai-document-processor-cdk
notable_paths:
  - src/lib/stages.ts
  - src/lib/backend-app-stack.ts
  - src/shared/labels.ts
  - src/shared/cdk-helpers.ts
  - src/stacks/resources/StepFunctionsStack.ts
  - src/resources/lambda/files/getFile/
  - src/shared/services/models/qwenVision.ts
  - .projenrc.ts
---

# Exemplar Profile: AI Document Processor CDK — Resellable IDP Construct Library

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An AI document-processing platform for medical records / release-of-
information requests, packaged as a resellable product rather than a one-off
deployment: a jsii CDK construct library published to npm so the whole
platform ships "in a few lines of CDK" into multiple customer accounts,
including an AWS Marketplace edition with cross-account usage metering.
HIPAA compliance was a hard requirement, and data residency/model control
mattered — the pipeline targets a self-hosted Qwen2.5-VL vision model on
SageMaker rather than a managed LLM API. Speed-to-market visibly beat
engineering rigor: the test suite was never written.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-managed jsii construct library plus a standalone React/MUI client
app: a `ProdStage` front door composing KMS → S3 → backend → frontend stacks,
with nested stacks per AWS service concern inside the backend and
CloudFormation-export wiring between top-level stacks.

- **Compliance as configuration**: cdk-nag runs always-on with the framework
  pack (HIPAA/NIST/PCI) selected by a single prop defaulting to HIPAA,
  applied as Aspects, surfaced as a stage tag, with suppressions localized
  per stack.
- **Async, bursty document volume drove the queue-and-state-machine shape**:
  SQS, throttled S3 notifications, Step Functions with async SageMaker
  inference — the processing pipeline is not a synchronous API. (A separate
  API Gateway + Cognito surface serves the client app's CRUD and auth.)
- **Self-hosted Qwen on SageMaker over Bedrock** for PHI control and
  region flexibility; `qwenVision.ts` is the only module that knows the
  endpoint's wire format (payload shaping, defaults, a fail-fast token
  ceiling, sync + async invocation).
- **`Labels` naming/tagging class** is the single source of resource names,
  cross-stack export keys, and cost-allocation tags.
- **Prompt regression testing with promptfoo** against the live endpoint,
  with prompt variants and model-config variants as separate configs.

## Key Patterns

- Stage → Stack → NestedStack layering with one nested stack per service
  concern and explicit dependency ordering; consumers use the opinionated
  stage or compose stacks individually.
- Lambda `index.ts` (construct factory) + `handler.ts` (runtime) co-location
  under domain folders; numbered pipeline prefixes make Step Functions order
  legible in the file tree.
- Thin generic AWS SDK wrappers plus a `ClientError`/`errorHandler` pair so
  every handler returns consistent responses.
- Projen as the governance layer: build/release/lint/packaging declared once
  in `.projenrc.ts`, CI self-mutation pushing regenerated files back onto
  PRs.
- MUI theme-token structure (palette/typography/shadows/overrides) with a
  feature-first client layout.
- Anti-patterns flagged, not imitated: effectively zero tests in a published
  library, a stray root index exporting a nonexistent module, and a client
  PDF committed as a test asset.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the stage front door, the labels class, and the Qwen
adapter are the canonical implementations. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.