---
status: draft
reviewed: 2026-07-31
owner: p.lysanets
---

# Tenant Data Partitioning — pooled rows, prefixed keys, or a database per tenant

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

You hold a trusted tenant id (see
[jwt-tenant-isolation](jwt-tenant-isolation.md) for how you got it) and must
decide how tenants' data is physically separated: shared tables with a tenant
column, a shared DynamoDB table with tenant-prefixed keys, tenant-prefixed S3
keys, or a whole database per tenant.

In scope: the pooled-vs-siloed decision per storage layer (Postgres,
DynamoDB, S3, Secrets Manager), key construction, and the blast-radius
tradeoffs the exemplars actually hit. Out of scope: who verifies the tenant
id (the JWT page), and how a tenant's resources get created
([tenant-onboarding](tenant-onboarding.md)).

## Our approach

**The default is pooled storage partitioned by a tenant key, with isolation
enforced at one application seam — not per-tenant infrastructure.** Every
SaaS-shaped exemplar shares the database and scopes rows in code:
service-delivery-platform runs one Postgres, one schema, an `org_id` FK on
every tenant-owned table, and one Terraform tree with no per-tenant axis at
all — onboarding a customer is zero infra changes. curriculum-management is
the same shape on Fastify/Drizzle (`college_id` on every table).
None of our exemplars uses Postgres row-level security; isolation quality is
therefore exactly the quality of the scoping seam, which is why the JWT
page's one-seam rule is load-bearing here too.

The defaults we ship:

- **Postgres, pooled: tenant FK column on every tenant-owned table, and
  composite indexes that lead with it.** curriculum-management's performance
  migration is the template — `(college_id, status)` on every hot table. Put
  the tenant column first; a tenant-scoped query that scans a global index
  degrades with every tenant you add.
- **DynamoDB, pooled: build the tenant into the partition key, through a
  shared key-builder.** tennyson-contract-comparison's single-table layout
  keys tenant data as `${tenantId}-${TYPE}` (contracts, prompts, vendor
  lists) so a query physically cannot cross tenants, and even its
  vendor-name GSI keeps the tenant-prefixed PK — lookups stay tenant-scoped
  inside the index. Where the tenant lands in the sort key instead, include
  the separator in prefix queries: its `tenantUserPrefix` returns
  `` `${tenantId}-` `` precisely so one tenant id can never `begins_with`-match
  a longer id that starts with it.
- **S3: tenant-prefixed keys, written by the server only.** mri-gov-ap's
  convention is `tenant/<muni>/inbound|batches|reference/`;
  tennyson-contract-comparison writes `contract/${tenantId}/...` from JWT
  claims and, after HOR-2618, treats any client-supplied key as a claim to be
  proven against the stored record — never a path to sign. If a stored key
  is about to drive a destructive operation, re-check its tenant segment
  (its delete handler refuses keys outside `contract/${tenantId}/` even
  though they came from its own table).
- **Silo when the tenant's data belongs to someone else.** mri-gov-ap runs a
  whole Aurora cluster per municipality — each is a mirror of that town's
  on-prem ERP subset, with its own Secrets Manager secret
  (`mri-<tenant>-erp-db`) and a per-secret pool cache, and IAM scoped by the
  secret-name wildcard (`mri-*-erp-db*`: tenant is the wildcard, resource
  class is fixed). Choose the silo when tenants' datasets have independent
  lifecycles, owners, or compliance boundaries — not as a general default;
  the same repo keeps its own application data pooled in one DynamoDB table
  under `TENANT#<code>` partition keys.
- **Decide the partition unit deliberately — per-tenant is not the only
  honest answer.** idp-portal partitions its data table per *user*
  (`userId#SECTION`) and reaches the tenant only transitively through the
  user record; translation-indigenous-languages scopes per user by design
  (its "tenants" are roles). Per-user keys are fine when users never share
  data; the moment a tenant-wide view is needed, the missing tenant key
  becomes a scan.
- **Legacy and unowned rows fail closed.** translation-indigenous-languages
  gives pre-cutover jobs no `ownerId`; its sparse owner GSI simply never
  indexes them and its ownership assert 404s them for everyone but ADMIN —
  the unowned row is invisible by construction, not by remembering to filter.

## Exemplars

- [service-delivery-platform-backend](../../exemplars/service-delivery-platform-backend/profile.md)
  — pooled Postgres with `org_id` on every tenant-owned table, plus
  column-level Fernet encryption (an `EncryptedType` TypeDecorator) for
  tenant-supplied third-party credentials, one row per org.
