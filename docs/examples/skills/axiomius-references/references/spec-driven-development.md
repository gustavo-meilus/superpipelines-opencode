# Spec-Driven Development (SDD) — Deep Dive

> **Canonical skill:** `sk-spec-driven-development`. Preload via `skills:` when an agent will drive SDD; otherwise reference on demand.

SDD IS Pattern 5 of `AI_PIPELINES_LLM.md`. Aligned with GitHub Spec Kit slash commands.

## The slash commands

| Command | Artifact | What it produces |
| :--- | :--- | :--- |
| `/specify` | `spec.md` | WHAT + WHY. No implementation details. User stories, acceptance criteria, non-goals, constraints, open questions. |
| `/clarify` | updated `spec.md` | Resolves ambiguities surfaced during specify. Targeted questions, not open-ended. |
| `/plan` | `plan.md` | HOW. Tech stack, architecture, API contracts, dependency matrix, risks, rollout. |
| `/tasks` | `tasks.md` | Atomic T-# tasks with id, description, files, acceptance criteria, dependencies. 1 agent session / task, 5–30 min each. |
| `/analyze` | validation report | Checks coverage, orphans, cycles, missing AC. Blocks `/implement` on violations. |
| `/checklist` | optional report | Supplementary policy/domain checklist. |
| `/implement` | code + updated state | Executes tasks in parallel RPI loops; writes back to `spec-state.json`. |

## When to trigger SDD

- Multi-step feature where acceptance criteria aren't self-evident.
- Ambiguous user input that needs a contract before execution.
- Cross-stakeholder work (product + eng + QA) requiring a shared artifact.
- Refactors touching >3 files or >2 systems.
- Any task that fails the "can I describe 'done' without looking at code?" test.

## When NOT to trigger SDD

- Single-line typo fixes, config flag flips, variable renames.
- Exploratory research where the spec IS the deliverable.
- Interactive pair-programming where each step is negotiated live.
- Ad-hoc debugging / one-shot grep tasks.

For those: use Pattern 3 (Iterative Loop) or plain RPI in a single session.

## Mapping to AI_PIPELINES Pattern 5

| Spec Kit | Pattern 5 Phase |
| :--- | :--- |
| `/specify` | Phase 1 — `spec.md` |
| `/clarify` + `/plan` | Phase 2 — `plan.md` |
| `/tasks` | Phase 3 — `tasks.md` |
| `/analyze` + `/checklist` | Phase 4 — preflight validation (BLOCK on missing AC) |
| `/implement` | Phase 5 — parallel RPI loops per task |
| automatic | Phase 6 — reconcile `spec-state.json` |

## Task granularity rules

Each task in `tasks.md`:
- `id`: stable T-#
- `description`: one sentence, imperative
- `files`: enumerated paths touched
- `acceptance_criteria`: verifiable via executable command (tsc, lint, test, grep)
- `dependencies`: upstream task IDs (forms a DAG, no cycles)
- `granularity`: 5–30 min of agent work

If acceptance can't be expressed as a command → rewrite the task, not the criterion.

## Integration with axiomius

When axiomius is asked to build a "feature" agent or a multi-phase pipeline:
1. Trigger SDD unless the request matches the "NOT" list above.
2. Preload `sk-spec-driven-development` in the orchestrator skill/agent.
3. Write `spec.md` + `tasks.md` to the target project's `tmp/specs/{feature}/` directory.
4. Emit a topology (Pattern 1/2/3) where each T-# task is an RPI loop.

## Cross-references

- `topology-patterns.md` — Pattern 5 shape + anti-patterns.
- `4d-method-integration.md` — each phase runs through the 4D wrapper.
- `verification-patterns.md` — how acceptance criteria connect to per-task quality gates.
- `sk-spec-driven-development` — canonical skill, artifact skeletons.
