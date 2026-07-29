---
repo_url: https://github.com/MichaelWalker-git/tennyson-contract-comparison
notable_paths:
  - .projenrc.ts
  - src/main.ts
  - src/nested_stacks/ResourceNestedStack.ts
  - src/nested_stacks/ContractProcessingWorkflowNestedStack.ts
  - lambdas/mvp/contract_processing_pipeline/extract_contract.ts
  - src/validation/contract.ts
  - frontend/.interface-design/system.md
  - .github/workflows/ci-cd.yml
---

# Exemplar Profile: Tennyson Contract Comparison — Contract Intelligence SaaS

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Tennyson Systems (product "OneVolume") asked for a POC-to-MVP
contract-intelligence SaaS: extract ~19 order-form fields plus SKU tables
from enterprise software contract PDFs (Salesforce, Workday, Microsoft) so
private-equity firms can benchmark pricing across portfolio companies.
Field-extraction accuracy (95%+) was the headline requirement, and
multi-tenancy was required from day one because the buyer manages many
portfolio companies. The ask evolved from POC toward a marketable product —
staged environments, OIDC CI/CD, and AWS Marketplace product-code tagging.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-managed AWS CDK TypeScript monorepo: a processing stack (VPC, S3,
nested resource/API/workflow stacks), a per-env CloudFront frontend stack,
and a CDK-defined GitHub OIDC deploy role. The pipeline is a Step Functions
state machine: identify vendor → extract → validate → Choice on validation
score → process SKUs → generate export, one small Lambda per state.

- **Serverless won because the workload is bursty document processing**
  (bulk uploads, no steady-state traffic): per-operation Lambdas, Step
  Functions, pay-per-request DynamoDB minimize idle cost.
- **AWS-native re-implementation over an external library**: the team
  evaluated Google LangExtract and deliberately rebuilt its patterns (source
  grounding, smart chunking, few-shot) on Bedrock Claude for cost control,
  compliance, and ecosystem fit.
- **Vendor-specific prompts as tenant data**: extraction prompts live in
  DynamoDB behind a vendor-name GSI with a generic fallback, so improving a
  vendor's extraction is a data change, not a deploy.
- **Multi-tenant single-table DynamoDB** with tenant-prefixed partition keys
  and claims extraction at every handler seam; the README's PostgreSQL
  architecture was abandoned mid-flight for DynamoDB (dependency residue
  remains — trust the code, not the diagram).
- **Accuracy machinery is explicit**: a validation state with a score-based
  Choice, ground-truth e2e suites, and a committed regression suite for the
  risk calculator.

## Key Patterns

- Projen as the single config authority: package.json, jest thresholds, and
  lint config are generated from `.projenrc.ts`; the one hand-managed CI file
  says so in a header comment.
- Honest incremental coverage thresholds: ratcheting per-metric gates with a
  comment stating current vs target — enforced honesty over aspirational 80%.
- Security-rationale comments at validation seams: the Joi schema documents
  why a field is stripped rather than forbidden, citing the ticket and the
  cross-tenant attack it closes.
- GitHub Actions OIDC deploy role defined in CDK itself, branch-scoped,
  deployed once manually — no long-lived keys.
- Env-aware resource policy: prod retains and never auto-deletes; other
  stages destroy; S3 lifecycle rules on temp prefixes.
- cdk-nag as a standalone report entry with curated, documented suppressions.
- GSI design justification comments in CDK code explaining the access pattern
  each index serves.
- Committed design system (`frontend/.interface-design/system.md`):
  enforceable UI conventions — never hardcode colors, borders-only depth,
  8px base unit, mandatory page-shell components.
- E2e/unit separation by dependency: tests needing deployed infra live in
  their own tree and config, kept out of CI rather than mocked into
  meaninglessness.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the projen manifest, the workflow nested stack, and the
extraction Lambda are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.