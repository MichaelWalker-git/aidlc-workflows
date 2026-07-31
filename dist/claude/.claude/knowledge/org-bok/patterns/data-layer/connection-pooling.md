---
status: draft
reviewed: 2026-07-30
owner: p.lysanets
---

# Connection Pooling — Lambda and containers onto RDS/Aurora

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

You are wiring compute onto a relational store — Aurora PostgreSQL/MySQL or
RDS — and have to decide who holds the connections: RDS Proxy, an in-process
pool, both, or neither.

In scope: Lambda handlers that query Postgres/MySQL; long-lived containers
(ECS Fargate, EC2) doing the same; the ACU floor of the Aurora Serverless v2
cluster underneath, because pool timeouts and cluster resume latency fail
together (see Gotchas).

Out of scope: read/write splitting and replica routing — a planned sibling
page (`data-layer/read-replicas.md`) that does not ship yet; check the
[INDEX](../INDEX.md) for whether it has landed. Per-tenant data boundaries
are covered by
[multi-tenancy/tenant-data-partitioning](../multi-tenancy/tenant-data-partitioning.md).
A per-tenant *pool cache* is in scope here and covered under "Our approach".
DynamoDB-backed work has no pool decision to make.

## Our approach

**Lambda onto Aurora/RDS goes through RDS Proxy, and the in-process pool is
sized for one execution environment — not for the cluster.** Lambda scales
horizontally, so N concurrent execution environments each holding a pool of
size M opens N×M backend connections; the proxy exists to make that
multiplication someone else's problem. vrc-idp states the rule in the code
itself — `max: 1 because RDS Proxy handles connection pooling`.

The defaults we ship:

- **Provision the proxy with `requireTLS: true`, a dedicated security group,
  and an explicit `idleClientTimeout`.** Both proxied exemplars set TLS on;
  blueprint-checker gives the proxy its own SG with two narrow rules (Lambda →
  Proxy 5432, Proxy → Aurora 5432) rather than sharing the cluster's, and
  grants `lambda.amazonaws.com` IAM connect. `idleClientTimeout` is a real
  knob, not a default to accept: 5 minutes (blueprint-checker) versus 30
  minutes (vrc-idp) is the tradeoff between reclaiming borrowed backend
  connections and paying reconnect cost on a bursty workload.
- **Cache the pool AND the Secrets Manager credentials at module scope**, so a
  warm invocation pays neither the TCP handshake nor the `GetSecretValue`
  round-trip. Both proxied exemplars do exactly this.
- **Attach a pool `error` handler. Always.** An `error` on an *idle* client is
  emitted as an unhandled event and takes the Lambda down with it — mri-gov-ap
  documents this at the seam. vrc-idp goes further and nulls its cached pool
  from the handler so the next invocation rebuilds rather than reusing a
  poisoned one.
- **Set both timeouts, and set them below the handler's own budget.**
  `connectionTimeoutMillis` 5s and `idleTimeoutMillis` 30–60s across the
  exemplars; blueprint-checker's 30s idle timeout is annotated "shorter than
  Lambda freeze timeout", and its `allowExitOnIdle: true` lets the runtime
  freeze without a dangling timer holding it open.
- **Single-flight the pool construction.** A cold start that takes two
  concurrent requests must not build two pools; blueprint-checker caches the
  in-flight promise and clears it on failure so a transient secret fetch does
  not poison the cache permanently.
