---
repo_url: https://github.com/MichaelWalker-git/pod-staffing-planner
notable_paths:
  - backend/importlinter.ini
  - backend/app/engine/__init__.py
  - backend/app/auth/ports.py
  - backend/app/deps.py
  - backend/tests/integration/test_csv_correctness_gate.py
  - backend/app/tests/engine/test_properties.py
  - backend/app/config.py
  - k8s/deployment.yaml
---

# Exemplar Profile: Pod Staffing Planner — Spreadsheet-Replacement Financial Modeler

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An internal enterprise client asked for a tool to replace the Excel
spreadsheet used to model pod-staffing economics — revenue, COGS, margins,
blended rates for billable/non-billable pods — adding what the spreadsheet
could not do: plan versioning, scenarios, what-if comparison, admin-managed
rate cards, and approval workflows. Financial-correctness parity with the
client's own spreadsheet was the make-or-break acceptance criterion. The
project started fast on GCP Cloud Run with a mock IdP, then migrated into
the enterprise's mandated Azure platform (UAIS BYOC: AKS backend, Azure Web
App frontend, JFrog registry, Key Vault) — the migration is documented as a
committed decision table.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A two-container monorepo — FastAPI + SQLAlchemy async + Postgres backend and
a React 19/Vite SPA — plus a dev-only mock Azure AD container and a deployed-
environment Puppeteer e2e suite.

- **The pure financial engine is the crown jewel**: frozen dataclasses in and
  out, all `Decimal`, no I/O — because the correctness guarantee (reproduce
  the client's reference CSV to the cent) is only testable against a pure
  core. Purity is machine-enforced by import-linter contracts ("engine may
  not import models/db/fastapi"), a CI failure rather than a convention.
- **Ports-and-adapters auth paid for itself in the cloud migration**: auth
  ports (`Protocol` interfaces) with Azure AD, Cognito, and mock-IdP
  providers behind one factory and a documented composition root — the
  GCP-to-Azure move left auth code untouched. The frontend mirrors this with
  a boot-time shell switch (bypass / Cognito / MSAL).
- **Enterprise platform constraints dictated topology**: the BYOC platform
  hosts only the backend on AKS (hand-authored manifests with
  Gatekeeper-mandated security contexts, Key Vault CSI secret mounts read via
  `*_FILE` env vars); the frontend ships separately to an Azure Web App; prod
  deploys go through a platform-owned approval flow, not this repo's CI.
- **Fail-closed production config**: the app refuses to boot with `ENV=prod`
  pointing at a localhost/mock JWKS URL or with auth disabled — runtime
  guards, not documentation.
- **OpenAPI-driven type contract**: frontend API types regenerate from the
  running backend's `/openapi.json` on every dev/build, degrading gracefully
  when the backend is down.

## Key Patterns

- Correctness gate pinned to the client's own artifact: the reference
  spreadsheet CSV is committed and the engine must reproduce its totals to
  the cent / 0.1% — the acceptance-test anchor for financial software.
- Import-linter purity contracts for any pure-core module — the pattern that
  makes property-based testing and the correctness gate possible.
- Hypothesis property tests with documented tolerance rationale: comments
  explain why Decimal tail artifacts are correct (full precision inside,
  rounding at the serializer edge) instead of silently widening tolerances.
- Composition root with test ergonomics designed in: the deps module's
  docstring explains the monkeypatch seam; provider swap touches one file.
- Mock IdP as a scoped product: imitates only the claims/JWKS surface the
  validator uses, warns it is dev-only, and prod config refuses to point at
  it; `make mock-token` mints test tokens.
- Strict toolchain baseline: mypy strict + pydantic plugin, ruff with
  security and async rule sets, one `make api-check` gate for lint +
  typecheck + test.
- Traceability comments naming their source: task IDs, platform doc sections,
  and dated architecture reviews cited in code, manifests, and workflows.
- Migration as a committed decision document (today/target topology tables
  with the why).

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the import-linter contracts, the engine package, and the CSV
correctness gate are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.