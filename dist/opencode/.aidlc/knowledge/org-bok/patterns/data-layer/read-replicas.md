---
status: draft
reviewed: 2026-07-31
owner: p.lysanets
---

# Read Replicas — when reads leave the writer, and why ours mostly don't

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

You are deciding whether any read traffic goes somewhere other than the
writer: an Aurora reader instance behind the cluster reader endpoint, an
ORM-level read/write split, a replica for BI/reporting or ops inspection, or
a cross-region copy.

In scope: Aurora reader instances and the reader endpoint; application-level
read routing (ORM replica config, host arrays); read-only operational
surfaces; the multi-AZ-standby-versus-replica distinction; cross-region
replication for DR.

Out of scope: who holds the connections on the way to whichever endpoint you
pick — that is [data-layer/connection-pooling](connection-pooling.md), this
page's sibling. Per-tenant data boundaries are
[multi-tenancy/tenant-data-partitioning](../multi-tenancy/tenant-data-partitioning.md).
Caching in front of the database and DynamoDB's own replication (global
tables, DAX) are separate decisions with no page yet — check the
[INDEX](../INDEX.md).

## Our approach

**The default is no read replica: one writer instance, all traffic —
reads and writes — to the writer endpoint (or the proxy in front of it),
with read headroom bought vertically through the Aurora Serverless v2 ACU
range.** Every Aurora cluster in our CDK exemplars ships exactly
`writer: rds.ClusterInstance.serverlessV2('writer')` and no `readers`:
vrc-idp, blueprint-checker, meeting-crm, main-records, and mri-gov-ap (one
cluster *per tenant*, and still writer-only). This is a decision, not an
omission — our workloads are bursty and low-idle, and a second `db.serverless`
instance doubles the ACU floor you pay while idle for throughput none of these
systems has needed.

The defaults we ship:

- **Scale up before you scale out.** The knob is the ACU ceiling
  (blueprint-checker runs 0.5–4 non-prod, 2–16 prod), and the watchpoint is
  vrc-idp's `aurora-at-max-capacity` alarm on `ServerlessDatabaseCapacity` —
  its own description says the org's move when it fires sustained: "Increase
  serverlessV2MaxCapacity". A reader instance enters the conversation only
  after the ceiling conversation has happened.
- **When a reader exists, it exists for availability, not throughput.**
  plg-opinion-tool is our one cluster with a reader, and the comment states
  the reason: "writer in AZ[0] (2a), reader in AZ[1] (2b) => multi-AZ
  (RESILIENCY-08)" — a failover target in the second AZ, not a read-scaling
  tier. Application Lambdas and the migration runner both take the writer
  endpoint; nothing in the request path reads from the replica.