- **Migrations connect to the cluster writer endpoint, not the proxy.**
  blueprint-checker's migrate Lambda takes `DB_HOST =
  cluster.clusterEndpoint.hostname` while every API Lambda takes the proxy
  endpoint. DDL and advisory locks want a real session, not a multiplexed one.
- **Multi-tenant work caches one pool per tenant secret, not one pool per
  process.** mri-gov-ap keys its pool cache on the Secrets Manager secret name
  (`mri-<tenant>-erp-db`) and stores the *promise*, deleting the entry on
  rejection so a failed build retries.

**Long-lived compute is the opposite default: no proxy, framework pool,
sized to the instance.** A container holds one pool for its whole life, so the
multiplication problem does not exist and the proxy hop is latency for
nothing. Our container exemplars all take the framework default or a small
explicit cap — `min: 0, max: 10` with a 5s acquire timeout (main-records'
Knex on Fargate), `max: 10` explicitly annotated "sized for t4g.micro"
(curriculum-management), SQLAlchemy's default `QueuePool` untuned but with
`pool_pre_ping=True` (pod-staffing-planner). Sizing follows the instance's
connection budget, not a habit; `pool_pre_ping` is the cheap guard against a
stale-connection error on the first query after an idle stretch, and it is the
one setting worth adding to an otherwise-default engine.

**The escape hatch, when it fits: RDS Data API instead of a pool.** meeting-crm
runs Aurora Serverless v2 with `enableDataApi: true` and reaches it over HTTPS
via `drizzle-orm/aws-data-api/pg` — no pool, no VPC attachment, no cold-start
ENI cost, and no pool config to get wrong. Choose this when the workload is
Lambda-only, latency-tolerant, and keeping handlers out of the VPC is worth
more than SQL-session features (Data API has no session state: no
`SET`-and-reuse, no cursors, no interactive transactions across calls).

**Aurora Serverless v2 floors above zero in any environment something gates
on.** The pool decision and the ACU floor are one decision — see the scar
below. Our clusters run 0.5–4 ACU non-prod and 2–16 prod (blueprint-checker);
0 is not a floor we ship to anything a pipeline depends on.

## Exemplars

- [vrc-idp](../../exemplars/vrc-idp/profile.md) — the canonical Lambda→Proxy
  wiring: `pg.Pool({ max: 1 })` with the reason in the comment, module-cached
  pool + Secrets Manager password, error handler that invalidates the cache,
  proxy with `requireTLS` and a 30-minute `idleClientTimeout`.
- [blueprint-checker](../../exemplars/blueprint-checker/profile.md) — the most
  thoroughly tuned pool we have: `min: 0`, env-overridable `max`,
  `allowExitOnIdle`, single-flight init, a connect probe, an opt-in unref'd
  pool-stats monitor, SIGTERM drain, and migrations pointed at the cluster
  endpoint while the API lambdas use the proxy.
- [mri-gov-ap](../../exemplars/mri-gov-ap/profile.md) — Lambda onto Aurora
  Serverless v2 with *no* proxy: `max: 2`, a 20s connect timeout, retry-once
  on connection-level failures only, and a per-tenant pool cache. Read the
  connect-retry comment before choosing the no-proxy route; it is a scar, not
  a template.
- [meeting-crm](../../exemplars/meeting-crm/profile.md) — the Data API
  alternative, plus a cautionary detail: an RDS Proxy *is* provisioned in the
  database stack and no handler ever uses it (it survives only as a
  CloudFormation output). Provisioned-but-unused always-on infrastructure in a
  cost-driven serverless build.
- [main-records](../../exemplars/main-records/profile.md) — proxy in front of
  *containers* (ECS Fargate + Knex `min: 0 / max: 10`, 5s acquire timeout).
  Note the demo posture in its proxy config (`requireTLS: false`,
  `debugLogging: true`) — do not copy those two into production.
- [curriculum-management](../../exemplars/curriculum-management/profile.md)
  (self-managed Postgres on one EC2 t4g.micro) and
  [pod-staffing-planner](../../exemplars/pod-staffing-planner/profile.md)
  (SQLAlchemy async on AKS — the pooling shape transfers even though the
  platform is Azure, not RDS) — the long-lived-container baseline: a small
  explicit cap sized to the instance, or the framework default plus
  `pool_pre_ping`.
- [genai-cdk-claude](../../exemplars/genai-cdk-claude/profile.md) — the
  counter-example the first Gotcha is about: `mysql.createPool({
  connectionLimit: 10 })` inside a Lambda with no proxy in front of it. Cited
  as arithmetic to avoid, not as a template.

Do **not** cite for pooling:
[service-delivery-platform-terraform](../../exemplars/service-delivery-platform-terraform/profile.md)
(single multi-AZ instance, no proxy anywhere),
[service-delivery-platform-backend](../../exemplars/service-delivery-platform-backend/profile.md)
(a bare `create_engine(...)` on SQLAlchemy's default pool — its profile says so
explicitly), or [chancedrepos](../../exemplars/chancedrepos/profile.md) (no
pool config, no persistent PDO — if pooling exists there it is below the repo).

## Gotchas

- **A 0-ACU Aurora Serverless v2 floor silently disables whatever depends on
  it.** mri-gov-ap's dev cluster auto-paused after 5 minutes idle; the first
  query then waited on a ~10–15s resume and blew the connect timeout. Because
  the caller treated a thrown lookup as "check skipped", a sleeping database
  turned into `validation_unavailable` holds on 2 of 5 real invoices in the
  7/24 Danville batch. The fix was two-part — a 20s connect timeout plus one
  retry after 3s on connection-level errors only (`ECONNRESET`, `ETIMEDOUT`,
  `ECONNREFUSED`, `57P03 cannot_connect_now`, "connection terminated") — and
  the deeper lesson is that a fail-closed gate upstream converts a pool
  timeout into a business outcome. Query-level errors are not retried.
- **Naming the proxy makes the subnet group unreplaceable.** vrc-idp pinned
  Aurora and the proxy to `privateSubnets.slice(0, 2)` because adding a third
  private subnet (for GPU placement in a new AZ) would have re-created the
  DBSubnetGroup, which forces replacement of the *named* proxy — and
  CloudFormation refuses to replace named resources. If you set `dbProxyName`,
  pin `vpcSubnets` explicitly and never let CDK auto-pick.
- **Pool-per-execution-environment is the failure nobody models.** A `max: 10`
  pool in a Lambda at 100 concurrency is a 1000-connection ask.
  [genai-cdk-claude](../../exemplars/genai-cdk-claude/profile.md) ships
  `mysql.createPool({ connectionLimit: 10 })` in a Lambda with no proxy in
  front of it (its Aurora MySQL is a provisioned instance) — the arithmetic to avoid, and
  the reason `max: 1` behind a proxy is the default here. If concurrency is
  genuinely unbounded, `reservedConcurrentExecutions` is the other half of the
  cap (vrc-idp sets 1–10 per function).
- **`allowExitOnIdle` and unref'd timers, or the runtime never freezes.** Any
  interval you start next to the pool (stats logging, health checks) keeps the
  event loop alive and turns freeze into billed time. blueprint-checker
  `unref`s its monitor and defaults the interval to 0 (disabled) precisely so
  it cannot surprise anyone with log volume either.
- **`ssl: { rejectUnauthorized: false }` appears in every one of our proxied
  clients.** It works, and it is not verification. Ship the RDS CA bundle and
  verify where the threat model warrants it; do not inherit this line without
  noticing you inherited it.
- **Data API is not a drop-in for a pool.** No session state, no interactive
  multi-statement transactions, different error surface, and per-call HTTP
  latency. Deciding for it later than the schema layer is a rewrite of every
  query site — meeting-crm made it a mandatory access path in CLAUDE.md for
  exactly that reason.
- **Proxy plus a big in-process pool is not additive safety.** The proxy
  multiplexes; the local pool still holds client-side sockets and its own
  queue. blueprint-checker's `max: 10` behind a proxy and vrc-idp's `max: 1`
  behind one are a real divergence in the org — treat 1 as the default and a
  higher cap as a decision that needs its own reason recorded.

## References

- [Using Amazon RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html)
  — pinning, multiplexing, and which statements pin a session to a backend
  connection.
- [Using RDS Proxy with AWS Lambda](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html#rds-proxy-connecting-lambda)
- [Aurora Serverless v2 capacity](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html)
  — ACU floors, scaling behavior, and auto-pause.
- [Using the RDS Data API](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html)
  — supported engines and the documented limitations.
- [node-postgres pooling](https://node-postgres.com/features/pooling) ·
  [SQLAlchemy connection pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html)
  — the knobs the exemplars above are setting.