---
name: running-a-pipeline
description: Use when tasks.md exists and the user asks to "run the pipeline", "execute tasks.md", "implement the plan", "resume the pipeline", or to invoke /superpipelines:run-pipeline — orchestrates per-task dispatch with two-stage review (spec compliance gates code quality), worktree safety, and Pattern 3 escalation.
---

# Running a Pipeline

End-to-end orchestrator for an approved pipeline. Reads `tasks.md`, dispatches per-task workers + Stage 1/2 reviewers, manages `pipeline-state.json`, and enforces escalation.

## When this fires

- `/superpipelines:run-pipeline` invoked.
- `tasks.md` exists and user says "run the pipeline" / "execute the plan" / "implement".
- Resume: existing `tmp/pipeline-state.json` with `status: "running"` after a crash.

When NOT to use:

- `tasks.md` does not exist → invoke `creating-a-pipeline` first.
- `tmp/pipeline-state.json` shows `status: "escalated"` or `"failed"` → surface to human; do NOT auto-resume.

## Workflow

### Phase 0 — State preflight

Per `sk-pipeline-state` recovery rules:

```
1. Check tmp/pipeline-state.json
   ├── Missing AND tasks.md exists → fresh start; initialize state.
   ├── Missing AND tasks.md absent → tell user to run /superpipelines:new-pipeline first.
   ├── status: "running" AND started_at < 1h → live; refuse to start new.
   ├── status: "running" AND started_at > 1h → crashed; ask user resume / restart / abort.
   ├── status: "completed" → tell user "already done".
   ├── status: "escalated" or "failed" → surface to human; do NOT auto-resume.
   └── parse error → escalate; do NOT auto-resume.
```

<HARD-GATE>
Never auto-resume an escalated, failed, or corrupt state. The escalation existed for a reason; surfacing to human is non-negotiable.
</HARD-GATE>

### Phase 1 — Worktree setup (if pattern requires it)

For Patterns 2 / 2b / 3 / 5: invoke `sk-worktree-safety` 4-step protocol:

1. VERIFY_IGNORED — `.worktrees/` is git-ignored.
2. SETUP_AFTER_CREATE — auto-detect manifest; run setup command.
3. VERIFY_BASELINE — run full test suite; STOP if pre-existing failures.
4. (COMMIT_BEFORE_DESTROY runs at the end of pipeline.)

Record worktree path in `pipeline-state.json` `metadata.worktree_root`.

### Phase 2 — Extract task texts

Read `tasks.md` ONCE at the orchestrator. Extract each task's full text into a per-task variable. Pass extracted text to workers — NEVER tell workers "find your task in tasks.md."

```
# WRONG:
spawn(executor, "Read tasks.md and implement T-3")

# CORRECT:
T3_TEXT = extract_task(tasks.md, "T-3")
spawn(executor, f"Implement this task:\n\n{T3_TEXT}")
```

### Phase 3 — Per-task RPI loop with two-stage review

For each task respecting dependencies (parallel where deps allow):

```
state.phases[i].status = "running"; atomic write.

# Dispatch executor
exec_result = Task(pipeline-task-executor,
  task_text + spec_path + plan_path + project_context (paths only))

# Handle non-DONE per status protocol:
match exec_result.status:
  DONE                  → continue to Stage 1
  DONE_WITH_CONCERNS    → read concerns; if correctness/scope, fix before review
  NEEDS_CONTEXT         → re-dispatch with added context
  BLOCKED               → context → effort → decompose → escalate (4-step ladder)

# Stage 1 — spec compliance
spec_result = Task(pipeline-spec-reviewer,
  spec_path + task_text + exec_result.outputs + exec_result.status_report)

if spec_result.verdict == "FAIL":
  Task(pipeline-task-executor, "FIX: " + under_build + over_build)
  re-Stage-1  # loop until PASS

# Stage 2 — code quality (only after Stage 1 PASSed)
qual_result = Task(pipeline-quality-reviewer,
  spec_path + task_text + exec_result.outputs + spec_result)

if qual_result.verdict == "FAIL" AND any critical/major:
  Task(pipeline-task-executor, "FIX: " + qual_result.issues)
  re-Stage-1  # full re-review, not just Stage 2 (fix may break ACs or add over-build)

# Mark task done
state.phases[i].status = "done"
state.phases[i].outputs = exec_result.outputs
atomic write
```

