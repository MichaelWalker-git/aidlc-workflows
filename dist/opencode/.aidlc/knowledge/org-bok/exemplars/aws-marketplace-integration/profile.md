---
repo_url: https://github.com/MichaelWalker-git/aws-marketplace-integration
notable_paths:
  - lib/saas-integration-stack.ts
  - lib/metering.ts
  - lambda/register-new-subscriber.ts
  - lambda/metering-processor-job.ts
  - helpers/metering-processor-helper.ts
  - helpers/permissions.ts
  - installation-instructions.md
  - client-app/src/components/SignUp/SignUp.tsx
---

# Exemplar Profile: AWS Marketplace Integration — SaaS Billing & Onboarding Shell

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

The seller-side AWS Marketplace SaaS integration — subscription
registration, hourly usage metering, and customer onboarding — so the AI
Document Processor product (sibling repos vrc-idp /
ai-document-processor-cdk) can be listed and billed on AWS Marketplace. The
emailed installation guide installs `@miketran/ai-document-processor-cdk`:
this repo is the billing/onboarding shell around that product, not a
standalone service. Maturity is prototype/pre-production: no CI, a stale
scaffold test, and a client/API payload mismatch.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A CDK app adapting AWS's Marketplace SaaS quickstart shape to a fully
serverless stack: a fulfillment-redirect endpoint, a signup HTTP API +
Subscribers DynamoDB table, and a metering subsystem (table + FIFO queue +
two Lambdas + hourly EventBridge rule), plus a Vite/React signup SPA.

- **Fulfillment flow**: Marketplace POSTs the registration token → redirect
  Lambda 302s to the signup page → the form POSTs `/register` → the Lambda
  calls `ResolveCustomer`, persists the subscriber, provisions a
  per-customer cross-account IAM role at runtime, and emails personalized
  installation instructions via SES.
- **Two-phase metering absorbs the Marketplace API's limits**: an hourly job
  queries a pending-records GSI, marks records processing, and enqueues to
  FIFO SQS (content-based dedup, DLQ); a processor consumes batches, chunks
  to the 25-record BatchMeterUsage limit, and writes per-record
  success/failure back — idempotency via status transitions.
- **Cross-account usage reporting because the product deploys into the
  customer's account (BYOC)**: each subscriber gets a runtime-provisioned
  `UsageReportingRole` whose trust policy is conditioned on
  `sts:ExternalId` and whose permissions are attribute-scoped DynamoDB
  writes on the metering table — no seller-hosted usage API needed.
- **Onboarding as a templated artifact**: the installation guide is a
  checked-in markdown template with `{{PLACEHOLDER}}` substitution, bundled
  into the register Lambda via an esbuild afterBundling hook, personalized
  per subscriber, and emailed.

## Key Patterns

- Lambda timeout-aware pagination: the hourly job checks remaining execution
  time each iteration with a buffer, caps records per run, and reclaims
  stuck `processing` records at the start of the next run.
- Partial-batch SQS failure reporting (`reportBatchItemFailures`) with
  correlation keys mapping `UnprocessedRecords` back to source rows.
- Factored IAM helpers on a shared basic-execution base; SDK clients at
  module scope with adaptive retry.
- Thin handlers over testable helpers (parsing, validation, batching, retry
  in `helpers/*-helper.ts`).
- Runtime SPA config via fetched `config.json` — one bundle works against
  any endpoint.
- Anti-patterns flagged, not imitated: the SPA and register Lambda have
  drifted payload contracts (bug-grade), secrets (npm/HuggingFace tokens)
  passed through env into emailed instructions, boilerplate README, stale
  scaffold test, no CI.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the metering stack, the processor helper, and the
templated instructions are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.