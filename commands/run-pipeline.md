---
description: Orchestrate an approved pipeline end-to-end — per-task dispatch, two-stage review, worktree safety, escalation
argument-hint: [optional: --resume]
---

# /superpipelines:run-pipeline

Invoke the `running-a-pipeline` skill to execute the approved pipeline.

Args: $ARGUMENTS

Preconditions checked by the skill:

- `tasks.md` exists in the workspace.
- `tmp/pipeline-state.json` is in a safe state (not `escalated` or `failed`).

The skill will:

1. State preflight per `sk-pipeline-state` recovery rules.
2. Worktree setup (if pattern requires) per `sk-worktree-safety` 4-step protocol.
3. Extract task texts from `tasks.md` once at the orchestrator.
4. Per task: dispatch `pipeline-task-executor` → Stage 1 (`pipeline-spec-reviewer`) → Stage 2 (`pipeline-quality-reviewer`).
5. Pattern 3 only: `pipeline-failure-analyzer` between iterations; HARD-GATE at iteration 3.
6. Reconcile state; invoke `finishing-a-development-branch` for merge / PR / cleanup.

Do NOT skip Stage 1 before Stage 2. Do NOT auto-resume an escalated state.
