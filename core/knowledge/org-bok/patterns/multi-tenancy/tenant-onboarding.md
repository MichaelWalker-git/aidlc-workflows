---
status: draft
reviewed: 2026-07-31
owner: p.lysanets
---

# Tenant Onboarding — provisioning a tenant without provisioning infrastructure

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

You are designing how a new tenant comes into existence: what gets created
(registry record, identity-provider org, seeded data, per-tenant
infrastructure), by whom (self-signup trigger, admin API, IaC change +
runbook), and what guarantees the flow makes when a step fails.

In scope: the self-serve vs admin-driven vs IaC-driven split, server-side
stamping of tenant identity, idempotent seeding, rollback on partial
failure. Out of scope: how the tenant is identified per request
([jwt-tenant-isolation](jwt-tenant-isolation.md)) and how its data is
separated ([tenant-data-partitioning](tenant-data-partitioning.md)).

## Our approach

**In the pooled model, onboarding is an application flow — a tenant record
plus stamped users plus seeded defaults — and touches no infrastructure.**
service-delivery-platform's Terraform has no tenant axis at all: a new
customer is an app/Auth0 operation, invisible to IaC.
tennyson-contract-comparison mints a tenant in a Cognito post-confirmation
trigger or an admin endpoint; idp-portal creates a "company" record via an
admin route. Only the silo model makes onboarding an IaC change, and then it
is one loop entry plus a runbook (mri-gov-ap).

The defaults we ship:

- **The server mints the tenant id and stamps it — the client contributes
  nothing but profile fields.** tennyson-contract-comparison's
  post-confirmation trigger generates `uuidv4()`, sets `custom:tenant_id`
  and the owner role via `AdminUpdateUserAttributes`, and writes the TENANT
  record; its admin path does the same with a conditional Put
  (`attribute_not_exists`) against duplicate creation and an email-dedup GSI
  check in front.
- **Define the role ladder in the creation path, not just the read path.**
  Who may create whom is its own matrix: tennyson-contract-comparison lets
  SuperAdmin create tenant owners and tenant owners create their own
  members — and deliberately forbids SuperAdmin from creating a member
  directly ("it has no tenant of its own"). idp-portal's ladder (SUPER_ADMIN
  may create anyone; only SYSTEM_ADMIN+ may create TENANT_ADMIN) is the same
  idea. Absent this, role escalation hides in the create-user endpoint.
- **Seed per-tenant defaults idempotently, and never let seeding fail the
  signup.** tennyson-contract-comparison copies its default extraction
  prompts into the new tenant's own partition (tenant data, not shared
  rows), guards with a COUNT query so re-runs are no-ops, ships a backfill
  script for pre-existing tenants, and swallows seed failures in the
  post-confirmation trigger — "a Post-Confirmation trigger that throws would
  fail the user's Cognito sign-up." idp-portal seeds sample files by async
  Lambda invoke, off the request path.
- **Roll back external state when the local write fails.**
  tennyson-contract-comparison deletes the just-created Cognito user when
  the tenant Put fails; without that, a half-onboarded identity can sign in
  to nothing. Multi-system onboarding
  (service-delivery-platform: DB row → Auth0 org → Hunters credentials →
  Zendesk org, each its own admin call) instead makes every step separately
  re-runnable and detects duplicates per step (`auth0_org_already_being_used`,
  adopt-existing overrides) — a saga by convention rather than transaction.
- **Cross-system identity is correlated by your id, in their system.**
  service-delivery-platform creates the Zendesk org with
  `external_id = <internal org UUID>` and stores each provider's id
  (`auth0_id`, `hunters_id`, `zendesk_id`) as columns on the org row — the
  org table is the registry of record, and either side can find the other.
- **Silo onboarding is one loop entry plus a runbook — and the runbook ends
  with verification.** mri-gov-ap's `ERP_TENANTS` array drives one CDK stack
  per town; the tenant registry (`TENANTS` in shared-types) is the second
  entry; then `docs/TENANT-ONBOARDING.md` walks reference-data load, user
  creation (`create-tenant-users.sh`, idempotent), approval-matrix setup,
  and an end-to-end checklist. The runbook's opening line is the org's bar
  for runbooks: "Every step below was executed for Sullivan in dev on
  2026-07-27; the gotchas are the ones that actually bit, not hypotheticals."
