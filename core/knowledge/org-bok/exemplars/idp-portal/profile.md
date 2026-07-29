---
repo_url: https://github.com/MichaelWalker-git/idp-portal
notable_paths:
  - backend-app/lib/backend-app-stack.ts
  - backend-app/bin/routes/IdpPortal.ts
  - backend-app/resources/lambda/adminPanel/adminCreateUser/
  - backend-app/shared/helpers.ts
  - backend-app/stacks/resources/StepFunctionsStack.ts
  - backend-app/lib/stages.ts
  - backend-app/.eslintrc.json
  - client-app/site/src/theme/Index.tsx
---

# Exemplar Profile: IDP Portal — Multi-Tenant Document Processing Portal

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A multi-tenant intelligent document processing portal: upload PDFs/images —
or receive them via Gmail OAuth and SES inbound email — extract structured
data with GenAI, and review/hand-edit results in a web UI. Healthcare/
regulated data was in scope (HIPAA cdk-nag checks, Medicare sample docs,
KMS everywhere, all-in-VPC). A dedicated FTR deploy stage exists because the
vendor pursued AWS Foundational Technical Review for partner/marketplace
listing. Template/schema features (schemes, skeletons, per-document-type
templates) reflect a client wanting reusable extraction definitions rather
than one-off prompts; tenant-scoped Cognito attributes point at resale to
multiple customer orgs from one deployment.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A two-app TypeScript monorepo: a CDK backend of ~16 nested stacks composed
by explicit constructor props (resources + per-domain API stacks), and a
React 19 + MUI SPA deployed via Amplify Hosting.

- **Routes as data**: every REST path, method, and role ladder
  (SUPER_ADMIN → USER) is a typed record consumed generically by the API
  stack; a shared Cognito TokenAuthorizer enforces role/tenant claims from
  custom attributes. Adding an endpoint is a data edit plus a Lambda folder.
- **Bedrock over self-managed models** (Claude 3.5 Sonnet extraction, Titan
  embeddings into in-VPC OpenSearch for RAG), with an optional SageMaker NIM
  stack as a later self-hosted/alternative-model path.
- **Step Functions in MAP and RAG variants** because documents range from
  single small files to multi-file sets exceeding context windows — the
  pipeline branches on a token-budget step.
- **Compliance as code**: cdk-nag AwsSolutions + HIPAASecurityChecks aspects
  per stage, suppressions inline at the offending construct, and the FTR
  stage conditionally adding CloudTrail/Config/Inspector only where
  reviewers need them.
- **Email as a first-class input channel** (Gmail pubsub + SES triggers with
  SNS fan-out), not an afterthought.

## Key Patterns

- Three-file Lambda module: `index.ts` (CDK factory with a shared
  `LambdaHandler` signature), `handler.ts` (runtime entry with uniform
  response/error helpers), `helpers.ts` (business logic) — repeated across
  ~140 handlers.
- Stage-parameterized construct IDs (`getCdkConstructId`) failing fast on a
  missing STAGE; `deploy:<stage>` scripts select CDK stage globs.
- Shared entity/service layer over composite-key tables plus Joi schemas and
  one generic validation helper for consistent 400-shaped errors.
- Numbered step-function Lambdas (`01_…` → `05_…`, shared steps hoisted)
  make pipeline order legible from the file tree.
- Frontend feature-first layout over a centralized API surface: every path a
  named constant, curried react-query action creators, Amplify auth wrapper,
  CloudWatch RUM.
- MUI theme decomposed into palette/typography/shadows/per-component
  overrides — a real token seam rather than inline styles.
- Sample document assets in-repo double as demo seed data and implicit
  fixtures per document type.
- Anti-pattern flagged, not imitated: effectively no automated tests and no
  CI in the repo — the gate is lint + cdk-nag + `cdk diff`.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the root stack, the routes table, and a three-file
Lambda module are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.