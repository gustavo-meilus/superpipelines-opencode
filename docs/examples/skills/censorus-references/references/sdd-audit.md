# Spec-Driven Development Audit

Multi-step agents (anything that writes code or produces multi-file artifacts) must cite SDD or preload `sk-spec-driven-development`. Reference: `~/.claude/skills/sk-spec-driven-development/SKILL.md`, AI_PIPELINES_LLM.md Pattern 5.

## When SDD applies

SDD is required when an agent:
- Writes code touching >1 file.
- Refactors a system.
- Authors a multi-step pipeline.
- Processes an ambiguous request that needs a contract before execution.

SDD is NOT required for:
- Single-line typo fixes, config flag flips, renames.
- Exploratory research where the spec IS the deliverable.
- Interactive pair-programming steps negotiated live.

## Audit checklist

### A. SDD preload or Pattern-5 reference

- [ ] Agent frontmatter declares `skills: [sk-spec-driven-development, ...]` **OR** body cites AI_PIPELINES Pattern 5.
- [ ] If neither, the agent's scope is narrow enough that SDD does not apply (single-step agent). Document the reasoning.

**Failure (multi-step agent, no SDD reference):** **SEV-1**.

### B. Spec / plan / tasks artifacts named

- [ ] Body mentions `spec.md`, `plan.md`, `tasks.md` by name, OR references `/specify`, `/plan`, `/tasks`, `/implement` commands.
- [ ] Orchestrator agents additionally mention `spec-state.json` for reconciliation.

**Failure:** Artifacts not named → **SEV-2**. Agent will implement without a contract.

### C. Acceptance criteria gate

- [ ] Body enforces: no `/implement` without every acceptance criterion mapped to a task.
- [ ] "Block" or "abort" language is explicit when AC coverage is incomplete.

**Failure:** Agent implements before AC validation → **SEV-1**.

### D. Task granularity

- [ ] Tasks are scoped "1 Agent Session / Task" (5–30 min of work).
- [ ] Each task has: `id`, `description`, `files`, `acceptance_criteria`, `dependencies`.

**Failure:** Task objects lack `acceptance_criteria` → **SEV-1**. Lack `dependencies` or `files` → **SEV-2**.

### E. RPI loop per task

- [ ] Each task runs **Research → Plan → Implement**, with a fresh context window at Implement loading only the plan artifacts.
- [ ] Tasks run in parallel when dependency graph allows (Pattern 2 fan-out within Pattern 5).

**Failure:** Linear-only implementation for independent tasks → **SEV-3** (inefficiency).

### F. Reconciliation

- [ ] After each task completes, `spec-state.json` is updated with `{status, pr, notes}`.
- [ ] `/analyze` re-runs if task scope drifted mid-implementation.

**Failure:** No state reconciliation → **SEV-2**. Orchestrator loses track of progress.

## Common violations

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Agent writes code before spec exists | SDD not preloaded, Phase 1 skipped | Add `skills: [sk-spec-driven-development]`; add gate "do not implement without spec.md". |
| Tasks are vague bullets, not structured | `/tasks` phase skipped | Require the task schema in the agent body. |
| Spec drifts from implementation | No Phase 5 reconciliation | Add `spec-state.json` write after each task. |
