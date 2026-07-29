---
repo_url: https://github.com/MichaelWalker-git/agent-data
notable_paths:
  - lib/config.ts
  - lib/constructs/ParameterExporter.ts
  - apps/platform/bin/platform.ts
  - lib/stacks/platform/strandsInfrastructureStack.ts
  - src/strands-agents/main.py
  - src/strands-agents/agents/base_midar_agent.py
  - .gitlab-ci.yml
  - .clinerules/deployment-validation.md
---

# Exemplar Profile: Agent Data (MIDAR) — Multi-Account Migration-Intelligence Agents

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A POC replacing MIDAR QuickSight dashboards with persona-based
conversational AI (chat + dashboards) over AWS migration/propensity data,
deployable across dev/staging/prod AWS accounts from GitLab. POC status is
explicit (README, admin CI role, no tests); knowledge bases were created
manually and referenced by ID as a documented simplification.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A multi-runtime CDK monorepo — TypeScript CDK in a three-tier app split
(foundation: Cognito/DNS; platform: agents + APIs; application: frontend
hosting), containerized Python Strands agents on ECS Fargate, Lambda
handlers, and a React 19/Mantine SPA.

- **Three CDK app entry points, one per tier**, so slow-changing infra
  (auth, DNS) deploys independently of fast-iterating agent infra — the
  team needed independent deploy cadence.
- **Cross-tier decoupling via SSM Parameter Store, not CloudFormation
  exports**: a shared `ParameterExporter` construct writes every published
  value to a CfnOutput and a namespaced parameter
  (`/midar/<env>/<service>/<param>`); the application tier re-imports by
  path — avoiding export lock-in.
- **Two parallel agent runtimes tell the platform-evolution story**: managed
  Bedrock Agents (supervisor + collaborator) came first, then the team
  outgrew them — self-hosted Strands SDK on Fargate gave custom tools,
  direct-S3 data access (a v3 performance rewrite over Athena), WebSocket
  streaming, and S3 session persistence. The Bedrock stack was kept
  alongside rather than removed.
- **Hybrid config split forced by the credential vendor**: AWS account IDs
  and credentials live in GitLab CI variables; everything else in typed
  per-environment YAML (`lib/config.ts` loader with an override whitelist
  and hard failure on missing files).
- **One immutable frontend build across environments**: CI reads stack
  outputs and writes `dist/config.json` post-build; a frontend transport-
  abstraction service toggles WebSocket vs REST per environment for
  zero-downtime migration.

## Key Patterns

- `ParameterExporter` construct — the namespaced-SSM cross-stack contract.
- Typed YAML-per-environment config loader with env-var override whitelist.
- Reusable per-agent API construct (API Gateway resource + Cognito
  authorizer + request validator) stamped out per agent/version.
- Strands agent base-class hierarchy with startup data preloading (class-
  level cache + lock), a performance-tracking decorator, and S3-backed
  session persistence with lifecycle expiry.
- Post-deployment validation as a first-class artifact: a scripted health
  suite with retries and rollback triggers, codified as a mandatory gate in
  a committed rules file — "deployment isn't done until the suite passes."
- GitLab multi-account deploys: YAML anchor template, cross-account role
  assumption, auto `cdk bootstrap --trust`, dev auto / staging+prod manual.
- Anti-patterns flagged, not imitated: committed merge-conflict markers,
  `.bak` files and `dist/` in git, versioned `_v2`/`_v3` files instead of
  git history, `AdministratorAccess` CI role, no real tests.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the config loader, the exporter construct, and the
agent base class are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.