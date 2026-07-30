# Runbook — Implementing the PulseDesk SOW with the customized AIDLC

End-to-end walkthrough: install your fork's dist into a fresh sample project,
run the SOW through the full workflow, and verify the Org BoK functionality at
each gate. Companion files: `sample-project-sow.md` (the intent input) and
`TEST-SCENARIOS.md` (pass criteria; this runbook exercises Scenario A + the
downstream half of D).

## Step 1 — Build and install

```bash
# In the fork
cd ~/WebstormProjects/aidlc-workflows
bun scripts/package.ts && bun scripts/package.ts --check

# Fresh sample project
mkdir -p ~/tmp/pulsedesk && cd ~/tmp/pulsedesk && git init

# Engine + workspace shell (BOTH lines — aidlc/ is a sibling of .claude/)
cp -r ~/WebstormProjects/aidlc-workflows/dist/claude/.claude .
cp -r ~/WebstormProjects/aidlc-workflows/dist/claude/aidlc .

# The SOW as a repo file so intent-capture can read it
cp ~/WebstormProjects/aidlc-workflows/.scratch/org-bok/sample-project-sow.md .

git add -A && git commit -m "chore: install customized aidlc + sow"
```

Pre-flight checks:

```bash
grep -c "profile.md" .claude/knowledge/org-bok/index.md   # ≥ 1 → gate will pass
ls .claude/knowledge/org-bok/guides/                       # 3 guides present
```

## Step 2 — Start and verify the session

```bash
claude
```

In-session: `/aidlc --doctor` — expect green on bun, hooks, settings, and
"workspace shell ready". Fix anything red before proceeding.

## Step 3 — Kick off the workflow

```
/aidlc Build the PulseDesk client-call intelligence tool described in sample-project-sow.md
```

Initialization (0.1–0.3) runs deterministically inside one tool call — no
interaction. The orchestrator then proposes a scope.

**Choose `feature` scope.** It marks all 33 stages EXECUTE, so every brief
consumer runs. (Since 2.6.6, precedent-research also runs in `mvp` and
`poc`, but those scopes skip some downstream consumers — `feature` is the
full end-to-end test.)

Confirm the plan before approving it: the ideation list must show
Precedent Research directly after Intent Capture, and it persists in
`aidlc/spaces/default/intents/<YYMMDD>-<label>/aidlc-state.md`.

## Step 4 — Ideation

### 4.1 Intent Capture (product agent)

Pick an interaction mode when asked; point the agent at
`sample-project-sow.md`. Make sure the captured intent statement carries the
signal precedent-research needs: transcripts → structured CRM records,
internal tool ~10 users, near-zero idle cost, AWS + TypeScript, org design
language for the UI. Approve at the gate (and answer the mandatory
"anything to add for next time?" learn question — every stage asks it).

### 4.2 Precedent Research (your stage — the main event)

Watch the transcript for the reads: `index.md` first, then ONLY the matching
profile(s) — expected primary `exemplars/meeting-crm/profile.md`. Reading
every profile = fail (Step 4 says never load the whole library).

At the review gate, open the artifact:

```bash
cat aidlc/spaces/default/intents/*/ideation/precedent-research/reference-brief.md
```

Verify against SOW Appendix A:
- [ ] Selected Exemplars & Rationale — meeting-crm primary, rationale cites the
      intent, decoys (idp-*, market-intelligence-platform) rejected or ranked lower
- [ ] Patterns to Follow — imperatives; chunk→merge Step Functions pipeline,
      single gated LLM client (C3), serverless/scale-to-zero (C1)
- [ ] UI Directives — concrete: dense tables, status chips not gauges, terse copy (SOW §5)
- [ ] Precedence Rule — verbatim greenfield/brownfield form
- [ ] Deep-Dive Pointers — meeting-crm repo URL + notable paths
- [ ] No SENSOR_FAILED (artifacts under `.aidlc-sensors/` if you want to look)

If the brief is wrong, use **Request Changes** at the gate — that also tests
your stage's revision loop. Only approve a brief you'd accept from a colleague.

### 4.3–4.7 Rest of ideation

Market Research, Scope Definition, **Feasibility** (first brief consumer —
its deliverable must reference the brief/exemplar patterns), Team Formation,
**Rough Mockups** (must follow UI Directives — if a mockup shows generic
LLM-style card grids and gauges, issue 02/03 wiring failed), Approval Handoff.

```bash
grep -ril "reference-brief\|exemplar\|meeting-crm" \
  aidlc/spaces/default/intents/*/ideation/feasibility/ \
  aidlc/spaces/default/intents/*/ideation/rough-mockups/
```

## Step 5 — Inception

Greenfield repo, so Reverse Engineering (2.1) and the brownfield precedence
override won't fire — expected. Check the two brief consumers:

- **Refined Mockups** — UI Directives still applied at higher fidelity.
- **Application Design** — architecture references Patterns to Follow
  (serverless, nested-stack/domain layering, dual data layer where relevant)
  rather than inventing a generic 3-tier design.

Requirements Analysis / User Stories / Units Generation / Delivery Planning
run normally; sanity-check stories trace to SOW §3/§7.

## Step 6 — Construction

You'll be asked for a Construction Autonomy Mode — for a first test run pick
the more supervised option so you can watch delegation prompts.

**Code Generation (3.5)** is the last verification point: the per-Unit
subagent delegation prompt must forward the deep-dive pointers with the fetch
rule + degradation verbatim (issue 04's "delivered beyond the letter" item).
Watch a dispatch, or afterwards:

```bash
grep -rn "deep.dive\|notable" aidlc/ --include="*.md" -il | head
```

Generated UI code should obey UI Directives; extraction pipeline should
follow the exemplar patterns (chunked Map-state processing, gated client).

Optional degradation test in the same run: before construction starts, edit
`.claude/knowledge/org-bok/exemplars/meeting-crm/profile.md` `repo_url` to
`https://git.example.invalid/x.git` → fetches fail, stages still complete,
"deep dive unavailable" lands in deliverables.

## Step 7 — Operation (optional for this test)

Adds nothing Org-BoK-specific beyond what's already verified. Fine to stop
after Build & Test / CI Pipeline; `feature` scope will route through it if
you keep going.

## Step 8 — Score and iterate

Tally the checkboxes (Step 4.2 brief shape, 4.3 consumption, 5 design
consumption, 6 pointer forwarding). For each miss: fix the prose in `core/`
(stage step / agent persona / guide), then

```bash
cd ~/WebstormProjects/aidlc-workflows && bun scripts/package.ts
rsync -a --delete dist/claude/.claude/ ~/tmp/pulsedesk/.claude/
```

Do NOT rsync `aidlc/` — it now holds live workflow state. Re-run from the
failed stage (session resume) or start a fresh intent for a clean read.

## Where everything lands

```
~/tmp/pulsedesk/
├── .claude/                                    # engine (yours, customized)
├── sample-project-sow.md
├── aidlc/spaces/default/intents/<YYMMDD>-<label>/
│   ├── aidlc-state.md                          # stage plan + progress
│   ├── ideation/precedent-research/reference-brief.md   # ★ the artifact under test
│   ├── ideation/…  inception/…  construction/…
│   └── .aidlc-sensors/                         # sensor verdicts
└── <generated app code>                        # from construction
```