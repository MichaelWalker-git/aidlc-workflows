---
repo_url: https://github.com/MichaelWalker-git/deepseek_ocr
notable_paths:
  - .projenrc.ts
  - src/lib/stages.ts
  - src/constructs/deepseek-ocr-ecs.ts
  - src/shared/cdk-helpers.ts
  - src/stacks/api-gateway.stack.ts
  - src/resources/lambda/processing/helpers.ts
  - docker/Dockerfile
  - docker/start_server.py
---

# Exemplar Profile: DeepSeek OCR — Self-Hosted GPU OCR API

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Stand up a self-hosted DeepSeek-OCR document-processing API on AWS — GPU
inference behind a metered public API — as a cheaper, no-cold-start
alternative to SageMaker/Bedrock OCR (the README claims ~60% cost reduction
vs pure SageMaker). Likely the precursor/sibling proof-of-concept for
idp-module's self-hosted DeepSeek-OCR GPU backend (same container contract
and infra shape). The A2I human-review "100% accuracy" loop described in the
README is design intent, not shipped code — the honest scope is a GPU OCR
API plus S3-triggered Lambda ingestion.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A two-plane repo: a projen-managed TypeScript CDK app (Stage → Stacks →
Construct layering, cdk-nag Aspects at app level) and a Python vLLM/FastAPI
GPU container, joined by an ALB DNS name and a small typed HTTP contract.

- **ECS-on-EC2 g4dn keeps the model resident** (baked into a ~15GB Docker
  image) — predictable latency,
  no serverless GPU cold starts — with a host-volume model cache surviving
  task restarts, a 300s health-check grace for model load, placement
  constraints, and optional mixed on-demand/spot with a guaranteed
  on-demand base.
- **Overlay-fork Dockerfile de-risks the serving layer**: pin the upstream
  vLLM base image, clone upstream DeepSeek-OCR at build time, and COPY only
  the changed `custom_*.py` files over the originals — the diff against
  upstream is exactly the overlay set, never a vendored fork.
- **API Gateway fronts the ALB as HTTP_PROXY** adding API keys, usage plans,
  throttling, and request validation without touching the inference
  container; one Lambda-backed route bridges S3 objects to the OCR API.
- **Two deployment paths for the container**: CDK image assets for full
  deploys, plus an out-of-band CodeBuild script for image-only updates that
  avoids a CDK deploy.
- **Typed cross-language contract**: the Lambda's TypeScript response
  interfaces explicitly mirror the Python server's Pydantic models.

## Key Patterns

- Stage as composition root: only the Stage knows stack wiring order and
  cross-stack handoffs via typed constructor props.
- Deterministic `{stage}-{app}-{resource}` naming via a shared helper with
  fail-fast STAGE validation.
- Projen self-mutation CI (drift diff → patch artifact → auto-commit) plus
  Mergify merge queue and nightly dependency upgrades.
- Error-class taxonomy + central handler mapping domain errors to API
  Gateway responses; typed S3 service wrapper with an error-type union.
- GPU-workload ECS specifics done right: GPU-optimized AMI, memory/CPU
  reservations leaving OS headroom, capacity-provider ASG.
- Anti-patterns flagged, not imitated: README describing unbuilt subsystems
  (A2I, Step Functions, DynamoDB), a dead snapshot test importing a
  nonexistent stack, mixed aws-sdk v2/v3, and a hardcoded account/profile in
  the ops script.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the GPU ECS construct, the Dockerfile overlay, and
the FastAPI server are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.