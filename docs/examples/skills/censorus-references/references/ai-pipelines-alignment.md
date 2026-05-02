# AI_PIPELINES_LLM.md Alignment Audit

Canonical reference: `~/.claude/AI_PIPELINES_LLM.md`. Every Claude Code sub-agent and orchestrator MUST conform. Run this checklist on every audit.

## Core architecture

- [ ] **`SUB_AGENT_SPAWNING: FALSE`** — only parent session / skill / lead agent may orchestrate. No sub-agent contains a `Task(...)` call that spawns another sub-agent. **SEV-0** if violated.
- [ ] **`ANT_SWARM_PRINCIPLE`** — many small-context agents, not one large-context agent.
- [ ] **`WRITE_REVIEW_ISOLATION`** — the writing agent is NOT the reviewing agent.
- [ ] **`PIPELINE_PHASE_ISOLATION`** — tester, analyzer, healer are separate instances.
- [ ] **`WORKTREE_MERGE_REQUIRED`** — if `isolation: worktree`, orchestrator commits and merges before worktree destruction.

## Body size and description discipline

- [ ] **Body ≤ 150 lines** (strict). Extract overflow into a companion `{agent}-references/` skill. **SEV-1** if violated.
- [ ] **Description ≤ 1024 chars**, third person, pattern `<what it does>. <when to use it>.`
- [ ] **No first/second person** ("I can…", "You can use…"). **SEV-1** if detected.
- [ ] **`name` ≤ 64 chars**, lowercase + hyphens only.

## Strict conventions

- [ ] **`MODEL_SELECTION: SONNET_ONLY`** in pipelines. Opus only allowed via explicit user upgrade in interactive agents. **SEV-0** if a pipeline requests Opus.
- [ ] **`PERMISSION_MODE: NULL`** — `permission_mode` is NOT in frontmatter.
- [ ] **`memory: project`** / **`memory: local`** NOT set. State belongs in `tmp/pipeline-state.json`. **SEV-1** if violated.
- [ ] **Path variables** — orchestrators define `{OUT}` and `{REF}` as absolute shell env vars; sub-agent spawn prompts resolve via subshell substitution. No hardcoded paths.

## Settings / permissions

- [ ] **`Bash(*)`** covers all bash variants — no `Bash(cmd:*)` specific entries.
- [ ] **PreToolUse Bash-allow hook** removed when `Bash(*)` is in `permissions.allow` (redundant). **SEV-2**.
- [ ] **`defaultMode`** appears once only at top-level — remove any duplicate inside `permissions`. **SEV-1**.

## Context distribution

- [ ] **CLAUDE.md** ≤ 200 lines (strict).
- [ ] Reference-only skills have `user-invocable: false` + `disable-model-invocation: true` and the `SKILL.md` is deleted OR the body is minimal. Metadata alone still consumes system-context tokens.
- [ ] **`.claudeignore`** excludes `dist/`, `node_modules/`, `.nx/cache/`, `coverage/`, `playwright-report/`, `test-results/`, `tmp/pipeline-*`, `*.map`, `*.min.js`.

## Output size discipline

- [ ] **`BOUND_STDOUT: TRUE`** — e.g. `npx playwright test 2>&1 | tail -80`.
- [ ] **`SCOPE_FILE_READS: TRUE`** — read specific line ranges, not full files when possible.
- [ ] **`PASS_PATHS_NOT_CONTENT: TRUE`** — orchestrators pass `{file_path}`; never paste file content into spawn prompts.

## Programmatic tool audit

- [ ] Orchestrator includes `PostToolUse` logic tracking utilization: if `Tool_X` invocations == 0 across 3 consecutive iterations, prune `Tool_X` from sub-agent payload.
