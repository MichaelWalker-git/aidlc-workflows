---
name: mvp
depth: Standard
keywords:
  - mvp
  - minimum viable
description: Skip operations, ship the core
skeleton: on
runner: true
---

# mvp scope

Standard depth, but trims the front and back of the workflow to ship the
core fast. Ideation runs a reduced ceremony (no market-research, no
team-formation, no approval-handoff — precedent-research stays in, gated on
the install shipping a usable Org BoK) and the entire operation phase is
skipped — an MVP proves the product, it does not yet carry production
operations weight.

## Why these stages, why skip those

The full inception and construction passes stay EXECUTE: an MVP is still
real software that needs design, code, and tests. Precedent-research also
stays: starting from the org's proven architecture is cheapest exactly when
the build is greenfield and fast — and its BoK gate already skips it on
installs with no exemplars, so it costs nothing where it can't help. What
the scope skips is the discovery overhead that only pays off at scale
(market-research, team-formation) and the operation stages (deployment-pipeline,
environment-provisioning, deployment-execution, observability-setup,
incident-response, performance-validation, feedback-optimization), which
belong to a product past its first proof. Promote to `feature` or
`enterprise` when the MVP graduates.

## Membership

Keyword triggers: `mvp`, `minimum viable`. Initialization, the reduced
ideation set (including the BoK-gated precedent-research), all of
inception, and the build path of construction run; operation is skipped
wholesale.
