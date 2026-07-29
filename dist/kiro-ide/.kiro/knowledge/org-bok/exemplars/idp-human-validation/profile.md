---
repo_url: https://github.com/MichaelWalker-git/idp-human-validation
notable_paths:
  - lib/DevStage.ts
  - stacks/nested/PdfProcessingFlow.ts
  - stacks/EcsQwenStack.ts
  - shared/cdk-helpers.ts
  - resources/lambda/handle-extracted-courses/
  - shared/services/repository/dynamo-db/Catalogs.ts
  - .github/workflows/pr-checks.yml
  - docs/EXPERIMENT_INDEX.md
---

# Exemplar Profile: IDP Human Validation — Course-Catalog Extraction Pipeline

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Extract structured course data (code, title, credits, description) from
hundreds of differently-formatted university course-catalog PDFs at high
recall (94.8%+ tracked, 0.06% hallucination rate), with human reviewers
validating and correcting results before downstream use — the domain appears
to be credit-transfer/articulation, which makes the output trust-sensitive
and drove the human-validation layer and LLM-judge gate. Accuracy outranked
cost, but cost was tracked honestly (a $1,600 fine-tuning failure has its own
autopsy).

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single CDK app with ~14 stacks composed in one stage-parameterized Stage:
KMS/S3/VPC/DynamoDB foundations, a GPU LLM-serving stack (Qwen on ECS/EC2
with vLLM), three Step Functions state machines (the 2,000-line PDF
processing flow is the heart: split → OCR → extraction → enrichment → judge →
consistency validation → save/review), an SQS-throttled S3 ingestion stack,
and a Cognito/API Gateway/CloudFront reviewer + client portal. A
semi-detached ML lab (training scripts, seven Docker image variants, eval
harnesses, experiment ledger) shares the repo.

- **Serverless Step Functions fan-out won because catalog uploads are bursty
  and page-parallel** — no idle cost, with the one always-on-ish component
  (GPU inference) given scale-to-zero autoscaling on KV-cache metrics and
  baked-weights ECR images to kill cold starts.
- **Self-hosted Qwen with Bedrock Claude at the edges**: Qwen on ECS/vLLM for
  volume extraction, Claude only for enrichment and judging.
- **Every model decision is a config switch, not a rewrite**: endpoint URL,
  LLM backend, extraction mode, and even prompts (deployed to an S3 prompt
  bucket) are runtime-configurable — which is exactly what let evaluation
  outcomes flip production ("switch to text mode: instant, no code change").
- **The fine-tuning program was exploratory and honestly reversed**: months
  of SFT/DPO/GRPO ended with the finding that an unfine-tuned text model plus
  OCR beats the fine-tuned vision model; the experiment ledger records each
  method, cost, and result, including ground-truth-quality skepticism
  (precision "misses" were gaps in the ground truth).

## Key Patterns

- Lambda-as-module convention: each Lambda folder pairs its CDK factory
  (`index.ts`) with its runtime `handler.ts`, wired into flow constructs by
  import; shared defaults centralize runtime/memory/timeout/log retention.
- Deterministic naming helper: one function generates stage-scoped resource
  names and the cross-stack import keys, failing fast when `STAGE` is
  missing — convention-driven rather than string-scattered.
- Repository layer over single-table DynamoDB: generic typed doc-client
  helpers, then per-entity modules owning PK/SK builders and update
  expressions; Lambdas never touch the SDK directly.
- `cdk diff` posted as an auto-updated PR comment — cheap, high-signal infra
  review discipline.
- Evaluation-first ML culture: promptfoo configs with custom providers for
  the team's own endpoints, holdout-set scripts, and an experiment index with
  per-experiment cost/result/eval-data links.
- Handover-grade narrative docs: named handover documents, cross-repo
  learnings write-ups, and committed flow diagrams with rendered images.
- GPU-cost engineering: baked-weights images, scale-to-zero, vLLM metrics
  sidecar to CloudWatch, explicit burn-rate tracking in docs.
- Vendored private construct dependency: a sibling repo's IDP building blocks
  shipped as a jsii tarball under `vendor/` — reuse without a registry.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the stage composer, the PDF processing flow, and the GPU
serving stack are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.