- [service-delivery-platform-terraform](../../exemplars/service-delivery-platform-terraform/profile.md)
  — the infra half of the pooled default: one RDS instance, one DB name, one
  connection string per environment; the only isolation axis in Terraform is
  test-vs-prod (separate AWS accounts). Cite it as proof that pooled tenancy
  keeps the infra tenant-blind.
- [tennyson-contract-comparison](../../exemplars/tennyson-contract-comparison/profile.md)
  — single-table DynamoDB with tenant-prefixed partition keys, the
  separator-in-prefix rule, tenant-scoped GSIs, and per-tenant S3 prefixes
  with server-derived keys.
- [mri-gov-ap](../../exemplars/mri-gov-ap/profile.md) — the silo exemplar:
  Aurora cluster per municipality, per-tenant secret, per-secret pool cache,
  tenant-wildcard IAM; pooled DynamoDB (`TENANT#<code>`) beside it.
- [curriculum-management](../../exemplars/curriculum-management/profile.md)
  — pooled Postgres with `college_id` everywhere and composite
  `(college_id, status)` indexes; also the cautionary half — see Gotchas.
- [idp-portal](../../exemplars/idp-portal/profile.md) — per-user partitions
  (`userId#SECTION`, `uploads/${userId}/...`) with tenant reachable only
  through the user record; cite when weighing per-user vs per-tenant keys.

## Gotchas

- **Column discipline is per-query, and one query is all it takes.**
  curriculum-management's catalog route accepts `?collegeId=` from any
  authenticated user with no admin check — one handler that skipped the
  where-clause pattern its own CLAUDE.md mandates. If you choose pooled
  Postgres without RLS, the review checklist ("every query filters by
  tenant") *is* the isolation boundary; audit new endpoints against it.
- **App-layer isolation with table-wide IAM is one bug deep.**
  tennyson-contract-comparison's security audit says it plainly: every
  Lambda role can read the whole table, so key discipline is the only wall —
  it recommends `dynamodb:LeadingKeys` conditions as the second wall. Ours
  don't ship it yet; that is a decision to revisit, not a blessed default.
- **The tenant-key helper only helps if it is used.** mri-gov-ap ships a
  `@mri/tenant-context` package whose header says "no service hand-builds a
  prefix" — and nothing imports it; every service hand-builds the strings,
  and the DynamoDB `pk()` helper is duplicated per store. One store changing
  its shape breaks isolation invariants silently. Make the key builder the
  only way to spell the key, or delete it.
- **Keying on the wrong id strands rows.** tennyson-contract-comparison's
  user records were originally keyed on a random uuid instead of the Cognito
  `sub` — DynamoDB "happily 404s a Get, no-ops a Delete, and creates a
  phantom item on Update", and the fix needed a paginated legacy-key
  fallback. The partition key's identity component must be the one the
  request actually carries.
- **A rotated secret outlives its cached pools.** mri-gov-ap defers secret
  rotation because rotation invalidates cached per-tenant pg pools in warm
  Lambdas (stale-pool 500s until a forced recycle). The per-secret pool
  cache and the rotation policy are one decision — see the connection-pooling
  page's cache-the-promise shape for the cache half.
- **A registered tenant without its physical resources is a runtime
  landmine.** In the silo model the registry row and the cluster are created
  in different steps: mri-gov-ap records that a town present in `TENANTS`
  but missing its secret throws `ResourceNotFoundException` in six services
  the moment anyone selects it — the exact Sentry alert seen on 2026-07-27.
  Silo onboarding needs an end-to-end verification step, not just entries.
- **Per-tenant data formats drift.** Same silo, same schema, different
  content: Danville's `acct_num` uses hyphens where Sullivan's uses dots —
  mri-gov-ap's runbook says to read the structured `gl_seg2` column instead
  of parsing. Never parse convention out of a per-tenant field when a
  structured column exists.

## References

- [AWS SaaS Lens: silo, pool, and bridge models](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html)
  — the vocabulary this page's pooled/silo decision uses.
- [Multi-tenancy in DynamoDB](https://docs.aws.amazon.com/whitepapers/latest/multi-tenant-saas-storage-strategies/multi-tenancy-on-dynamodb.html)
  — key-prefix strategies and `dynamodb:LeadingKeys` IAM conditions.
- [Postgres row-level security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
  — the database-enforced alternative none of our exemplars uses yet; the
  candidate answer to the per-query-discipline gotcha.
- [S3 prefix-based access control](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-policy-alternatives-guidelines.html)