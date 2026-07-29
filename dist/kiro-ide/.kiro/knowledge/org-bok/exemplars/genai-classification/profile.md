---
repo_url: https://github.com/MichaelWalker-git/genai-classification
notable_paths:
  - src/main.ts
  - .projenrc.ts
  - src/config.ts
  - src/policies.ts
  - lambdas/aoss_vector_search_indexer/aoss_vector_search_indexer.py
  - lambdas/similarity_searcher/similarity_searcher.py
  - lambdas/start_textract_step_function_docker/start_textract_step_function_docker.py
  - .github/workflows/build.yml
---

# Exemplar Profile: GenAI Classification — Vector-Similarity Document Router

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An automated pipeline that ingests candidate documents (resumes,
transcripts — keys like `candidateId`) uploaded to S3, converts Office
formats to PDF, OCRs with Textract, classifies document type via
vector-similarity against previously indexed documents (Bedrock Titan
embeddings + OpenSearch Serverless kNN), and files each PDF into a canonical
`candidate-documents/{docType}/{candidateId}/{docId}/` layout — correcting
the caller-provided type when the similarity vote disagrees. A client
PoC/spike: treat as an architecture exemplar, not a code-quality one.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-scaffolded CDK app with one monolithic stack: VPC, OpenSearch
Serverless VECTORSEARCH collection (VPC-endpoint-only network policy), two
buckets, six Python Lambdas (Docker-image where deps are heavy), and two
Step Functions state machines.

- **Fully serverless and event-driven** so nothing runs between uploads;
  Textract's async job model forces the task-token/callback state-machine
  shape, and `amazon-textract-idp-cdk-constructs` made that nearly free —
  reuse a maintained third-party construct over hand-rolled polling.
- **The state machines split at the async boundary**: long-running Textract
  extraction (24h timeout, WAIT_FOR_TASK_TOKEN) is separate from the
  embeddings/classification workflow; the bridging Lambda gets the second
  machine's ARN via environment and `grantStartExecution` — least privilege,
  no wildcards.
- **OpenSearch Serverless + Bedrock-hosted embeddings** avoid managing any
  cluster or model; classification is a kNN shortlist with score threshold
  and top-k majority vote on document type.
- **Metadata flows via S3 object tags** (docType/candidateId/docId) carried
  through Step Functions payloads rather than a database.

## Key Patterns

- One directory per Lambda with the handler file named after the directory;
  Docker-image packaging whenever dependencies exceed zip comfort
  (LangChain/opensearch-py/numpy), zip assets for trivial handlers.
- Typed dotenv config (`ConfigProps` with stage/region/prefix defaults) plus
  a `{prefix}-{stage}-{name}-{region}` naming helper with a 63-char cap.
- IAM role factory (`createLambdaRole`) centralizing the common Lambda role
  shape — applied inconsistently here, which is the lesson: factor it and
  use it everywhere.
- Consistent Python handler shape: module-level clients, typed
  `lambda_handler`, `event.get('Payload', event)` unwrapping for Step
  Functions inputs.
- Projen self-mutation CI plus semantic PR-title lint and a Mergify queue.
- Anti-patterns flagged, not imitated: a broken snapshot test importing a
  nonexistent class, a dead nested-stack file, an unreachable
  similarity-search branch behind an early return, and `bedrock:*`/`ec2:*`
  wildcards undercutting the otherwise good security defaults.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the main stack, the indexer, and the similarity
searcher are the canonical implementations. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.