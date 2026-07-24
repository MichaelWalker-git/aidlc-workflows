# AI-DLC Customization Components

> Compiled from the `v2` branch docs: `docs/reference/01-architecture.md`,
> `docs/reference/11-contributing.md`, and the Harness Engineer Guide
> (`docs/harness-engineering/00-overview.md` … `10-authoring-a-plugin.md`).

The framework splits customization into three tiers:

1. **Data you author in your fork's `core/`** — no code required
2. **Code changes** (TypeScript)
3. **Runtime overrides in a project workspace** — no fork needed at all

---

## Tier 1 — Add/override in `core/` without writing code

All of these are Markdown + YAML frontmatter or JSON. The framework's design
principle is that none require TypeScript edits.

| # | Component | Where you author it | Add new? | Override existing? |
|---|-----------|--------------------|----------|--------------------|
| 1 | **Stages** (units of work, the workflow graph nodes) | `core/aidlc-common/stages/<phase>/<slug>.md` | ✅ | ✅ edit the stage file |
| 2 | **Agents** (personas: expertise, tools, model tier) | `core/agents/<slug>-agent.md` | ✅ auto-discovered | ✅ |
| 3 | **Scopes** (which stages run for which kind of work) | `core/scopes/aidlc-<name>.md` + per-stage `scopes:` tags | ✅ | ✅ retag stages |
| 4 | **Rules / method defaults** (standing team decisions, guardrails) | `core/memory/org.md`, `team.md`, `project.md` | ✅ | ✅ |
| 5 | **Sensors** (deterministic advisory checks that fire on Write/Edit) | manifest under `core/sensors/` + the stage's `sensors:` binding | ✅ | ✅ |
| 6 | **Knowledge** (framework methodology agents load before working) | `core/knowledge/aidlc-shared/`, `core/knowledge/aidlc-<agent>-agent/` | ✅ | ✅ |
| 7 | **Construction/swarm posture** (autonomy level, what Bolts parallelize) | `core/memory/` + the `units-generation` stage | — | ✅ |
| 8 | **Harnesses** (port to another CLI: manifest + orchestrator skill) | new `harness/<name>/` directory, no `core/` edits | ✅ | ✅ |
| 9 | **Plugins** (reusable optional pack in its own repo) | `plugins/<name>/` with `.aidlc-plugin/plugin.json` | ✅ | ✅ via `contributions/` overlays |

### Notes

- **Stages** — the extensibility contract is "to add a stage, write a stage
  file"; the engine routes off the compiled graph, so no engine edit is needed.
  After authoring: `bun .claude/tools/aidlc-graph.ts compile`, regenerate
  runners with `bun .claude/tools/aidlc-runner-gen.ts write`, refresh SKILL.md
  tables (`aidlc-utility.ts stage-table` / `scope-table`).
- **Agents** — `loadAgents()` auto-discovers any `.md` under the agents dir.
  An agent only *runs* once a stage names it in `lead_agent:` /
  `support_agents:`. Use `tier` (`judgment` | `balanced` | `templated`), never
  raw `model:`/`effort:` in core frontmatter.
- **Scopes** — identity file + per-stage `scopes:` membership tags, transposed
  at compile into the EXECUTE/SKIP grid (`tools/data/scope-grid.json`). Valid
  the moment the file lands (`validScopes()` derives from file presence).
- **Sensors** — a manifest is a pure capability descriptor; binding is
  pull-based (the *stage* names the sensor in its `sensors:` frontmatter).
  Advisory only in this release — they never block, they emit
  `SENSOR_FIRED` / `SENSOR_PASSED` / `SENSOR_FAILED` audit rows.
- **Plugins** — first-party and third-party plugins are mechanically
  identical. A plugin never edits `core/`; with every plugin disabled the
  install is byte-identical to bare core. Use one for an optional domain pack
  (compliance, testing methodology) rather than scattering edits through a
  fork. Reference example: the `test-pro` plugin in
  `docs/harness-engineering/10-authoring-a-plugin.md`.

---

## Tier 2 — Requires TypeScript (Developer Reference territory)

| Component | Where |
|-----------|-------|
| **Utility tool handlers** (new `/aidlc` verbs) | subcommand in `core/tools/aidlc-utility.ts` |
| **Hooks** (audit logging, session lifecycle, statusline, state validation) | `core/hooks/aidlc-*.ts` |
| **Engine / orchestrator routing**, state machine, audit event taxonomy | `core/tools/aidlc-orchestrate.ts` and friends |
| **Sensor scripts** (the code a sensor manifest invokes) | `tools/aidlc-sensor-*.ts` (also shippable inside a plugin) |

For deterministic utility handlers (preferred): add the subcommand, dispatch
from SKILL.md with a single Bash call, and do audit logging inside the script
via `appendAuditEntry` — never hand-write `**Event**:` markdown from prose.

---

## Tier 3 — Runtime overrides in a project workspace (no fork edits)

These layer on top of whatever your fork ships, per project:

- **Team practices** — `aidlc/spaces/<space>/memory/team.md`
- **Project overrides** — `aidlc/spaces/<space>/memory/project.md`
  (wins over team and org defaults; supports `## Forbidden`, `## Mandated`,
  `## Corrections` guardrail sections loaded into agent context continuously)
- **Team domain knowledge** — `aidlc/spaces/<space>/knowledge/<agent>-agent/`
  (created empty by the engine, never overwritten by framework upgrades)

Precedence: `project.md` > `team.md` > `org.md` (framework defaults).
The §13 Learnings Ritual writes confirmed corrections into `project.md`
automatically, with one-click promotion to `team.md`.

---

## The build loop (Tiers 1–2)

```bash
bun install --frozen-lockfile
# 1. edit the source in core/ (never dist/ — it is generated and drift-guarded)
# 2. regenerate every harness tree
bun scripts/package.ts
# 3. confirm no drift (the CI guard)
bun scripts/package.ts --check
# 4. run L1 tests (seconds, no LLM)
bun tests/run-tests.ts
```

Commit the `core/` edit and the regenerated `dist/` together.

## Rule of thumb

- *How your team works on this project* → **Tier 3**, at runtime
- *What your fork's methodology is for everyone using it* → **Tier 1/2**, in `core/`
- *Optional for some projects* → a **plugin**