<EXTREMELY-IMPORTANT>
Stage 1 spec compliance review MUST pass before Stage 2 code quality review begins. Running Stage 2 on spec-noncompliant output is wasted work. After ANY Stage 2 fix, re-run Stage 1 (the fix may break ACs or introduce over-build).
</EXTREMELY-IMPORTANT>

### Phase 4 — Iterative loop handling (Pattern 3 only)

If pattern is Pattern 3, after each fix iteration:

1. Dispatch `pipeline-failure-analyzer` with current test output + prior diagnoses + iteration_count.
2. If analyzer returns `decision: "ESCALATE"` → STOP; surface to user per `pipeline-runner-references/escalation.md`.
3. If `decision: "CONTINUE"` → dispatch fixer with the diagnosis; re-run tester.

<HARD-GATE>
After 3 iterations without measurable progress: STOP. Do NOT attempt iteration 4. Update state to `status: "escalated"`; preserve worktree; surface to user.
</HARD-GATE>

### Phase 5 — Reconcile and finalize

When all tasks complete:

1. Run integration tests on the merged worktree.
2. Update `tmp/pipeline-state.json` to `status: "completed"`.
3. Invoke `finishing-a-development-branch` skill for merge / PR / cleanup decisions.
4. `sk-worktree-safety` Step 4: COMMIT_BEFORE_DESTROY before any worktree removal.
5. Tell user: pipeline complete; here's what was produced.

## Common mistakes

- Skipping Phase 0 state preflight → overwrites in-progress pipeline or auto-resumes an escalated one.
- Telling executor "find your task in tasks.md" → wastes worker context; worker may pick the wrong task.
- Dispatching Stage 2 without Stage 1 PASS → wasted Stage 2 work on spec-noncompliant code.
- Re-dispatching only Stage 2 after a Stage 2 fix → fix may break ACs; always re-run Stage 1.
- Removing worktree before commit → loses worker output (`WORKTREE_MERGE_REQUIRED: TRUE` violated).
- Auto-resuming after escalation → repeats the failure.

## Red Flags — STOP

- "Stage 1 looks like it would PASS, skip to Stage 2" → STOP. Always run Stage 1 explicitly. Implicit gates fail silently.
- "Iteration 4 might fix it" → STOP. The cap exists because empirically iteration 4+ corrupts the codebase further.
- "I'll just `git worktree remove --force`" → STOP. Commit first per `sk-worktree-safety` Step 4.
- "The pipeline is mostly done; mark complete" → STOP. Status is binary. Mark `completed` only when all tasks PASSed Stage 1 AND Stage 2.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The reviewer is just a formality after a clean executor run" | Empirically, reviewers catch ~30% of issues even on "clean" runs. The protocol exists because intuition mis-predicts. |
| "Stage 2 minor issues should ship" | Configurable per pipeline policy. If undecided, default to ship-and-track. Don't silently drop the issue. |
| "The user said hurry; skip the human gate" | The gate was at design time. At run time there's no gate. If the user says hurry NOW, they're asking you to violate a different rule. |

## Cross-references

- `sk-pipeline-state` — state schema and recovery rules.
- `sk-worktree-safety` — 4-step protocol.
- `sk-write-review-isolation` — Stage 1/2 details.
- `sk-pipeline-patterns` — pattern-specific dispatch.
- `pipeline-runner-references/dispatch-protocols.md` — detailed per-pattern dispatch.
- `pipeline-runner-references/state-management.md` — state transition mechanics.
- `pipeline-runner-references/escalation.md` — escalation triggers and reporting.
- `pipeline-task-executor`, `pipeline-spec-reviewer`, `pipeline-quality-reviewer`, `pipeline-failure-analyzer` agents.
- `finishing-a-development-branch` — Phase 5 cleanup.
