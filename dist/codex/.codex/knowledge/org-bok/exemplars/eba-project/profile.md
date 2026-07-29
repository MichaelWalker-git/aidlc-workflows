---
repo_url: https://github.com/MichaelWalker-git/eba-project
notable_paths:
  - backend-app/lib/backend-app-stack.ts
  - backend-app/stacks/ApiStack.ts
  - backend-app/stacks/api/TripReports.ts
  - backend-app/resources/lambda/tripReport/addTripReport/handler.ts
  - backend-app/shared/helpers.ts
  - backend-app/shared/services/entities/TripReport.ts
  - client-app/src/api/actions/intake.ts
  - client-app/src/App.tsx
---

# Exemplar Profile: EBA Project — Engagement Intake & Trip-Report Tool

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An internal tool for AWS's Experience-Based Acceleration (EBA) program
workflow: capture engagement intake forms (with a Salesforce opportunity
lookup, currently mocked), file uploads, and post-engagement trip reports —
with AI-generated executive summaries at write time and report
subscriptions. A demo/POC that reached PR #22 and stopped: unauthenticated
API (Cognito deps present but unused), dev-stage-only, no CI or tests.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A two-package repo: a CDK backend (nested resource stacks composed by a
root stack, per-domain API nested stacks sharing one RestApi) and a React
19 + MUI SPA.

- **Serverless CDK won for low, bursty internal traffic**: Lambda +
  on-demand DynamoDB, one developer owning infra and code in a single
  TypeScript repo.
- **Bedrock Claude summarization kept in-account** for data governance: the
  trip-report handler generates a summary of intake + report JSON before
  persisting.
- **Compliance posture even as a prototype**: cdk-nag AwsSolutions +
  HIPAASecurityChecks Aspects with reasoned suppressions, KMS CMK
  encryption on tables/buckets/logs, VPC-attached Lambdas with flow logs,
  AWS Backup on tables — the workload handles customer engagement data and
  had to pass security review bars.
- **One least-privilege IAM role per API domain** via the shared
  policy-statement builder (DynamoDB CRUD on named ARNs, scoped Bedrock and
  S3).

## Key Patterns

- Lambda folder pairs `handler.ts` (runtime) with `index.ts` (CDK
  NodejsFunction factory with the uniform `LambdaHandler` signature); domain
  API stacks just import and wire.
- Shared `DEFAULT_PROPS` Lambda baseline overridden per function (longer
  timeout + reserved concurrency for the Bedrock call).
- Validate-then-act handler shape: parse → generic Joi `validationHelper<T>`
  (throws typed ClientError) → entity module → shared response helper;
  errors mapped by one handler — client errors verbatim, server errors
  masked.
- Entity modules over raw SDK: table name from env, PK/SK conventions
  (`ENTITY` PK, `${parentId}__${uuid}` SK for one-to-many), timestamp
  stamping, over generic DynamoDB helpers.
- Client data-layer discipline: one axios instance, path constants, per-
  domain TanStack Query hook files with cache invalidation on mutation;
  presigned-URL upload flow with progress callbacks; Yup schemas mirroring
  backend Joi.
- Anti-patterns flagged, not imitated: `AuthorizationType.NONE` on all
  methods, mocked Salesforce integration left in, `console.log` as the
  logging strategy, unused heavyweight dependencies.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the TripReports API stack, the addTripReport
handler, and the shared helpers are the canonical implementations. If the
repo is unreachable, note "deep dive unavailable" and continue from this
profile.