---
repo_url: https://github.com/MichaelWalker-git/service-delivery-platform-backend
notable_paths:
  - README.md
  - util/auth0.py
  - entity/auth_user.py
  - service/organizations.py
  - integration/db/organizations.py
  - integration/db/base.py
  - entity/_custom_types.py
  - server.py
  - cli.py
  - doc/architecture/decisions/0001-task-queue-and-workers.md
  - .github/workflows/build-and-release.yml
---

# Exemplar Profile: Service Delivery Platform Backend — Multi-Tenant SecOps Portal

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Lodestone Cybersecurity commissioned the backend of a customer-facing
Service Delivery Platform: a multi-tenant portal where client
organizations (including parent/child MSP-style hierarchies) see security
signals ingested from the Hunters SOC platform, triaged into cases, with
escalations mirrored into Zendesk — Auth0 owning identity, organizations,
and RBAC. The core ask: expose Lodestone's internal SOC workflow to
clients safely, with hard per-organization isolation and hierarchical
visibility (platform admins see everything; parent orgs see children only
with explicit `_deep` permissions).

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A FastAPI monolith (Python 3.11) with a strict, README-documented
three-layer architecture — `router/` (presentation) → `service/` (business
logic + every permission check) → `integration/` (dumb transport to
Postgres/Auth0/Zendesk/Hunters/Redis) — plus `entity/` (SQLAlchemy 2.0
dataclass entities) and `model/` (Pydantic API models). Celery on Redis
runs background integration I/O; alembic owns migrations, run as a
dedicated deploy task.

- **Cross-tenant leakage was the dominant risk in a security product**, so
  the shape makes isolation auditable: Auth0 embeds org memberships and
  permissions in the JWT; every data query funnels through one small
  service-layer seam (`get_user_org_ids` → `org_ids` filter), so tenant
  scoping is enforced in one reviewable place, not per endpoint.
- **JWT validation is a full checklist**: JWKS client, signature +
  audience + issuer verification, then a DB-existence gate on top — a
  valid token alone is not enough, the user must be provisioned. Caveat
  the code carries: a permissive default permission list when the
  `permissions` claim is absent.
- **Hierarchical tenancy via recursive CTE** over `parent_id`, with base
  vs `_deep` permission pairs gating descendant visibility. Isolation is
  application-enforced allowlist filtering; no Postgres RLS.
- **Celery over Procrastinate (ADR 0001)** because most platform work is
  background integration I/O that must scale with client acquisition —
  maturity beat architectural minimalism.
- **Deliberate infrastructure simplicity**: the engine is
  `create_engine(...)` with SQLAlchemy's default QueuePool (no pool
  tuning), there is no read-replica or multi-engine routing, and there is
  no Sentry — observability is Prometheus `/metrics`, a uuid7
  `X-Request-ID` propagated via contextvars, and loguru JSON logs. Do not
  cite this repo for pool tuning, replica routing, or Sentry wiring.

## Key Patterns

- Three-layer rule with a "few verbs" integration contract: integrations
  expose roughly `save`/`filter`/`delete` only; routers hold zero business
  logic; the first line of every service method is
  `auth_user.must_have_permission(PBAC.<x>)`.
- Permissions-as-code: one typed `PBAC` catalog in the codebase, one-way
  synced to Auth0 via `cli.py run-sync-permissions` (additive only), with
  base vs `_deep` pairs for hierarchical scope.
- Constructor DI with module-level singletons — services take integrations
  as constructor args, so unit tests mock each collaborator; tests are
  colocated `*_test.py` next to source.
- Migration discipline: a CI job fails on multiple alembic heads (the
  merge-conflict trap); seed data ships as migrations; migrations run as a
  dedicated container before the app restarts.
- Column-level encryption for tenant-supplied credentials: a Fernet
  `EncryptedType` TypeDecorator, not plaintext columns.
- Coded error taxonomy: a `CodeError` chain with machine-readable codes
  rendered into a stable JSON envelope by one global handler.
- Thin per-repo CI delegating to org-shared reusable workflows (lint,
  Semgrep, image tests); build-once, promote-the-image between AWS
  accounts with a manual prod gate.
- Queue tasks by name (`send_task`), not imported function — ADR-recorded,
  keeps scheduler and worker code separable and DI-testable.
- UUIDv7 primary keys for time-ordered, index-friendly IDs.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — `util/auth0.py` (the JWT claims path),
`service/organizations.py` + `integration/db/organizations.py` (the
tenant-scoping seam and recursive CTE), and `integration/db/base.py` (the
entire engine config) are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.