---
repo_url: https://github.com/MichaelWalker-git/simba-platform
notable_paths:
  - Makefile
  - scripts/deploy-local.sh
  - simba-workspace/libsimba/apitest/conformance.go
  - simba-workspace/libsimba/multiserver/multiserver.go
  - simba-infra/lib/constructs/nist-nag-suppressions.ts
  - deploy/helm/simba-platform/values.yaml
  - tests/e2e/lib/test-helpers.sh
  - simba-workspace/gateway/.gitlab-ci.yml
---

# Exemplar Profile: SimBA Platform — GovCloud Simulation Platform Meta-Repo

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A defense/government customer asked for a deployable, demonstrable
simulation platform — synthetic entity/TSPI data generation for military
training and test scenarios — with the emphasis on test artifacts, logging,
data persistence, and multi-scenario support over cost ("Price is not a
concern — data flow and test value are," per committed meeting notes). The
buyer needed reproducible from-zero installs by non-authors, including
air-gapped environments, and the production target was AWS EKS in GovCloud
(non-HA acceptable, EKS required). This GitHub repo is a snapshot mirror of
the internal GitLab meta-repo with the service repos vendored in for
hand-off.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A meta-repo/deployment orchestrator over ~8 Go microservices behind a single
gateway (SSE data flows: simulation engine → stream server/echo → gateway →
browser), with Keycloak OIDC auth, a shared platform library, Helm/EKS
deployment, and CDK GovCloud infrastructure.

- **One-command zero-to-running won because non-authors install it**:
  `make deploy` does prereq check → clone → build → start → health-check
  verify, with a fresh-install guide and fresh-container install tests.
- **A deployment-parity ladder** — the same stack runs bare-metal → compose
  → k3d → EKS → air-gapped EKS, with Helm values files as the only variation
  point; an air-gap bundle/load script pair produces a single tarball
  (images + chart + terrain data) for disconnected transfer.
- **Go with minimal dependencies + vendoring** for auditability and air-gap
  buildability; Keycloak for OIDC because Active Directory integration was
  on the roadmap.
- **Compliance as code for federal work**: cdk-nag NIST 800-53 R5 checks
  applied app-wide with all suppressions gathered in one auditable construct
  file, and inline NIST control citations next to the settings they justify.
- **A shared platform library is the seam**: `libsimba` owns the HTTP server
  skeleton, auth middleware, env, logging, and uniform
  ping/info/health/metrics endpoints — which is what makes generic health
  checking and conformance testing possible.

## Key Patterns

- Conformance testing as a shared library: per-service endpoint contracts
  defined once and run by each service's own test — contract testing without
  extra infrastructure.
- Self-documenting Makefile (`make help` greps `##` comments); every target
  degrades gracefully on missing tools.
- Bash e2e framework: numbered suites sourcing a shared helper library
  (pass/fail/warn/skip counters, colored output) with a master runner and
  `--api-only/--skip-deploy` flags.
- Per-service GitLab CI shape: test with `-race` + coverage → lint → static
  binary → container → ECR via OIDC federation.
- Load testing with published findings: quantified the Keycloak login
  bottleneck vs the API layer, recorded in committed docs.
- Meeting notes with completion-criteria checkboxes and decision provenance
  in comments ("removed — Kevin confirmed 2026-04-23").
- Committed realm JSON with role-based test users makes auth reproducible in
  every tier.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the Makefile, the conformance harness, and the NIST
suppressions construct are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.