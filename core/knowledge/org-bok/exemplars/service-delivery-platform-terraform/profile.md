---
repo_url: https://github.com/MichaelWalker-git/service-delivery-platform-terraform
notable_paths:
  - atlantis.yaml
  - infracost.yml
  - .github/workflows/infracost.yml
  - .github/workflows/checkov.yml
  - service-delivery-platform-backend/backend.tf
  - service-delivery-platform-backend/rds.tf
  - service-delivery-platform-backend/secrets.tf
  - service-delivery-platform-backend/locals.tf
  - modules/terraform-aws-rds/main.tf
  - modules/terraform-aws-rds/alerting.tf
  - modules/ssm-parameter-changed/lambda.tf
  - shared-services/vpc-endpoints.tf
---

# Exemplar Profile: Service Delivery Platform Terraform — GitOps IaC for a Security Firm

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

The AWS infrastructure for Lodestone Cybersecurity's multi-tenant Service
Delivery Platform (analyst/client/demo frontends + Python backend with
async workers), with hard test/prod isolation across separate AWS
accounts and no-console GitOps operation: every infra change reviewed,
cost-estimated, security-scanned, and applied via PR. For a cybersecurity
company the infra repo is itself a security posture statement — WAF, RUM,
health checks, alarms, encrypted-everything, and DR backups are table
stakes, not extras.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Monorepo Terraform operated via Atlantis: three root stacks
(`shared-services/`, backend, frontend), each its own S3 state, each
deployed to `test` and `prod` via Terraform workspaces selecting
`env/<env>.tfvars`. Thirteen local reusable modules
(`terraform-aws-<thing>`), shared IAM policy JSON in `policies/`.

- **Atlantis + workspaces + per-account assume-role gives auditable,
  PR-gated change control with zero human AWS credentials** — the apply
  path is a PR, nothing else. `allowed_account_ids` pins each provider to
  its target account.
- **Three-stack split keeps state blast radius small**, while
  `when_modified: ../modules/**` in `atlantis.yaml` auto-plans every
  consuming stack/env when a shared module changes — cross-cutting blast
  radius surfaces in one PR.
- **Checkov and Infracost run as PR checks**: policy regressions and cost
  diffs are review artifacts (Infracost baseline-vs-PR as one
  self-updating comment; Checkov exceptions as inline justified
  `#checkov:skip` at the resource).
- **SOPS-in-repo secrets** decrypted at plan time, written to SSM
  SecureStrings, injected into ECS task defs — plus a Lambda that restarts
  Fargate services when a watched SSM parameter changes. Vault-class
  outcomes without Vault-class operations for a small team.
- **Deliberately no scale-out data layer**: a single multi-AZ PostgreSQL
  instance with cross-region *automated-backup replication* (DR, not a
  serving replica). There is no read replica, no Aurora, and no RDS Proxy
  anywhere; Sentry env vars are plumbed into the containers but tracing is
  switched off in both envs, and there is no ADOT/X-Ray sidecar. Do not
  cite this repo for read-replica routing, connection-pooling
  infrastructure, or distributed tracing.

## Key Patterns

- One Atlantis project per (stack, workspace) with autoplan on the stack's
  files, its env tfvars, and `../modules/**`.
- Modules ship their own alarms: the RDS module bundles a seven-alarm pack
  (CPU, disk queue, free storage, burst balance, CPU credits, memory,
  swap) with thresholds computed as a percentage of the actual instance
  memory via instance-type data lookup — provisioning and observability
  land together.
- Multi-account provider-alias topology: default provider assumes role in
  the env account; `aws.replica` (backup region) and `aws.dns_account`
  (central DNS account) aliases keep cross-account resources explicit.
- GitHub Actions OIDC deploy roles per stack, JWT `sub` claim pinned to
  specific repos — no long-lived CI credentials.
- `moved {}` blocks committed for state-safe refactors when resources
  migrate into modules.
- Granular per-rule security-group resources with least-privilege egress
  (443/53/5432/6379 only).
- Frontend SPAs as S3 + CloudFront + ACM + WAFv2 + CloudWatch RUM (with a
  Cognito identity pool module), DNS held in a separate account.
- Route53 external health check + SNS alarms; server-error log-metric
  alarm delivered via AWS Chatbot to Slack.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — `atlantis.yaml` (the GitOps matrix), `rds.tf` +
`modules/terraform-aws-rds/` (the data-layer provisioning and alarm
pack), and `secrets.tf` (the SOPS→SSM→ECS chain) are the canonical
implementations. If the repo is unreachable, note "deep dive unavailable"
and continue from this profile.