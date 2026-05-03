# Cursor Tool Mapping

Cursor uses the same tool names as Claude Code. The Cursor harness is Tier 2 — skills, slash commands (via natural language), and SessionStart hooks all work, but `agents/` subagent dispatch does not.

| Skill references | Cursor equivalent |
|------------------|-------------------|
| `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep` | Same tool names |
| `Skill` tool | `Skill` tool |
| `Task` tool (dispatch subagent) | Not supported — falls back to in-session role-play |
| `TodoWrite` | Same tool name |
| Slash commands (`/superpipelines:new-pipeline`) | Use natural language: "Run the new-pipeline workflow" |
| `WebFetch`, `WebSearch` | Same tool names |

## SessionStart hook

Cursor reads `hooks/hooks-cursor.json`. The hook script `hooks/session-start` emits the Cursor-shaped JSON payload (`{"additional_context": "..."}`) when `CURSOR_PLUGIN_ROOT` is set in the environment.

## In-session role-play fallback

When `running-a-pipeline` says "dispatch `pipeline-task-executor` for task T-1":

1. Read `agents/pipeline-task-executor.md`.
2. Adopt the agent's rules and output contract under a fresh mental context.
3. Perform the task as if you were the worker agent.
4. Emit exactly one terminal status (`DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`) with the agent's output schema.
5. Return to the orchestration session and continue.

This preserves write/review isolation as a discipline rather than a hard architectural boundary. Stage 1 reviewer role-play MUST happen in a separate "mental session" from the executor role-play — clear context, re-read the spec, do not rely on what was just written.
