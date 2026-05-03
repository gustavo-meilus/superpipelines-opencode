# Skill Routing — Decision Table

When to invoke which superpipelines skill or agent. Source of truth for the routing rules in `using-superpipelines`'s SKILL.md.

## User-facing workflow skills

| Trigger phrase / context | Invoke |
|--------------------------|--------|
| "Design a pipeline that…" | `creating-a-pipeline` |
| "Build me a workflow for…" | `creating-a-pipeline` |
| "Plan multi-step feature work" | `creating-a-pipeline` |
| `tasks.md` exists in workspace | `running-a-pipeline` |
| "Run the pipeline" | `running-a-pipeline` |
| "Execute the plan" | `running-a-pipeline` |
| "Resume the pipeline" | `running-a-pipeline` (reads `tmp/pipeline-state.json`) |

## Subagent dispatch (Claude Code only — Tier 2/3 falls back to role-play)

| Trigger | Subagent |
|---------|----------|
| "Audit my pipeline / agent definitions" | `pipeline-auditor` |
| "Create a new agent" / "Design a subagent" | `pipeline-architect` (single-agent mode) |
| "Create a new skill" / "Design a SKILL.md" | `skill-architect` |
| "Implement task T-N from tasks.md" | `pipeline-task-executor` |
| Stage 1 review of executor output | `pipeline-spec-reviewer` |
| Stage 2 review (after Stage 1 passes) | `pipeline-quality-reviewer` |
| Iterative loop diagnosis | `pipeline-failure-analyzer` |

## Shared method skills (preloaded by agents — only invoke explicitly when authoring)

| Use case | Skill |
|----------|-------|
| Ambiguous request needs structured processing | `sk-4d-method` |
| Multi-step feature needs spec/plan/tasks | `sk-spec-driven-development` |
| Authoring or modifying an agent or skill | `sk-claude-code-conventions` |
| Choosing an execution pattern (Sequential, Fan-Out, Iterative, Human-Gated, SDD) | `sk-pipeline-patterns` |
| Tracking pipeline state across iterations | `sk-pipeline-state` |
| About to use a git worktree | `sk-worktree-safety` |
| Setting up two-stage review | `sk-write-review-isolation` |
| Authoring a discipline-enforcing skill | `sk-rationalization-resistance` |

## Kept legacy skills (loaded by workflow skills as needed)

| Use case | Skill |
|----------|-------|
| Refining a vague request via Socratic questions | `brainstorming` (loaded by `creating-a-pipeline` Phase 1) |
| Closing out the pipeline (merge / PR / cleanup) | `finishing-a-development-branch` (loaded by `running-a-pipeline` end phase) |
| Project signals TDD requirement | `test-driven-development` (loaded by `pipeline-task-executor`) |
| Iterative-loop failure diagnosis | `systematic-debugging` (loaded by `pipeline-failure-analyzer`) |
| Self-verify before reporting DONE | `verification-before-completion` (every executor) |

## When NOT to invoke a skill

- Trivial single-step tasks (rename, typo fix, config flip) — use the harness's default behavior.
- Read-only Q&A about the codebase — use Read/Glob/Grep directly.
- The user has explicitly said "skip the spec phase" or similar — user instruction wins.
