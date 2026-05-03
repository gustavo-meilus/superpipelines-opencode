# Superpipelines — Project Notes

This repo is the source of the `superpipelines` Claude Code plugin (and equivalents for Cursor, Codex, OpenCode, Copilot CLI, Gemini CLI). It packages skills and subagents that design and run multi-agent AI pipelines per `docs/AI_PIPELINES_LLM.md`.

## Architecture invariants

These are non-negotiable. They come straight from `docs/AI_PIPELINES_LLM.md`.

- `SUB_AGENT_SPAWNING: FALSE` — Subagents never spawn children. Orchestration lives in top-level skills (`creating-a-pipeline`, `running-a-pipeline`) or the parent session.
- `WRITE_REVIEW_ISOLATION: TRUE` — The agent that writes code never reviews it. Stage 1 (spec compliance) gates Stage 2 (code quality).
- `MODEL_SELECTION: SONNET_ONLY` — Every agent is `model: sonnet`. Scale via `effort: low | medium | high | xhigh | max`.
- `PERMISSION_MODE: NULL` — Never use `permissionMode` in agent frontmatter. Permissions ship in `settings.json`.
- `STATE_MANAGEMENT: STRUCTURED_JSON` — Pipeline state in `tmp/pipeline-state.json` (workspace-relative). No `memory: project`.
- Agent body ≤150 lines. Depth lives in companion `<agent>-references/references/*.md`.
- `skills:` frontmatter on agents preloads ONLY shared `sk-*` method skills. Never workflow skills, never companion refs.

## File-layout rules

- **Plugin manifest** is at `.claude-plugin/plugin.json`. Only the manifest goes in `.claude-plugin/`.
- All other component dirs (`agents/`, `skills/`, `commands/`, `hooks/`) sit at the repo root.
- Companion reference skills (`*-references/`) have NO `SKILL.md` — only `references/` subdirs read on demand. This keeps them out of the system context (per `<skill_suppression>`).
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths in hook commands and agent bodies. Never `~/.claude/...` or absolute paths.

## Authoring rules

- Skill `description:` field is **triggering conditions only** — never a workflow summary. Workflow summaries cause Claude to skip the body.
- Third-person voice everywhere. No "I" / "you" in skill bodies.
- Every skill description ≤1024 chars; every skill body ≤500 lines; every agent body ≤150 lines.
- Reference files >100 lines must include a Table of Contents at the top.
- Cross-references use explicit markers (`**REQUIRED SUB-SKILL:**`, `**REQUIRED BACKGROUND:**`). Never `@path/to/file` — that force-loads.
- Every agent emits exactly one terminal status: `DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`.
- Discipline-enforcing skills must include a "Red Flags — STOP" section and a Rationalization Table.

## Multi-harness rules

- Skills are the only universally-portable component. Subagents are Claude Code only.
- On Tier-3 harnesses (Codex, Copilot, Gemini), `running-a-pipeline` falls back to in-session role-play. Document this in the workflow skill body.
- Tool-name mapping for non-Claude-Code harnesses lives in `skills/using-superpipelines/references/{cursor,codex,opencode,copilot,gemini}-tools.md`.
- Bootstrap entry points: `hooks/session-start` (CC, Cursor), `AGENTS.md` (Codex), `GEMINI.md` (Gemini), `.opencode/INSTALL.md` (OpenCode), `gemini-extension.json` (Gemini extension manifest).

## Cache stability

- SessionStart hook output must be byte-identical across runs. Verify with `diff <(./hooks/session-start) <(./hooks/session-start)`.
- No timestamps, no env-specific data, no session IDs in static prompts.
- Don't mutate the skills list mid-session.

## Today's date

2026-05-02 — current model IDs: `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`.
