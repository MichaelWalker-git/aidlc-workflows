---
status: draft
reviewed: 2026-07-31
owner: p.lysanets
---

# JWT Tenant Isolation — the claims path from token to tenant-scoped query

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

You are building or auditing a multi-tenant service where callers
authenticate with a JWT — Cognito or Auth0 — and every request must be scoped
to the caller's tenant. This page is the identity half of multi-tenancy:
where the tenant lives in the token, how the token is verified, how the
tenant reaches the query, and what a cross-tenant attempt gets back.

In scope: Cognito custom attributes and Auth0 organization claims; API
Gateway authorizers and framework auth seams; the claims-extraction helper
every handler shares; parent/child org hierarchies; the 404-vs-403 response
shape; tenant identity on non-HTTP seams (S3 events, EventBridge).

Out of scope: how the data is physically separated once you hold a trusted
tenant id — that is [tenant-data-partitioning](tenant-data-partitioning.md);
creating tenants — [tenant-onboarding](tenant-onboarding.md). Opaque-token
brand separation is not this pattern either: chancedrepos runs Laravel
Sanctum with a per-brand CORS allowlist, and its profile says plainly not to
cite it for JWT tenant isolation.

## Our approach

**The tenant identifier is a server-set claim in the token — never a
client-supplied parameter.** Every JWT-tenant exemplar stamps the tenant into
the token at user-creation time and derives authority from the claim alone:
`custom:tenant_id` (tennyson-contract-comparison), `custom:tenantId`
(idp-portal), `custom:tenant` (mri-gov-ap, a comma-separated allowed set for
multi-town users), and Auth0's `organizations` array claim
(service-delivery-platform-backend). A client-supplied `?tenant=` may narrow
but never widen: mri-gov-ap's `resolveTenant` accepts a requested tenant only
if it is a *member* of the claim's set and throws otherwise — the module
header states the rule: a client-supplied tenant "is NEVER trusted as
authority".

The defaults we ship:

- **Create the Cognito tenant attribute `mutable: false` and stamp it
  server-side only.** Both mri-gov-ap and idp-portal declare it immutable;
  mri-gov-ap's CDK comment carries the policy — "a user's town doesn't change
  — reassigning means a new user." Self-signup paths stamp it from a
  post-confirmation trigger, admin paths at admin-create time; no path lets
  the client choose it.
- **Exclude tenancy and role attributes from the app client's
  `writeAttributes`.** Cognito's default lets a signed-in user rewrite every
  mutable attribute. tennyson-contract-comparison's hardening comment is the
  scar: `custom:tenant_id` and `custom:user_role` are "deliberately EXCLUDED
  so a signed-in user cannot change their own tenant (jump orgs) or
  self-escalate their role" (HOR-2571).
- **Verify the full checklist before trusting any claim: JWKS key by `kid`,
  signature, `aud`, `iss`, `exp`.** service-delivery-platform-backend's
  `VerifyToken` is the reference shape — `PyJWKClient` against the tenant's
  `.well-known/jwks.json`, then `jwt.decode(..., algorithms, audience,
  issuer)`. idp-portal's authorizer fetches the Cognito JWKS, verifies, then
  checks `claims.aud` against the app client id explicitly.
- **One claims-extraction helper, used at every handler seam.**
  tennyson-contract-comparison's `extractClaims`/`validateAuth` pair reads
  `custom:tenant_id` from `event.requestContext.authorizer.claims` and every
  one of its 36 API handlers calls one of the two — its security audit's
  isolation argument rests on that single seam ("tenantId cannot be forged").
  service-delivery-platform-backend does the same with a FastAPI dependency:
  every router takes `AuthenticatedUserDependency` and passes the resulting
  `AuthUser` into every service call. A tenant check per handler is a bug
  farm; a tenant check in one reviewable place is an audit.
- **Parent/child org hierarchies expand server-side, through one seam.**
  service-delivery-platform-backend maps the JWT's Auth0 org ids to rows and
  expands to descendants with a recursive CTE over `parent_id` — but only
  when the caller holds the `_deep` variant of the permission
  (`signals:read` vs `signals:read_deep`). `get_user_org_ids(auth_user,
  permission)` is the whole seam; every data query takes the resulting
  `org_ids` list. The token carries membership; the database owns the tree.
- **Cross-tenant reads answer "not found", not "forbidden".** A response must
  never confirm that another tenant's resource exists.
  translation-indigenous-languages codifies it as a standing rule (BR-S2
  404-masking over deny-by-default domain predicates: invisible → 404,
  visible-but-forbidden action → 403), and tennyson-contract-comparison
  applies it at the presign seam — "the caller must not be able to tell the
  difference, or this becomes an existence oracle."
- **Non-JWT seams name the tenant explicitly and drop work when it is
  absent.** Batch tenancy is parsed from the server-written S3 key
  (mri-gov-ap's `tenantFromKey` regex over `tenant/<muni>/inbound/`; objects
  outside the convention are skipped), and event tenancy is a required detail
  field — mri-gov-ap's writeback consumer ignores any approval event that
  does not name its municipality.

## Exemplars

