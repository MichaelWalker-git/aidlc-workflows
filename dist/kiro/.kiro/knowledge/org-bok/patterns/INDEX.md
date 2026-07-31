# Org Patterns — INDEX

The retrieval layer for the org patterns KB. One row per pattern page. The
wired agents (architect, aws-platform, devsecops, operations) read **this file**
at activation, match their current task against the trigger keywords, and open
only the pattern files that match — never the whole directory.

Patterns are the org-wide authority for the architecture decisions they cover.
The `Status` column calibrates trust before you open a file: `blessed` is a
binding org default, `draft` is advisory (verify before relying on it),
`deprecated` is superseded and names its successor. An affirmed `team.md` or
`project.md` rule in the active space may override a pattern as a documented
exception — every pattern page repeats that precedence in its standing header,
so a page read in isolation still tells you to check the active space's memory.

## Patterns

| Trigger keywords | Pattern | Status |
|------------------|---------|--------|
| Lambda RDS connections, connection pool, pool exhaustion, too many connections, RDS Proxy, pgBouncer, `pg.Pool`, `createPool`, QueuePool, SQLAlchemy engine, Knex pool, Aurora Serverless ACU, RDS Data API, database cold start | [Connection Pooling — Lambda and containers onto RDS/Aurora](data-layer/connection-pooling.md) | draft |
| read replica, reader endpoint, read/write split, read scaling, replica lag, read-after-write, Aurora reader, reader instance, multi-AZ standby, failover target, reporting database, read-only endpoint, cross-region replication, backup replication, `reader_endpoint`, ServerlessDatabaseCapacity | [Read Replicas — when reads leave the writer, and why ours mostly don't](data-layer/read-replicas.md) | draft |
| multi-tenant auth, tenant identity, JWT claims, tenant claim, `custom:tenantId`, Cognito custom attributes, Auth0 organizations, token authorizer, JWKS, tenant isolation, cross-tenant access, IDOR, 404 masking, org hierarchy, parent child orgs, claims extraction | [JWT Tenant Isolation — the claims path from token to tenant-scoped query](multi-tenancy/jwt-tenant-isolation.md) | draft |
| tenant data isolation, data partitioning, silo vs pool, tenant column, `tenantId` prefix, tenant partition key, single-table tenancy, per-tenant database, per-tenant secret, tenant S3 prefix, row-level security, `LeadingKeys`, shared database, cross-tenant leak | [Tenant Data Partitioning — pooled rows, prefixed keys, or a database per tenant](multi-tenancy/tenant-data-partitioning.md) | draft |
| tenant onboarding, tenant provisioning, create tenant, new customer setup, self-signup, post-confirmation trigger, seed tenant defaults, first admin bootstrap, tenant registry, admin create user, role ladder, Auth0 invitation, per-tenant stack | [Tenant Onboarding — provisioning a tenant without provisioning infrastructure](multi-tenancy/tenant-onboarding.md) | draft |
| Sentry, error tracking, error monitoring, `captureException`, `wrapHandler`, DSN, tracesSampleRate, session replay, sourcemap upload, ignoreErrors, alert rule, Slack alerts, incident triage, on-call, root cause, breadcrumbs, release tagging, PII scrubbing | [Sentry — errors, traces, and the incident loop](observability/sentry.md) | draft |

The classification directories below are the admitted homes; content lands one
file plus one row at a time.

## Classification

The nine classes are the Architect's taxonomy. Each is a directory beside this
file; a pattern page lives in exactly one of them.

| Class | Scope |
|-------|-------|
| `multi-tenancy/` | Tenant identity, isolation, and per-tenant data boundaries |
| `data-layer/` | Relational and key-value access: pooling, replicas, migrations, schema ownership |
| `serverless-compute/` | Lambda, Step Functions, and the choice of when compute stops being serverless |
| `idp/` | Intelligent document processing: ingest, extract, validate, human review |
| `genai/` | Model access, prompt/eval discipline, and agent topologies |
| `full-stack/` | Web front ends and the API/auth seam they sit behind |
| `eventing/` | Queues, buses, choreography, ordering, and replay |
| `iac/` | CDK and Terraform topology, environment and account layout, deploy pipelines |
| `observability/` | Errors, traces, metrics, alerting, and incident tooling |

## Maintaining this index

- **One row per pattern page, one page per row.** The shape test asserts both
  directions: a row whose file is missing fails, and a pattern file with no row
  fails. A pattern that is not indexed is a pattern no agent will ever read.
- **Trigger keywords** are the words an agent's task would actually contain —
  the technology, the symptom, and the decision ("Lambda RDS connections",
  "pool exhaustion", "RDS Proxy"), separated by commas. Write them for matching,
  not for reading.
- **The Pattern cell links `<class>/<slug>.md`** relative to this file, with the
  page title as the link text.
- **The Status cell must equal the page's frontmatter `status:`** — the shape
  test pins the agreement, so a re-blessed page is edited in both places or CI
  fails.
- A `deprecated` page keeps its row (and its successor pointer) for one review
  cycle, then the row is removed and the file goes with it.

## Pattern page template

Copy this into `<class>/<slug>.md` and replace every placeholder. The
frontmatter fields, the standing precedence header, and the five section
headings are the contract the shape test pins; the prose under each is yours.

```md
---
status: draft
reviewed: YYYY-MM-DD
owner: <name or role who re-verifies this page>
---

# <Pattern title>

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

The conditions that put a project in this pattern's scope — and the conditions
that put it out of scope, pointing at the sibling pattern that applies instead.

## Our approach

The org's decision, stated normatively ("we use X for Y"), with the rationale
that makes it judgeable. Name the defaults concretely enough to implement.

## Exemplars

Proof from production: relative links to the exemplar profiles that show this
pattern running, e.g. `../../exemplars/<repo>/profile.md`, each with one line
on what that repo demonstrates.

## Gotchas

The scars — what the org already paid for once ("we tried X on Y, it broke at
scale"), plus the failure modes a first-time implementer walks into.

## References

External documentation (AWS docs, RFCs, vendor guides). Pure-textbook material
belongs here as a link, never as a pattern page of its own.
```

Set `reviewed:` to the date the page was last verified against its exemplars —
the placeholder is not a date and the shape test rejects it. New pages ship
`draft`; Architect approval is what flips a page to `blessed`.

## Topic admission rule

A pattern page exists only if it carries at least one org-specific statement: a
decision, a default, an exemplar, or a scar. Content that is purely AWS's own
documentation stays a link under `## References` in an existing page. This keeps
the KB thin and opinionated instead of mirroring AWS's surface area — the
maintenance load should grow with org decisions, not with AWS.