# Superpipelines

Superpipelines is a Claude Code plugin for designing, generating, and running multi-agent AI pipelines that follow the conventions in `docs/AI_PIPELINES_LLM.md` (Patterns 1–6, write/review isolation, worktree safety, spec-driven development, 4D processing wrapper).

It ships:

- **Skills** that teach Claude how to design, audit, and orchestrate pipelines (preloaded shared methods, on-demand reference libraries, top-level workflow skills).
- **Subagents** for pipeline architecture, single-task implementation, two-stage review, and iterative-loop diagnosis.
- **Slash commands** that wire everything together.
- **Multi-harness bootstrap** so the same skills run on Claude Code, Cursor, Codex, OpenCode, Copilot CLI, and Gemini CLI (with degraded surface where features are Claude-Code-only — see [Compatibility](#compatibility)).

## What it does

Given a vague request like "build me a deploy pipeline for our service," Superpipelines:

1. Walks the user through the 4D Method (Deconstruct → Diagnose → Develop → Deliver) to produce a precise task definition.
2. Drives Spec-Driven Development (`/specify` → `/plan` → `/tasks` → human gate → `/implement`).
3. Selects an execution pattern (Sequential, Parallel Fan-Out, Iterative Loop, Human-Gated, SDD parallel) based on the task's information flow.
4. Dispatches purpose-built subagents per task with **Stage 1 (spec compliance) → Stage 2 (code quality)** review isolation.
5. Tracks state in `tmp/pipeline-state.json` with explicit recovery rules.
6. Honors worktree safety, rationalization-resistance gates, and Sonnet-only model selection scaled by `effort` levels.

## Installation

### Claude Code

```bash
/plugin marketplace add gustavo-meilus/superpipelines
/plugin install superpipelines@superpipelines-marketplace
```

Or directly from GitHub:

```bash
claude plugin install github:gustavo-meilus/superpipelines
```

### Cursor

```text
/add-plugin superpipelines
```

### OpenAI Codex (CLI / App)

```bash
/plugins
```

Then search for `superpipelines`.

### OpenCode

```text
Fetch and follow instructions from https://raw.githubusercontent.com/gustavo-meilus/superpipelines/refs/heads/main/.opencode/INSTALL.md
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add gustavo-meilus/superpipelines
copilot plugin install superpipelines@superpipelines-marketplace
```

### Gemini CLI

```bash
gemini extensions install https://github.com/gustavo-meilus/superpipelines
```

## Quick start

Inside a project, ask:

> "Design a pipeline that ingests CSVs, validates rows, and posts results to Slack."

Superpipelines will:

1. Trigger `creating-a-pipeline` (DECONSTRUCT/DIAGNOSE phases).
2. Dispatch `pipeline-architect` to produce `spec.md`, `plan.md`, `tasks.md`.
3. Gate at `<HARD-GATE>` for human approval before parallel implementation.
4. On approval, drive `running-a-pipeline` to dispatch task workers + Stage 1/2 reviewers.

Or run a slash command directly:

| Command | What it does |
|---------|--------------|
| `/superpipelines:new-pipeline` | Design a new pipeline (architect-driven) |
| `/superpipelines:run-pipeline` | Orchestrate `tasks.md` end-to-end |
| `/superpipelines:audit-pipeline` | Audit pipeline/agent files against `AI_PIPELINES_LLM.md` |
| `/superpipelines:new-agent` | Design a single subagent |
| `/superpipelines:new-skill` | Design a single SKILL.md |

## Compatibility

| Component | Claude Code | Cursor | Codex CLI/App | OpenCode | Copilot CLI | Gemini CLI |
|-----------|:-----------:|:------:|:-------------:|:--------:|:-----------:|:----------:|
| Skills | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subagents (`agents/`) | ✅ | — | — | — | — | — |
| Slash commands | ✅ | natural-language fallback | NL | NL | NL | NL |
| SessionStart hooks | ✅ | ✅ (Cursor format) | — | bootstrap file | — | extension manifest |

On Tier-3 harnesses (Codex, Copilot, Gemini), `running-a-pipeline` falls back to an in-session role-play loop that preserves the status protocol (`DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`).

## Repository layout

```
superpipelines/
├── .claude-plugin/{plugin.json, marketplace.json}
├── agents/                              # Subagent definitions (Claude Code)
├── skills/
│   ├── using-superpipelines/            # Bootstrap skill (loaded at session start)
│   ├── creating-a-pipeline/             # User workflow: design pipeline + SDD
│   ├── running-a-pipeline/              # User workflow: orchestrate tasks.md
│   ├── sk-*/                            # Shared method skills (preloaded by agents)
│   ├── *-references/                    # Companion reference libraries (no SKILL.md)
│   └── ... kept legacy skills ...
├── commands/                            # Slash command wrappers
├── hooks/                               # SessionStart hook (CC + Cursor formats)
├── docs/AI_PIPELINES_LLM.md             # Canonical reference (full)
├── settings.json
└── ...
```

## License

MIT — see `LICENSE`.

## Acknowledgements

Built on top of pipeline conventions and skill-design patterns originally distilled from Anthropic's Skills Open Standard and the Superpowers project by Jesse Vincent.
