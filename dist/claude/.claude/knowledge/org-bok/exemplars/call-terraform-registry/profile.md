---
repo_url: https://github.com/MichaelWalker-git/call-terraform-registry
notable_paths:
  - src/main.ts
  - .projenrc.ts
  - test/main.test.ts
  - .github/workflows/build.yml
---

# Exemplar Profile: Call Terraform Registry — Scheduled Registry Poller (Spike)

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect. Curation question: this is an abandoned spike —
> consider whether it should remain on the distill allowlist / in this
> index at all.

A scheduled watcher that calls the Terraform registry daily — plausibly the
private Terraform Cloud registry used by the LPL Beacon repos — and records
registry state (module/provider versions) in DynamoDB, presumably to detect
new versions or drift. **Status: abandoned at the spike stage.** One commit,
a placeholder README, the prod stack commented out — and the Lambda handler
the stack references (`src/lambda/call-terraform-registry/index.ts`) was
never committed, so `cdk synth` would fail. The repo documents intent and
tooling defaults more than a working system.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-scaffolded single-stack CDK app: a DynamoDB table, a
`NodejsFunction` (Node 20, esbuild), and an EventBridge cron firing daily —
the org's evident go-to shape for "watch an external API daily and diff
state."

- **Serverless cron → Lambda → DynamoDB** is the cheapest zero-ops way to
  poll an external API once a day with durable state.
- **Projen gave working CI, lint, and test scaffolding in one commit**:
  build with self-mutation drift guard, PR-title lint, automated dependency
  upgrades, Mergify auto-merge.
- **Least-privilege wiring by grants**: `table.grantReadWriteData(fn)` and
  env-var config rather than hand-rolled policies.

## Key Patterns

- The projen drift-guard shape: `git diff --staged --exit-code` after build,
  diff uploaded as a patch artifact, auto-committing self-mutation job for
  same-repo branches.
- CloudFormation snapshot testing (`Template.fromStack(...)` + Jest
  snapshot) as the minimum-viable regression net for infra — though never
  run green here.
- Dev/prod stacks instantiated per environment in the app file, prod
  commented out until ready.
- Anti-pattern flagged, not imitated: referencing a Lambda entry file that
  was never committed — asset staging would fail, and the fact it survived
  to main means CI never went green.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — `src/main.ts` and `.projenrc.ts` contain everything
this repo has to teach. If the repo is unreachable, note "deep dive
unavailable" and continue from this profile.