---
description: Design a new multi-agent AI pipeline (spec → plan → tasks) with a human approval gate before parallel implementation
argument-hint: [brief description of the pipeline]
---

# /superpipelines:new-pipeline

Invoke the `creating-a-pipeline` skill to design a new pipeline from the user's brief.

Brief: $ARGUMENTS

If the brief is empty, ask the user 1–2 questions to elicit the goal, then proceed with `creating-a-pipeline`.

The skill will:

1. Run the 4D Method on the brief.
2. Select an execution pattern (Sequential / Fan-Out / Iterative / Human-Gated / SDD).
3. Dispatch `pipeline-architect` to produce `spec.md`, `plan.md`, `tasks.md`.
4. Validate `tasks.md` (every AC covered, no orphans, no cycles).
5. Present spec + tasks to the user with a HARD-GATE for APPROVE / REVISE.
6. On approval, initialize `tmp/pipeline-state.json` and hand off to `/superpipelines:run-pipeline`.

Do NOT skip the 4D pass or the human gate.
