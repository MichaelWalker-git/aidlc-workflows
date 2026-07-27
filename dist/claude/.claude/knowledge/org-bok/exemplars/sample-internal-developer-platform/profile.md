---
repo_url: https://git.example.com/org/sample-idp
notable_paths:
  - .eslintrc.cjs
  - packages/ui/src/components/ServiceCard.tsx
  - packages/ui/src/tokens/design-tokens.ts
  - infra/terraform/modules/service-baseline/main.tf
---

# Exemplar Profile: Sample Internal Developer Platform

This is the shipped fixture profile. It demonstrates the required shape of an
exemplar profile — every section below must be present and populated in a real
profile. Replace it with your organization's first distilled exemplar (run
`/aidlc-distill` against the reference repo, or author by hand).

When the research agent selects this profile, its sections feed the reference
brief's contract sections directly: Ask/Context and Architecture & Why become
the `## Selected Exemplars & Rationale` and `## Patterns to Follow` material,
the UI-relevant Key Patterns (design tokens, component conventions, copy tone)
become `## UI Directives` phrased as imperatives, and the frontmatter's repo
URL and notable paths become `## Deep-Dive Pointers`. Write each section with
that consumption in mind.

## Ask / Context

An engineering organization of ~40 teams asked for an internal developer
platform: a self-service portal where teams register services, provision
standard infrastructure, and see golden-path scaffolding — replacing a wiki
of runbooks and ticket-driven provisioning. RFP-shaped ask; the buyer cared
most about adoption (developer experience) and auditability.

## Architecture & Why

A modular monolith portal (React + Node.js BFF) over a plugin-based catalog
core, with Terraform modules as the provisioning contract.

- **Portal as modular monolith, not microservices** — one team owned the
  portal; splitting services would have added operational cost without an
  ownership boundary to justify it.
- **Plugin-based catalog core** — each infrastructure capability (databases,
  queues, pipelines) registers as a plugin, so platform teams extend the
  catalog without touching portal code.
- **Terraform modules as the provisioning seam** — the portal never calls
  cloud APIs directly; it renders reviewed module invocations, keeping the
  audit trail in version control.

## Key Patterns

- Golden-path scaffolding templates live beside the catalog plugin that
  provisions them, so a capability and its scaffold version together.
- Every provisioning action produces a pull request, never a direct apply —
  human review is the compliance boundary.
- Design tokens are a single TypeScript module consumed by every UI package;
  no component hardcodes color, spacing, or type values.
- Copy tone: verb-first, no exclamation marks, one idea per sentence.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them with the
session's ambient git credentials when higher fidelity helps (copying the
real lint config, imitating the canonical `ServiceCard` component). If the
repo is unreachable, note "deep dive unavailable" and continue from this
profile — a failed fetch is never a stage failure.
