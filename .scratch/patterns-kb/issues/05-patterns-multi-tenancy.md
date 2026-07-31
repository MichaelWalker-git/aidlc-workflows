# 05 — Patterns: multi-tenancy/* (draft)

**What to build:** The org's multi-tenancy decisions as pattern pages — the whole `multi-tenancy/` class, not just JWT isolation. Code-read the multi-tenancy mechanisms in the relevant exemplar repos (tenant identity & JWT claims path, tenant data isolation/partitioning, tenant-scoped routing/config, tenant onboarding/provisioning — whatever the code actually shows) → one page per mechanism that passes the topic admission rule → indexed. `jwt-tenant-isolation.md` is one of these pages. All ship as `draft` — NOT blocked on the Architect's Service Delivery Platform audit (ADR-003/005: the audit later blesses or amends the files; agents get calibrated-trust guidance now).

**Note:** ADR-005/spec name only `jwt-tenant-isolation.md` as v1 multi-tenancy content; amend ADR-005's v1 list to match the broadened class in the same PR.

**Blocked by:** 01, 02.

**Status:** done (2026-07-31) — three pages shipped: `jwt-tenant-isolation.md`, `tenant-data-partitioning.md`, `tenant-onboarding.md`. Tenant-scoped routing/config got no page of its own: the code-read (7 repos) found no standalone org routing mechanism — no subdomain/host routing anywhere; tenant-scoped config shows up as registry columns / per-tenant secrets and is covered inside the partitioning and onboarding pages, per the topic admission rule.

- [x] Each page follows the template: frontmatter (`status: draft`, `reviewed`, `owner`), precedence header, all five sections
- [x] Each "Our approach" states an org decision extracted from actual exemplar code (claims path, partitioning scheme, routing, provisioning); every page satisfies the topic admission rule — no page for a mechanism with no org-specific decision/default/exemplar/scar
- [x] `jwt-tenant-isolation.md` included, extracted from the actual JWT claims-path code
- [x] Exemplars sections cite profiles via relative links (Service Delivery Platform among them)
- [x] INDEX.md row added per page
- [x] ADR-005 / spec v1-content list amended to reflect the multi-tenancy class scope
- [x] Shape test, packager, and parity check green (t249/t15/t68 green; full CI green except the pre-existing t19 AWS-credential preflight)