- [service-delivery-platform-backend](../../exemplars/service-delivery-platform-backend/profile.md)
  — the fullest claims path we have: Auth0 `organizations` claim → `AuthUser`
  with PBAC permissions (`_deep` variants for child orgs) →
  `get_user_org_ids` → recursive-CTE expansion → `org_id.in_(org_ids)`
  filters. Read it with its Gotchas below — the same repo shows the
  fail-open edges of the shape.
- [tennyson-contract-comparison](../../exemplars/tennyson-contract-comparison/profile.md)
  — Cognito claims extraction at every handler seam, the `writeAttributes`
  hardening (HOR-2571), and the HOR-2618 fix cluster (server-derived keys,
  strip-not-forbid, existence-oracle suppression) — the best worked example
  of closing a real cross-tenant attack.
- [mri-gov-ap](../../exemplars/mri-gov-ap/profile.md) — `resolveTenant`: the
  claim as an allowed *set*, the client's `?tenant=` only ever a member-check
  against it; immutable `custom:tenant` (SECURITY-08); tenant identity on
  batch and event seams.
- [idp-portal](../../exemplars/idp-portal/profile.md) — a shared API Gateway
  `TokenAuthorizer` building a per-request IAM policy from a typed
  role→routes record and forwarding `tenantId`/`userRole` via authorizer
  context. Cite the wiring, not the whole posture: the same repo appears
  twice under Gotchas.
- [curriculum-management](../../exemplars/curriculum-management/profile.md)
  — tenant (`collegeId`) and roles carried directly in a `@fastify/jwt`
  payload, with `system_admin`/`platform_admin` as the explicit cross-tenant
  escape roles.
- [translation-indigenous-languages](../../exemplars/translation-indigenous-languages/profile.md)
  — the 404-masking rule and deny-by-default visibility predicates as pure
  domain functions. Note its "tenants" are three *roles* with per-user
  isolation, not orgs — cite it for the enforcement shape, not for org
  tenancy.

Do **not** cite for JWT tenancy:
[chancedrepos](../../exemplars/chancedrepos/profile.md) (Sanctum opaque
tokens; brand separation via CORS allowlist — its own profile says so).

## Gotchas

- **Decode-then-verify.** idp-portal's authorizer reads the role from an
  *unverified* decode before verifying the signature, and its route-policy
  loop keeps using the unverified claims; its ~30 data handlers then
  re-decode the raw header with no signature check at all, trusting the
  authorizer upstream. It works until a handler is invoked off the gateway
  path. Extract claims from the verified result, once.
- **A missing claim that defaults to a grant.**
  service-delivery-platform-backend's `payload.get("permissions",
  ["orgs:read", "orgs:read_deep", "orgs:create"])` silently hands three
  permissions to any token whose Action failed to inject the claim.
  Deny-by-default means the absent claim is a denial, never a fallback —
  translation-indigenous-languages' `roleFromGroups` (unknown or missing
  group → 401) is the shape to copy.
- **An empty scoping list that means "no filter".** The same backend's
  repositories guard with `if org_ids:` — an empty list skips tenant
  filtering entirely, so fail-closed lives one layer up in the service. If
  the repo layer takes a list, decide explicitly what the empty list means,
  and prefer making it a refusal.
- **Fetch-then-check leaks existence.** Fetching by id and *then* checking
  org access returns a permission error for a real cross-tenant id and
  not-found for a fake one — service-delivery-platform-backend's
  `get_signal_by_id` is a live existence oracle (and its sibling
  `assign_agent_to_ticket` skips the org check entirely: one endpoint missed
  is the whole point of the one-seam rule).
- **Immutable claims bite exactly once — at reassignment.** mri-gov-ap's
  runbook records that converting a single-town user to multi-town is
  impossible in place (PR #80 attempted a pool replacement; #81 reverted),
  and that the AWS CLI splits a comma-separated claim value unless you use
  `--cli-input-json`.
- **The HTTP API JWT authorizer stringifies `cognito:groups`.** On access
  tokens the array arrives as `"[ADMIN]"` — translation-indigenous-languages
  strips the brackets before splitting. Test the claim shape from the token
  type you actually use.
- **Enforcement helpers that never enforce.** curriculum-management registers
  a `collegeScope` decorator and a `requireCollege` preHandler — both unused;
  the real isolation is a hand-written `eq(table.collegeId, ...)` in every
  handler. idp-portal's company permission checks return booleans that every
  call site ignores. A dead abstraction next to copy-paste discipline is
  worse than either alone: reviewers see the helper and assume it runs.
- **A role check is not a tenant check.** idp-portal's route authorizer
  matches roles only, and its tenant-admin handlers take `params.tenantId ||
  authorizer.tenantId` without comparing tenants — so a TENANT_ADMIN can
  create or disable users in another tenant. Compose both checks at the same
  seam, and test the cross-tenant case per mutating endpoint.

## References

- [Cognito user pool custom attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
  — mutability, the `custom:` prefix, and client read/write permissions.
- [Verifying a Cognito JWT](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
- [Auth0 Organizations](https://auth0.com/docs/manage-users/organizations)
  — org membership, invitations, and adding org claims via Actions.
- [API Gateway Lambda authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
  — the authorizer-context mechanism the idp-portal wiring uses.
- [OWASP: Insecure Direct Object References](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
  — the attack class the 404-masking and server-derived-key rules close.