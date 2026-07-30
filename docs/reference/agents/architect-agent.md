# aidlc-architect-agent -- Technical Reference

## Identity

| Field | Value |
|-------|-------|
| Name | aidlc-architect-agent |
| Tier | **judgment** |
| Allowed Claude Code Tools | Read, Edit, Write, Glob, Grep, AskUserQuestion |
| Disallowed Claude Code Tools | Task |

The aidlc-architect-agent is the central design authority, handling the most
architecturally complex reasoning tasks across three phases of the lifecycle.
It carries the `judgment` tier alongside the other seven high-judgment
agents — the three `templated` agents (delivery, pipeline-deploy, operations)
produce dominantly templated planning, CI/CD, and runbook output.

---

## Stage Ownership

### Lead Stages

| Stage | Name | What This Agent Does |
|-------|------|----------------------|
| feasibility | Feasibility and Constraint Analysis | Assesses technical feasibility, identifies integration constraints, produces constraint registers and risk assessments |
| application-design | Application Design | Designs system architecture: bounded contexts, component interfaces, architectural style selection, ADRs |
| units-generation | Units Generation | Decomposes application design into implementable Units of Work with boundaries and the dependency DAG. Economic ordering (what ships first, why) is the delivery-planning stage's decision |
| functional-design | Functional Design | Creates detailed domain models, sequence diagrams, API specifications, data models, and state transitions |
| nfr-requirements | NFR Requirements | Enumerates non-functional requirements with measurable targets for performance, security, scalability, reliability |
| nfr-design | NFR Design | Designs technical approaches for NFRs: caching, circuit breakers, resilience, security architecture, observability |

### Support Stages

| Stage | Name | What This Agent Contributes |
|-------|------|-----------------------------|
| intent-capture | Intent Capture and Framing | Provides technical context and feasibility perspective on the captured intent |
| reverse-engineering | Reverse Engineering (dispatched final pipeline link) | Receives code scan results from aidlc-developer-agent and synthesizes into a coherent architectural model |
| delivery-planning | Delivery Planning | Validates build order against architecture dependencies and component coupling |

---

## Collaboration Patterns

### Receives From

| Source | Artifacts |
|--------|-----------|
| aidlc-product-agent | Requirements, user stories, intent backlog |
| aidlc-developer-agent | Code scan results for reverse engineering synthesis |

### Hands Off To

| Target | Artifacts |
|--------|-----------|
| aidlc-developer-agent | Unit of work specifications, API contracts, design patterns |
| aidlc-quality-agent | Test boundaries, NFR targets for validation |
| aidlc-aws-platform-agent | Infrastructure requirements derived from application design |

---

## Knowledge Sources

### Methodology (Tier 1)

Path: `.claude/knowledge/aidlc-architect-agent/`

| File | Content |
|------|---------|
| adr-template.md | Architecture Decision Record template and examples |
| architecture-guide.md | Architecture methodology and design process |
| architecture-patterns.md | Architectural style patterns (microservices, modular monolith, event-driven, serverless) |
| ddd-patterns.md | Domain-driven design patterns (bounded contexts, aggregates, entities, value objects) |
| nfr-design-guide.md | Non-functional requirements design methodology |
| nfr-design-patterns.md | Technical patterns for NFR implementation (caching, circuit breakers, resilience) |

The agent also loads one Org BoK cross-cutting guide as standing knowledge:
`.claude/knowledge/org-bok/guides/architecture-principles.md` — org-wide
architecture defaults that apply even when precedent-research was skipped,
subject to the precedence rule the guide states (brownfield: locally
discovered affirmed practices win).

It also reads the Org BoK patterns index,
`.claude/knowledge/org-bok/patterns/INDEX.md`, and opens only the pattern
files the current task matches — the index, never the whole directory. A
`blessed` pattern is the org-wide default for the decision it covers; a
`draft` pattern is advisory. An affirmed `team.md`/`project.md` rule naming
the pattern overrides it for that space.

### Team (Tier 2)

Path: `aidlc/knowledge/aidlc-architect-agent/` (the space-level knowledge dir; user-managed)

A space-level directory the team creates when it has content (the engine ships `aidlc/knowledge/` empty). Populated by the team with project-specific
architecture context such as existing architecture diagrams, technology radar,
approved patterns, or constraints registers.

---

## Cross-References

- [Agent Reference Overview](README.md)
- [Agent Guide: aidlc-architect-agent](../../guide/agents/architect-agent.md)
- [Stage Documentation](../04-stages/)
- Source: [`dist/claude/.claude/agents/aidlc-architect-agent.md`](../../../dist/claude/.claude/agents/aidlc-architect-agent.md)
