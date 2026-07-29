---
repo_url: https://github.com/MichaelWalker-git/genai-cdk-claude
notable_paths:
  - .projenrc.ts
  - src/main.ts
  - src/workflows/pdf-html-json-workflow.ts
  - src/LargePDFProcessingStack.ts
  - src/DegreeDataAPIv2Stack.ts
  - lambdas/large_pdf_processing/bedrock_course_extractor/util/prompt_manager.py
  - src/degreedata_api/utils/db.ts
  - promptfoo-test/promptfooconfig.yaml
---

# Exemplar Profile: GenAI CDK Claude — DegreeData Course-Catalog Extraction

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Extract structured course data (subject codes, numbers, titles,
descriptions, credits) at scale from heterogeneous university PDF catalogs
and serve it via a keyed REST API with staging/prod tiers, for an
education-data product ("DegreeData"; a Clarivate integration suggests a
publishing/analytics consumer). Throughput (concurrency) and extraction
accuracy were the client's two live complaints — the in-repo technical
assessments analyze exactly those. Prompt tuning was the dominant iteration
loop.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-managed CDK app with three top-level stacks: a GenAI ingestion
pipeline (S3 → Step Functions Map-state batching → Bedrock Claude extraction
in Python Lambdas → DynamoDB), an NCES/IPEDS reference-data orchestration
stack, and one API stack class instantiated twice (staging + prod) over
Aurora MySQL + Drizzle.

- **The pipeline iterated from Textract+OCR to PDF→HTML→Claude** because
  layout-aware HTML preserved course boundaries better — "low accuracy on
  page-split courses" was the driving problem; the retired Textract/chunking
  Lambdas remain in a `lambdas_not_used/` graveyard.
- **Prompts are externalized to S3 with a fallback chain** (in-memory cache
  → S3 → hardcoded) so extraction prompts iterate at runtime speed without
  redeploys, with promptfoo evals over real catalog PDFs guarding quality.
- **Step Functions Map states with explicit, commented concurrency caps**
  ("3 concurrent for cost-efficiency with 2GB Lambda + 150 pages/batch")
  keep the bursty per-document workload inside Lambda memory and Bedrock
  quota limits.
- **Dual store**: DynamoDB for raw pipeline output keyed by
  (college, course_id); relational MySQL for the query-shaped API and admin
  portal.
- **Multi-env as one stack class** with an `envName` prop and suffixed
  construct IDs rather than separate per-env stack files.

## Key Patterns

- Projen with a CI self-mutation guard: generated-config drift fails the PR
  build — "generated files are law."
- Step Functions workflows as reusable constructs taking `IFunction` props —
  Lambdas provisioned in the stack, wired into workflows via typed
  interfaces.
- S3 lifecycle rules per pipeline prefix (intermediates expire in 1 day,
  HTML in 7) — cost control designed into the bucket.
- Thin uniform handler shape: validate (centralized Joi) → pooled
  module-scoped Drizzle connection → query → shared CORS response helper.
- Capacity rationale as comments: concurrency, memory, and batch sizes carry
  inline justification.
- Decision docs in-repo: throughput/accuracy assessments with diagrams,
  explicitly gated "awaiting approval", plus an OpenAPI spec.
- Anti-patterns flagged, not imitated: API keys hardcoded in authorizer
  source, live AWS credentials committed in the promptfoo config (rotate
  these), default DB credentials in source, and a retired-Lambda graveyard.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the workflow construct, the prompt manager, and the
projen config are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.