- **First-admin bootstrap is provisioned, never self-serve.**
  translation-indigenous-languages seeds the first ADMIN via an idempotent
  custom resource (`ignoreErrorCodesMatching: "UsernameExistsException"`,
  never deleted on teardown) and hard-codes that self-signup can only yield
  USER or TRANSLATOR — "ADMIN is never self-serve." idp-portal bootstraps
  SUPER_ADMIN the same way (CloudFormation custom resource).

## Exemplars

- [tennyson-contract-comparison](../../exemplars/tennyson-contract-comparison/profile.md)
  — the fullest pooled onboarding: self-signup trigger + admin path, role
  ladder in the create path, idempotent prompt seeding with backfill,
  Cognito rollback on DB failure.
- [mri-gov-ap](../../exemplars/mri-gov-ap/profile.md) — silo onboarding:
  `ERP_TENANTS` loop + `TENANTS` registry + the executed-not-hypothetical
  runbook; per-tenant Cognito user script.
- [service-delivery-platform-backend](../../exemplars/service-delivery-platform-backend/profile.md)
  — multi-system provisioning as separately re-runnable admin steps with
  per-step duplicate detection and `external_id` correlation; Auth0
  invitation flow for user onboarding, with the one deliberate exemption
  (`POST /api/users/` skips the exists-check so first login can create the
  profile).
- [service-delivery-platform-terraform](../../exemplars/service-delivery-platform-terraform/profile.md)
  — the negative proof: no tenant list, no per-tenant `for_each`, no Auth0
  provider; a new tenant is not a Terraform change.
- [idp-portal](../../exemplars/idp-portal/profile.md) — admin-created tenant
  ("company") records, custom-resource SUPER_ADMIN bootstrap, async sample
  seeding.
- [translation-indigenous-languages](../../exemplars/translation-indigenous-languages/profile.md)
  — self-signup role assignment from a sign-up-only custom attribute
  (`custom:signupRole`, defaulting to the least-privileged role), admin
  vetting as the activation gate, idempotent first-admin seeding.

## Gotchas

- **A client-supplied timestamp is not an audit record.**
  tennyson-contract-comparison deliberately does *not* copy the
  browser-supplied `custom:terms_accepted_at` onto the tenant record —
  writing it suppressed the consent dialog and left self-signup owners with
  no server-side terms-acceptance record. Anything with legal weight is
  written server-side at the moment of the act.
- **Registry entry ≠ working tenant.** mri-gov-ap: a town added to `TENANTS`
  without its per-tenant secret/cluster throws `ResourceNotFoundException`
  in six services as soon as anyone selects it. And the registry's own
  affordances can hide the miss — its `tenantLabel()` title-cases unknown
  codes, so a typo'd tenant code renders as a plausible town name. Verify
  end-to-end (the runbook's final checklist), and make unknown codes loud.
- **Immutable identity attributes make onboarding decisions permanent.**
  The same immutability that protects `custom:tenant` (see the JWT page)
  means the create-users script is the only chance to get membership right:
  mri-gov-ap could not convert a single-town user to multi-town in place
  (PR #80/#81). Decide single-vs-multi-tenant membership per user at
  creation.
- **Hardcoded fallback tenants serve one tenant's data to another.**
  mri-gov-ap removed both its hardcoded seed-town fallbacks after finding a
  DB read failure was indistinguishable from an unconfigured tenant — and
  the web default meant a misconfigured session silently read one specific
  town's data. No default tenant, anywhere.
- **Placeholder tenants ship.** mri-gov-ap's registry still carries
  `town2: "Town 2 (TBD)"` and the retired pilot town. Harmless-looking
  registry stubs are selectable tenants; prune them or gate them.
- **Seed scripts encode schema generations.** curriculum-management's two
  workflow seed scripts use two different step schemas (`role:` vs
  `approverRoles:`), forcing every approval handler to check both forever.
  When the tenant-template schema evolves, migrate the seeds in the same
  change.
- **Demo affordances in the onboarding path outlive the demo.**
  curriculum-management's seeded users have no password hash and its login
  falls back to passwordless "demo backward compat", plus an unauthenticated
  user-directory endpoint for mock login. Fine for an RFP demo, fatal in
  production — tie demo seeding to an environment flag so it cannot ship.

## References

- [Cognito user pool Lambda triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html)
  — post-confirmation, the seam the self-signup exemplars use.
- [Auth0 Organizations: invitations](https://auth0.com/docs/manage-users/organizations/configure-organizations/invite-members)
- [AWS SaaS Lens: tenant onboarding](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-onboarding.html)
  — the silo/pool framing for what onboarding must provision.
- [The Saga pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/saga-pattern.html)
  — the formal version of the multi-system flow SDP implements by
  convention.
