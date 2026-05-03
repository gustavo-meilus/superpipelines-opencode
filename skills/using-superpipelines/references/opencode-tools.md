# OpenCode Tool Mapping

OpenCode is Tier 3 — skills work via bootstrap loading, but no subagents and no Claude-Code-style hooks.

| Skill references | OpenCode equivalent |
|------------------|---------------------|
| `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep` | Use OpenCode's native file/shell tools (names vary by build) |
| `Skill` tool | Skills are bootstrap-loaded — reference by name in the agent's mental flow |
| `Task` tool (dispatch subagent) | Not supported — falls back to in-session role-play |
| `TodoWrite` | Use OpenCode's task/plan tool if available |
| Slash commands | Use natural language: "Design a pipeline that…" |
| `WebFetch`, `WebSearch` | Use OpenCode's native equivalents |

## Bootstrap

OpenCode loads superpipelines via `.opencode/INSTALL.md`, which references `using-superpipelines` and the surrounding skill set. Tell OpenCode to fetch the install doc on session start (see plugin README for the exact command).

## In-session role-play fallback

When the workflow says "dispatch `pipeline-task-executor` for task T-1":

1. Read `agents/pipeline-task-executor.md`.
2. Adopt the agent's rules under a fresh mental context.
3. Perform the task; emit the agent's terminal status and output schema.
4. Return to the orchestration session and continue.

Write/review isolation is a discipline on Tier 3: separate mental sessions for executor, Stage 1 reviewer, and Stage 2 reviewer. Never collapse stages.
