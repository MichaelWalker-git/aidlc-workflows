---
slug: precedent-research
phase: ideation
execution: CONDITIONAL
condition: Execute when the Org BoK index exists with at least one exemplar profile entry. Skip when the install ships no BoK or the index lists no exemplars (deterministic file check at routing time).
lead_agent: aidlc-research-agent
support_agents: []
mode: inline
produces:
  - reference-brief
consumes:
  - artifact: intent-statement
    required: true
requires_stage:
  - intent-capture
sensors:
  - required-sections
  - upstream-coverage
scopes:
  - enterprise
  - feature
inputs: Intent statement from intent-capture stage; the Org BoK index and matching exemplar profiles
outputs: reference-brief.md (under this stage's record dir, engine-resolved)
---

# Precedent Research

MANDATORY: Follow stage-protocol.md for approval gates, question format, and completion messages.

## Steps

### Step 1: Check Conditions

The routing gate for this stage is deterministic: the engine marks this stage
SKIP at plan-build time when `.claude/knowledge/org-bok/index.md` is
absent or lists no exemplar profile links. If this stage was nonetheless
dispatched on an install without a usable BoK (for example, the BoK was
stripped after the plan was built), confirm the gate yourself:

- `.claude/knowledge/org-bok/index.md` exists
- The index links at least one `exemplars/<slug>/profile.md`

If either check fails, run
`bun .claude/tools/aidlc-orchestrate.ts report --stage precedent-research --result skipped --reason "<reason>"`.
The engine records the skip and advances to the next in-scope stage.

### Step 2: Load Agent Personas

Load aidlc-research-agent persona from `agents/aidlc-research-agent.md` and knowledge from `.claude/knowledge/aidlc-research-agent/`.

### Step 3: Load Prior Context

- Read the intent statement from `<record>/ideation/intent-capture/`
- Extract the ask shape (what kind of thing is being built), the domain, and any stated technology constraints

### Step 4: Select Precedent from the Org BoK

- Read the curated index at `.claude/knowledge/org-bok/index.md`
- Reason over each entry's project-type tags, tech stack, and "use when…" guidance against the captured intent
- Load ONLY the matching exemplar profiles from `.claude/knowledge/org-bok/exemplars/<slug>/profile.md` — never the whole library
- If no entry matches, record that honestly; do not force-fit an exemplar

### Step 5: Optional Deep Dive

When a selected profile's notable file paths would materially improve the brief (a real lint config, a canonical component), you MAY fetch them from the profile's repo URL using the session's ambient git credentials. If the fetch fails or the repo is unreachable, note "deep dive unavailable" and continue from the profile markdown — a failed fetch is never a stage failure.

### Step 6: Write the Reference Brief

Create `<record>/ideation/precedent-research/reference-brief.md`. The brief is
the single statement of precedent downstream agents receive — they never read
the index or raw profiles — so it must stand alone. It carries exactly these
H2 sections:

- `## Selected Exemplars & Rationale` — each selected exemplar and why it matches this intent
- `## Patterns to Follow` — the selected profiles' key patterns, phrased as imperatives for this project, not as history
- `## UI Directives` — concrete, imperative styling instructions (design tokens, spacing and layout conventions, component patterns, copy tone) for the mockup and code-generation stages
- `## Precedence Rule` — stated verbatim: on greenfield work, BoK guidance is the default; on brownfield work, locally discovered and affirmed practices win — consistency with the codebase you are in beats org ideals
- `## Deep-Dive Pointers` — the selected profiles' repo URLs and notable file paths, so downstream agents can fetch real files when fidelity helps

Reference the consumed intent statement explicitly in the rationale.

**When no exemplar matched**, write the honest form instead: replace the first
three sections with a single `## No Matching Precedent` section that names the
index entries considered and why none fit, and explicitly instructs downstream
agents to design from first principles and the org guides rather than force-fit
an exemplar. Keep `## Precedence Rule` — it applies with or without a
precedent. Omit `## Deep-Dive Pointers` rather than padding it.

### Step 7: Completion Handoff

Hand completion to `stage-protocol.md` via
`bun .claude/tools/aidlc-orchestrate.ts report --stage precedent-research --result <outcome>`.
The engine owns all lifecycle transitions and advancement.

### Step 8: Present Completion & Request Approval

Completion emoji: :books:
Review path: `<record>/ideation/precedent-research/`
Standard approval gate (Approve / Request Changes).

## Sensors

This stage's outputs are markdown artefacts under `<record>/ideation/precedent-research/`.

The imported sensors check those outputs:

- **`required-sections`** verifies the output contains the registry default (≥2 H2 headings). Failure mode: missing headings emit `SENSOR_FAILED` with detail at `<record>/.aidlc-sensors/<stage-slug>/required-sections-<iso>.md`.
- **`upstream-coverage`** verifies the output prose references each artefact declared in this stage's `consumes:` frontmatter. Failure mode: missing upstream references emit `SENSOR_FAILED` listing each unreferenced artefact (this stage consumes `intent-statement`).

## Learn

While running this stage, maintain a running log in
`<record>/<phase>/<stage>/memory.md` (create on stage start if absent).
Append entries under four standard headings:

- **Interpretations** — choices made where the stage prose was ambiguous
- **Deviations** — places you intentionally departed from the stage prose, and why
- **Tradeoffs** — alternatives considered and why you picked what you did
- **Open questions** — anything to confirm before next run, or uncertain context

Format each entry with an ISO 8601 timestamp:
`- 2026-05-20T10:14:32Z — <summary>; <context>`

Before the approval gate, read memory.md and surface candidates as a
structured question. For each entry the user keeps, write to the appropriate
harness destination per `stage-protocol.md` §13 — never to this stage file:

- Prescriptive rule → a practice line under the routed heading in
  `aidlc/spaces/<active-space>/memory/project.md` (default) or `team.md` (promoted)
- Verification check → new manifest at `.claude/sensors/aidlc-<id>.md`
  (capability descriptor only — no `applies_to`); add the new id to
  the relevant stage's `sensors: [...]` frontmatter list to wire it

Even when nothing surfaces, still ask the mandatory "Anything to add for next time?" question from stage-protocol.md section 13. Do not infer "Nothing to add." Only after the human answers that question may you proceed to the gate. The memory.md
file stays in the artefact directory as part of the stage's permanent record.

Stage files are immutable framework artefacts — the ritual writes into the
harness, not into this file. Next time this stage runs, the new rules and
sensors load automatically.
