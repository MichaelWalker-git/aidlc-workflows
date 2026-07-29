---
repo_url: https://github.com/MichaelWalker-git/vrc-idp
notable_paths:
  - backend-app/bin/backend-app.ts
  - backend-app/lib/stages.ts
  - backend-app/shared/labels.ts
  - backend-app/shared/services/models/modelRouter.ts
  - backend-app/stacks/gpu/GpuRushStack.ts
  - .github/workflows/cdk-deploy.yml
  - backend-app/promptfoo-tests/configs/regression-suite.yaml
  - docs/adr/0001-fast-track-rush-lane-dedicated-gpu.md
---

# Exemplar Profile: VRC IDP — Healthcare Document Extraction Platform

## Ask / Context

The client asked for automated extraction of structured data (patient,
facility, requester, release type, billing amounts) from faxed/scanned medical
authorization PDFs, validated against their existing VitalChart RDS system —
replacing manual data entry in a Release-of-Information (ROI) workflow.
Extraction accuracy was the contract currency: the engagement was measured on
accuracy percentages, regressions were client-visible incidents, and QA
accuracy gates guard production promotion. HIPAA-adjacent — the pipeline
handles PHI. A second client app (VitalScan) later reused the same backend
platform, and the platform was being packaged toward AWS Marketplace.

## Architecture & Why

A TypeScript monorepo with three deployables — a CDK backend (Lambda + ECS
Fargate workers + a GPU model fleet), a React 19 + MUI admin/review client, and
a second slimmer VitalScan client — around a pipeline: S3 input → SQS → ECS
worker (PDF-to-images → OCR → document processor) → self-hosted vision model →
Aurora PostgreSQL + output S3.

- **Self-hosted vLLM/Qwen on GPU ECS won over managed AI services** for PHI
  control (data never leaves the VPC), per-document cost at volume, and
  fine-tuning ability (LoRA adapters, training stacks). SageMaker was tried
  and abandoned.
- **Stage-first CDK**: one Stage class per environment (dev/qa/demo/prod)
  composing ~20 small single-purpose stacks; a `Labels` value object owns all
  resource naming and tagging, so multi-environment parity is structural, not
  copy-paste. cdk-nag AwsSolutions + HIPAASecurityChecks run as Aspects.
- **The rush lane was a mid-engagement cost-vs-latency negotiation**: the
  client needed urgent documents to jump the batch queue; scaling the whole
  fleet was rejected at ~+$40k/month, so a physically isolated cheap dedicated
  lane (own bucket/queue/worker/GPU) was built instead — recorded as ADR-0001
  with the cost rationale.
- **Two-speed deployment seam**: infrastructure changes go through a
  `cdk diff`-gated workflow; application code has a fast lane rebuilding only
  the worker image and Lambda bundles, with production gated by a QA accuracy
  check replaying real production documents.
- **The demo stage and strict promotion order (development → qa → production,
  CI-enforced)** reflect client-facing demos and formal QA sign-off before
  production pushes.

## Key Patterns

- LLM regression testing as first-class CI: promptfoo suites encode known
  production regressions as permanent tests, golden datasets auto-generate
  cases, model upgrades get A/B compare configs, and a pre-prod gate replays
  production documents against an accuracy threshold.
- Versioned prompt lineage (`prompts/v1` … `v9`) plus per-field prompt-builder
  modules — prompt evolution is diffable history, not overwritten strings.
- Deterministic canary routing for fine-tuned models: hash(fileId) modulo 100
  against an env-var percentage — cheap, reproducible traffic splitting.
- Guarded agentic automation with honest limits: a scheduled read-only Sentry
  triage bot, and a write-capable fix bot that is human-triggered only, opens
  PRs to development only, and states in its workflow comments exactly what CI
  does and does not prove.
- Compliance as code: cdk-nag HIPAA checks, customer-managed KMS keys,
  CloudTrail stack, Secrets Manager / Parameter Store split by sensitivity.
- Client feature-slice layout (`features/<domain>/{api,components,pages,…}`)
  with a shared MUI theme split into palette/typography/shadows/overrides
  modules.
- ADRs pair the decision and its cost rationale with a link to the full design
  doc; incidents and investigations are dated write-ups in `docs/`.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the stage/labels pair, the model router, and the promptfoo
regression config are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.