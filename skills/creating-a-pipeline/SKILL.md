---
name: creating-a-pipeline
description: Use when the user asks to "design a pipeline", "build a workflow for X", "plan multi-step feature work", or whenever a request needs spec/plan/tasks artifacts before execution. Walks Deconstruct→Diagnose→Develop→Deliver, dispatches pipeline-architect, and gates at human approval before parallel implementation.
---

# Creating a Pipeline

End-to-end workflow for designing a multi-agent AI pipeline. Owns the path from a vague user brief to approved spec.md / plan.md / tasks.md ready for `running-a-pipeline`.

## When this fires

- "Design a pipeline that…"
- "Build me a workflow for…"
- "Plan multi-step feature work…"
- Multi-step feature work where the spec is not yet written.
- User invokes `/superpipelines:new-pipeline`.

When NOT to use:

- Single-line typo fix, config flip, rename — execute directly.
- The user already has spec.md + tasks.md and wants to RUN it — invoke `running-a-pipeline` instead.
- The user wants to audit existing pipeline files — dispatch `pipeline-auditor` instead.

## Workflow

### Phase 0 — Brief intake (4D Deconstruct)

Apply the 4D Method internally per `sk-4d-method`:

1. Identify core intent (separate goal from output format).
2. Extract explicit entities (services, files, deadlines, constraints).
3. Surface implicit assumptions (audience, tone, scope, success criteria).
4. Restate the brief as a precise task definition.

<HARD-GATE>
If three or more critical slots are missing (audience, format, goal, constraints, scope), STOP and ask 3–5 targeted questions framed as options. Do NOT proceed to Phase 1 with hidden assumptions.
</HARD-GATE>

If the user's brief is exploratory ("I'm not sure what we need yet"), invoke `brainstorming` skill first to refine before continuing.

### Phase 1 — Pattern selection (4D Diagnose)

Identify the execution pattern using the decision tree from `sk-pipeline-patterns`:

```
Is the task multi-step with dependencies?
├── No → no pipeline; just apply 4D and execute directly.
└── Yes
    ├── Sub-tasks independent and mergeable?     → Pattern 2 / 2b (Parallel Fan-Out)
    ├── Fix/heal cycle?                          → Pattern 3 (Iterative Loop)
    ├── Destructive or irreversible action?      → Pattern 4 (Human-Gated)
    ├── Feature requiring spec/plan/tasks?       → Pattern 5 (SDD)  ← most common here
    └── Strictly linear, dependent phases?       → Pattern 1 (Sequential)
```

State the chosen pattern and 1-sentence rationale before continuing.

### Phase 2 — Architect dispatch

Dispatch `pipeline-architect` with:

- The refined brief from Phase 0.
- The selected pattern from Phase 1.
- Project context (file paths, NOT content).
- Instruction to produce SDD artifacts: `spec.md`, `plan.md`, `tasks.md`.

Wait for the architect's terminal status. Handle non-`DONE` per the status protocol.

### Phase 3 — Preflight validation

Before the human gate, validate `tasks.md`:

- Every spec acceptance criterion has at least one task.
- No orphan tasks (every task references back to an AC or the plan).
- Dependency graph has no cycles.
- Each task has a verifiable acceptance command.

If validation fails, dispatch the architect again with the validation issues. Do NOT proceed to the human gate with broken tasks.

### Phase 4 — Human approval gate

<HARD-GATE>
Before any implementation dispatch, present `spec.md` and `tasks.md` to the user with:

> "Spec and tasks written. Review spec.md and tasks.md before I begin parallel implementation.
> [APPROVE] proceed to /superpipelines:run-pipeline.
> [REVISE] return to spec or plan with feedback."

Wait for APPROVE. If REVISE, route back per the 4D feedback table:
- Wrong goal / missed problem → re-spec (Phase 2 with revised brief).
- Right goal, wrong architecture → re-plan (Phase 2 with new constraints).
- Right plan, task breakdown wrong → re-tasks (Phase 2 with task-specific feedback).

Rationale: Phase 5 (run-pipeline) dispatches N parallel agents. Misunderstood spec means N agents produce wrong output simultaneously. Gate cost: ~1 minute. Ungated mistake cost: discard all parallel work and restart.
</HARD-GATE>

### Phase 5 — Initialize pipeline state

Once APPROVE arrives, initialize `tmp/pipeline-state.json` per `sk-pipeline-state`:

- Generate `pipeline_id` UUID.
- Set `pattern` to the value from Phase 1.
- Populate `phases[]` for the chosen pattern.
- Atomic write (write `.tmp`, then `mv`).

### Phase 6 — Hand off to run-pipeline

Tell the user:

> "Pipeline designed and approved. To execute, run: `/superpipelines:run-pipeline`"

Or if user said "design and run", chain directly into `running-a-pipeline`.

## Common mistakes

- Skipping Phase 0 4D Deconstruct → architect receives a vague brief; produces spec that misses the user's actual intent.
- Skipping the Phase 4 human gate → N parallel implementers produce wrong output simultaneously.
- Validating `tasks.md` after the human gate → user approves broken tasks; re-work later.
- Initializing `pipeline-state.json` before human approval → tracking a state that may be discarded on REVISE.
- Forgetting to emit a clear hand-off to `running-a-pipeline` → user doesn't know how to execute.

## Red Flags — STOP

- "I have enough context, skip the 4D" → STOP. The 4D pass takes 30 seconds and prevents a wrong-spec disaster.
- "The user is in a hurry; skip the human gate" → STOP. The gate is the cheapest checkpoint in the pipeline. ~1 min vs N agent-hours.
- "I'll let the architect figure out the pattern" → STOP. Pattern selection is YOUR job; the architect designs within the chosen pattern.
- "tasks.md looks fine; I'll skip preflight validation" → STOP. Validation catches missed ACs that the architect overlooked. Cheap, mandatory.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The user said 'just run it'" | If 'just' = skip the spec, ask explicitly: "Skip the spec and run as Pattern 1 best-effort?" Don't silently downgrade. |
| "Pattern 5 is overkill for 3 tasks" | Pattern 5's gate prevents the 3 wrong outputs that you'd get without it. Worth the overhead. |
| "I'll let the architect re-architect after the user sees the output" | The cost of N parallel wrong outputs is discarded work + lost trust. Always gate first. |

## Cross-references

- `sk-4d-method` — Phase 0 deconstruction details.
- `sk-spec-driven-development` — Pattern 5 mechanics.
- `sk-pipeline-patterns` — Pattern selection decision tree.
- `sk-pipeline-state` — `pipeline-state.json` initialization.
- `pipeline-architect` agent — does the actual design work.
- `running-a-pipeline` — next workflow after this one.