- **Anything wired to the reader endpoint is read-only by construction, not
  by convention.** plg-opinion-tool's one reader-endpoint consumer is a
  gated-off ops Lambda (`enable_debug_reader`, default false) that stacks
  three guarantees: the reader endpoint itself ("writes rejected by the
  replica" at the engine level), `BEGIN TRANSACTION READ ONLY` in the
  session, and a fixed command set validated against the live catalog — no
  arbitrary SQL, no API Gateway route, IAM invoke only. Copy that stack, not
  just the endpoint.
- **In Terraform, make the writer/reader ordering explicit.** Which
  `aws_rds_cluster_instance` becomes the writer is creation order, not a
  declared role — plg-opinion-tool pins it with `depends_on =
  [aws_rds_cluster_instance.writer]` on the reader so a fresh apply cannot
  promote the wrong instance.
- **No application-level read/write splitting.** No exemplar configures
  replica routing in any ORM we run — Drizzle, Knex, SQLAlchemy, TypeORM,
  Laravel's read/write host arrays — every one points at a single host.
  chancedrepos' and service-delivery-platform-backend's profiles both record
  the absence explicitly. Introducing ORM read routing is a real divergence
  from the org default: record the reason as a documented exception per the
  precedence header.
- **Cross-region is DR, not read scaling.** service-delivery-platform-terraform
  replicates *automated backups* to a second region
  (`aws_db_instance_automated_backups_replication` under a dedicated
  `aws.replica` provider alias, with its own KMS key in the backup region).
  Nothing serves reads from that region; the provider alias's name is the
  only "replica" in the stack.
- **When reads genuinely outgrow the writer, our precedent is to move the
  workload, not mirror it.** land-coverage migrated Aurora → DynamoDB
  single-table (~90% cost cut); meeting-crm splits time-series events into
  DynamoDB beside Aurora; main-records keeps search and vectors inside the
  same Postgres (tsvector, pgvector) sized within one instance. The org
  reaches for a different data layer or in-database capability before it
  reaches for a replica fleet.

## Exemplars

- [plg-opinion-tool](../../exemplars/plg-opinion-tool/profile.md) — the one
  real reader: writer in AZ-a, reader in AZ-b as a multi-AZ failover pair
  (`infra/modules/data/main.tf`), `reader_endpoint` exported, and its sole
  consumer a default-off debug Lambda that is read-only by construction
  (reader endpoint + `READ ONLY` transaction + fixed command set,
  `infra/modules/compute/debug_reader.tf`). App Lambdas take the writer
  endpoint.
- [vrc-idp](../../exemplars/vrc-idp/profile.md) — writer-only Aurora
  Serverless v2 (0.5–4 ACU) with the `aurora-at-max-capacity` CloudWatch
  alarm — the vertical-scaling watchpoint this page's first default depends
  on.
- [blueprint-checker](../../exemplars/blueprint-checker/profile.md) —
  writer-only with the org's widest ACU range (2–16 prod): read headroom
  bought vertically on the cluster nobody wanted to shard.
- [meeting-crm](../../exemplars/meeting-crm/profile.md) and
  [main-records](../../exemplars/main-records/profile.md) — writer-only
  clusters; meeting-crm reaches its writer over the RDS Data API and offloads
  time-series to DynamoDB, main-records sits behind RDS Proxy and keeps
  search/vector reads inside the same Postgres (tsvector + pgvector) rather
  than adding read infrastructure.
- [mri-gov-ap](../../exemplars/mri-gov-ap/profile.md) — the strongest
  writer-only signal: a cluster *per municipality tenant* (max 2 ACU each),
  and not one of them carries a reader.
- [service-delivery-platform-terraform](../../exemplars/service-delivery-platform-terraform/profile.md)
  — the DR-not-replica exemplar: a single multi-AZ RDS instance
  (`multi_az = true`) plus cross-region automated-backup replication. Its own
  profile says it: DR, not a serving replica.
- [land-coverage](../../exemplars/land-coverage/profile.md) — the
  move-the-workload precedent: Aurora → DynamoDB single-table when the
  relational cluster became the wrong cost/shape, with both generations still
  visible in the repo.

Do **not** cite for replica routing:
[chancedrepos](../../exemplars/chancedrepos/profile.md) (its profile records
no read/write host arrays, no sticky config — if replicas exist there they
live below the repo),
[service-delivery-platform-backend](../../exemplars/service-delivery-platform-backend/profile.md)
(a single `create_engine(...)`, no multi-engine routing — its profile says so
explicitly), or [genai-cdk-claude](../../exemplars/genai-cdk-claude/profile.md)
(its MySQL runs as a single provisioned instance restored from a snapshot —
`DatabaseInstanceFromSnapshot` — with no reader anywhere).

## Gotchas

- **A multi-AZ standby is not a read replica.** RDS `multi_az = true`
  (service-delivery-platform-terraform's default) provisions a synchronous
  standby you cannot read from; pointing a reporting job at it is not a
  thing, and believing otherwise is the most common way this decision gets
  made wrong on day one. If you need readable capacity on Aurora, that is a
  reader *instance*; on RDS-classic it is a separate read-replica resource
  with its own endpoint and asynchronous lag.
- **The reader endpoint is eventually consistent with the writer.** Aurora
  replica lag is typically milliseconds and occasionally not; a
  read-after-write that round-trips through the reader endpoint can miss the
  row it just wrote. This is the standing reason our request paths stay on
  the writer: none of our systems has a read tier whose staleness anyone has
  budgeted. If you route reads to a replica, decide per query which ones
  tolerate lag — not per service.
- **RDS Proxy does not split reads for you.** Every proxy we ship (vrc-idp,
  blueprint-checker, main-records, and meeting-crm's provisioned-but-unused
  one) exposes only its default endpoint, which targets the writer. Putting a
  proxy in front of a cluster with a reader changes nothing about where reads
  land until you provision explicit proxy *reader endpoints* — a resource
  none of our stacks defines.
- **A second `db.serverless` instance doubles the idle floor.** Aurora
  Serverless v2 readers scale with their own capacity; at plg-opinion-tool's
  pinned-provider 0.5 ACU minimum, the AZ-b reader means the cluster's
  standing cost is 1.0 ACU before a single request arrives. That is a fine
  price for a failover target on privileged legal data; it is a bad price
  for a read tier nobody routes to. Know which one you are buying.
- **Terraform's writer/reader roles are creation-order, not declaration.**
  Two `aws_rds_cluster_instance` resources with no dependency edge race on
  first apply, and Terraform's graph is free to create the "reader" first —
  which makes it the writer. plg-opinion-tool's `depends_on` on the reader is
  the fix; carry it.
- **The provider alias named `replica` is about backups.** In
  service-delivery-platform-terraform, `provider = aws.replica` marks
  cross-account, cross-region *backup* replication resources. Grepping for
  "replica" and concluding the platform has a read replica is exactly the
  misread its profile warns against — read the resource type, not the alias.

## References

- [Amazon Aurora connection management](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html)
  — cluster endpoint vs reader endpoint vs instance endpoints.
- [Replication with Amazon Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Replication.html)
  — Aurora replicas, replica lag, and failover priority.
- [Aurora Serverless v2 and reader instances](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html)
  — capacity behavior of serverless readers in a mixed cluster.
- [Multi-AZ deployments for Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)
  — why the standby is not readable (and Multi-AZ DB *clusters*, which are).
- [RDS Proxy endpoints](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-endpoints.html)
  — the default endpoint targets the writer; reader endpoints are explicit.
- [Replicating automated backups to another Region](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReplicateBackups.html)
  — the DR mechanism service-delivery-platform-terraform uses.