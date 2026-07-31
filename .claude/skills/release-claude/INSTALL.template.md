# AI-DLC for Claude Code — Installation Guide

**Version {{VERSION}}** · released {{DATE}}

This archive contains a customized AI-DLC (AI-Driven Development Life Cycle)
implementation for **Claude Code**. Installing it means unpacking this archive
and copying two directories into your project — there is no build step, no
package manager, no init command.

What you get: a `/aidlc` command inside Claude Code that turns a one-line
description ("Build a task management API with user authentication") into a
staged, auditable engineering workflow — requirements, design, construction,
and review, run by specialized agents with deterministic state tracking.

---

## 1. Prerequisites

You need two tools installed, plus AWS Bedrock access.

### bun (required)

Every AI-DLC hook and CLI tool is TypeScript run via [bun](https://bun.sh).

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```

```powershell
# Windows PowerShell
irm bun.sh/install.ps1 | iex
```

> **PATH gotcha (the #1 install problem):** bun must be on the PATH that
> *non-interactive* shells see, because that's how Claude Code runs hooks.
> Non-interactive shells read `~/.zshenv` (zsh) or `~/.bashrc` (bash) — NOT
> `~/.zshrc`, which is where the bun installer writes. If `which bun` works
> in your terminal but `/aidlc --doctor` says bun is missing, copy the
> `BUN_INSTALL`/`PATH` export lines into `~/.zshenv` (or `~/.bashrc` for
> bash and Git Bash on Windows).

### Claude Code (required)

```bash
# macOS / Linux (native install — recommended; auto-updates)
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell
# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

Or `brew install --cask claude-code` on macOS. Verify with `claude --version`.

### AWS Bedrock access (required by the shipped config)

The shipped `.claude/settings.json` routes Claude Code through **AWS Bedrock**
(`CLAUDE_CODE_USE_BEDROCK=1`, `AWS_REGION=us-east-1`, models pinned to global
inference profiles). One-time account setup:

1. **Enable model access** — in the [Bedrock console](https://console.aws.amazon.com/bedrock/)
   → Model catalog, request access to the Anthropic models (Fable, Opus,
   Sonnet, Haiku). Granted immediately; once per AWS account.
2. **Have credentials on the default AWS SDK chain** — any of
   `aws configure`, `aws sso login --profile <p>` + `export AWS_PROFILE=<p>`,
   or exported `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`.
3. **IAM permissions** — your role needs `bedrock:InvokeModel`,
   `bedrock:InvokeModelWithResponseStream`, `bedrock:ListInferenceProfiles`,
   and `bedrock:GetInferenceProfile` on Bedrock foundation-model and
   inference-profile resources.
4. **Different region?** Don't edit the shared `settings.json`. Create
   `.claude/settings.local.json` (gitignored) and set `"AWS_REGION"` in its
   `env` block — local settings take precedence.

> **Easier path:** run `claude`, choose **3rd-party platform → Amazon
> Bedrock** at the login prompt, and the wizard detects credentials, region,
> and accessible models. You still complete step 1 (model access) once.

> **Not using Bedrock?** Edit `.claude/settings.json` after install: remove
> the `CLAUDE_CODE_USE_BEDROCK` and model-pin env vars and use your normal
> Anthropic authentication.

### uv / uvx (optional — for the AWS MCP servers)

The shipped `.mcp.json` declares five MCP servers (AWS API, pricing, IaC,
serverless tooling via `uvx`, plus `context7` docs lookup over HTTP). They
are optional: a server you have no credentials for is simply unavailable and
never blocks a workflow. To use the AWS ones:

```bash
curl -fsSL https://astral.sh/uv/install.sh | sh
```

For `context7`, put `CONTEXT7_API_KEY` in `.claude/settings.local.json`.
To drop a server entirely, delete its entry from `.mcp.json`.

---

## 2. Install

**Unpack into a staging folder first — not directly into your project.** The
archive ships a `.gitignore` at its root that would overwrite yours.

```bash
mkdir aidlc-staging && cd aidlc-staging
unzip /path/to/aidlc-claude-v{{VERSION}}.zip
```

Then copy into your project root:

```bash
cp -r .claude/  /path/to/your-project/.claude/
cp -r aidlc/    /path/to/your-project/aidlc/
cp .mcp.json    /path/to/your-project/.mcp.json   # skip if you already have one — merge the entries by hand
```

What each piece is:

| Piece | What it is | Where it goes |
|-------|-----------|----------------|
| `.claude/` | The engine — orchestrator skill, 33 stage files, 15 agent personas, 13 hooks, CLI tools, knowledge, settings | `your-project/.claude/` |
| `aidlc/` | The **workspace shell** — the pre-built `aidlc/spaces/default/memory/` method tree the engine reads | `your-project/aidlc/` — a **sibling** of `.claude/`, not inside it |
| `.mcp.json` | MCP server declarations (all optional) | project root |
| `.gitignore` | The AI-DLC ignore rules (see next step) | merged into yours |

Both directory copies are required. `/aidlc --doctor` fails its "workspace
shell ready" check if `aidlc/spaces/default/memory/` is missing.

### Merge the .gitignore rules

Append everything from the `# AI-DLC` comment block downward in the shipped
`.gitignore` to your project's `.gitignore` (or copy the whole file if you
don't have one). These rules keep per-user session cursors and machine-local
runtime state out of git while committing the shared work — method files,
state, audit trail, and stage artifacts. Skipping this step means every
teammate's session cursor dirties the tree on every `/aidlc` call.

> **Already reviewed the permissions?** The shipped `.claude/settings.json`
> pre-approves the standard Claude Code tools (Read, Edit, Write, Bash, Glob,
> Grep, Task, WebSearch) so workflows run without per-call prompts. Review it
> before first use and narrow it if your security posture requires.

---

## 3. Verify

```bash
cd /path/to/your-project && claude
```

Inside the Claude Code session:

```
/aidlc --doctor
```

Every check should pass (advisories are fine). The important ones:

```
✓ bun installed (required for CLI tools and hooks)
✓ settings.json present
✓ workspace shell ready (.claude/ + aidlc/spaces/default/memory/)
✓ Cycle detection: 0 cycles
✓ Schema validation: 33/33 stages valid
```

| Failure | Fix |
|---------|-----|
| `bun` not installed | See the PATH gotcha under Prerequisites — it's almost always the non-interactive PATH. |
| Hook not present / `settings.json` missing | Re-copy `.claude/` from the staging folder. |
| Workspace shell missing | You copied `.claude/` but not `aidlc/`. Copy `aidlc/` into the project root as a sibling of `.claude/`. |

---

## 4. First workflow

```
/aidlc Build a REST API for inventory management
```

The engine picks a scope (depth of ceremony) from your description, creates
an intent under `aidlc/spaces/default/intents/`, and walks the staged
workflow — pausing at gates for your review. You can also name the scope
yourself:

```
/aidlc bugfix Fix the login timeout issue
/aidlc feature Add CSV export to the reports page
```

To seed team practices before the first run, edit the shipped
`aidlc/spaces/default/memory/` files (`team.md`, `project.md`) — that's the
memory layer every workflow reads.

---

## 5. Upgrading from a previous version

Unpack the new archive into a staging folder, then:

```bash
cp -r staging/.claude/  your-project/.claude/                        # replace the engine
cp -r staging/aidlc/spaces/default/memory/ your-project/aidlc/spaces/default/memory/   # ONLY if you haven't customized it — see below
```

**Do NOT re-copy the rest of `aidlc/`.** `aidlc/spaces/` holds your team's
work — intents, state, audit trail, artifacts, and accumulated knowledge. It
is yours, not the framework's. If your team has edited the memory files
(`team.md`, `project.md`, learnings), don't overwrite them either — diff the
new archive's memory tree against yours and merge deliberately.

Your `.claude/settings.local.json` (region, profiles, secrets) is gitignored
and untouched by the upgrade. Re-run `/aidlc --doctor` after upgrading.

Check the release notes shipped with each version for anything beyond
re-copying.

---

## Troubleshooting quick hits

- **`which bun` works but the harness can't find bun** — non-interactive
  PATH; see the gotcha in Prerequisites.
- **Model access errors from Bedrock** — model access not enabled in the
  console for that region, or `AWS_REGION` doesn't match where access was
  granted. Confirm with `aws bedrock list-inference-profiles --region <r>`.
- **State/drift errors from `--doctor`** — archive the active intent's
  directory under `aidlc/spaces/<space>/intents/` and run `/aidlc` to start
  fresh.
- **MCP servers not coming up** — missing credentials; they're optional and
  never block a workflow. Install `uv` and/or set `CONTEXT7_API_KEY` if you
  want them.