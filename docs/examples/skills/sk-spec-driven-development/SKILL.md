---
name: sk-spec-driven-development
description: Reference template for Spec-Driven Development (specify -> plan -> tasks -> implement) aligned with GitHub Spec Kit. Use when authoring or iterating on multi-step agents/skills that benefit from a spec contract before execution.
user-invocable: false
disable-model-invocation: true
---

# Spec-Driven Development (SDD) — Skill Execution Instructions

> **Purpose:** Embed these instructions inside a Claude Skill or Agent body to force structured spec→plan→tasks→implement flow before code is written.
>
> **Compatibility:** Claude 4.6 (Sonnet/Opus/Haiku), Claude Code (Apr 2026 standard). Aligned with GitHub Spec Kit slash commands.

---

## How to Use This Skill

Either:
- Preload in an agent's `skills:` frontmatter (full content injected at startup), OR
- Reference from a SKILL.md body (`See sk-spec-driven-development for SDD flow`).

Trigger SDD when: building a new feature, refactoring a system, authoring a multi-step agent, or when the user's request is ambiguous and needs a contract before execution.

---

## The Four Phases (GitHub Spec Kit)

### Phase 1: SPECIFY (`/specify`)
Generate **spec.md** capturing WHAT and WHY — no implementation details.

- User journeys / user stories
- Success criteria / acceptance criteria
- Non-goals
- Constraints (regulatory, performance, compatibility)
- Open questions (defer to `/clarify`)

**Gate:** spec.md must be readable without looking at code. If a reader can't answer "what does 'done' look like?" — the spec is incomplete.

### Phase 1.5: CLARIFY (`/clarify`, optional)
Resolve ambiguities surfaced in spec.md. Ask targeted questions; do NOT move forward with hidden assumptions.

### Phase 2: PLAN (`/plan`)
Generate **plan.md** — the HOW.

- Tech stack, libraries, versions
- Architecture (layer diagram, data flow, contracts)
- Dependency matrix
- Risks + mitigations
- Rollout strategy
- Explicit design decisions (not "we'll figure it out")

### Phase 3: TASKS (`/tasks`)
Generate **tasks.md** — break plan.md into small, reviewable chunks.

Each task MUST have:
- `id`: stable identifier (T-1, T-2, …)
- `description`: one sentence
- `files`: list of files touched
- `acceptance_criteria`: verifiable outcomes
- `dependencies`: upstream task IDs
- `granularity`: 1 Agent Session / Task (5–30 min of work)

### Phase 3.5: ANALYZE / CHECKLIST (`/analyze`, `/checklist`, optional)
Validate tasks.md for:
- All spec acceptance criteria covered by tasks
- No orphan tasks
- Dependency graph has no cycles
- Each task has AC

**BLOCK `/implement` if any acceptance criterion lacks a task.**

### Phase 4: IMPLEMENT (`/implement`)
Execute tasks in parallel where deps allow, each through its own RPI loop:

- **Research**: fill context with discovery (read files, grep, search)
- **Plan**: compress findings into the task's mini-spec
- **Implement**: fresh context window, only the plan artifacts loaded

Each task: write → verify (tsc, lint, tests) → report pass/fail → reconcile `spec-state.json`.

### Phase 5: RECONCILE
Update `spec-state.json` with completion status per task. Re-run `/analyze` if tasks drifted.

---

## Artifact Templates

### spec.md skeleton
```markdown
# Feature: {name}

## Context & motivation
{why now, what prompted this}

## User journeys
{scenario → outcome}

## Success criteria (AC)
- [ ] AC-1: {verifiable outcome}
- [ ] AC-2: …

## Non-goals
{out-of-scope things}

## Constraints
{regulatory, perf, compat, timeline}

## Open questions
{for /clarify}
```

### plan.md skeleton
```markdown
# Plan: {feature name}

## Tech stack
{libs, versions, runtimes}

## Architecture
{layer diagram, sequence diagram, data flow}

## API contracts
{schemas, signatures, I/O}

## Dependency matrix
| Component | Depends on | Owned by |

## Risks & mitigations
{high-stakes risk → mitigation}

## Rollout plan
{staged, flags, canary}
```

### tasks.md skeleton
```markdown
# Tasks

## T-1: {short name}
- Description: {one sentence}
- Files: {list}
- Acceptance: {verifiable}
- Depends on: {T-0 or none}

## T-2: …
```

### spec-state.json skeleton
```json
{
  "spec_id": "feat-xyz",
  "phase": "IMPLEMENT",
  "tasks": {
    "T-1": {"status": "done", "pr": null, "notes": ""},
    "T-2": {"status": "in_progress"}
  }
}
```

---

## Integration with Pattern 5 (AI_PIPELINES_LLM.md)

SDD IS Pattern 5 of the orchestration reference. The six phases map directly:

| Spec Kit command | AI_PIPELINES Pattern 5 Phase |
| :--- | :--- |
| `/specify` | Phase 1: spec.md |
| `/clarify` + `/plan` | Phase 2: plan.md |
| `/tasks` | Phase 3: tasks.md |
| `/analyze` + `/checklist` | Phase 4: preflight validation |
| `/implement` | Phase 5: parallel RPI loops |
| (automatic) | Phase 6: reconcile state.json |

---

## When NOT to use SDD

- Single-line typo fixes, config flag flips, renames.
- Exploratory research where the spec IS the deliverable.
- Interactive pair-programming where each step is negotiated live.

For those: use Pattern 3 (Iterative Loop) or plain RPI.

---

## Cross-references

- **`sk-4d-method`** — every phase above runs through the 4D processing wrapper.
- **`sk-claude-code-conventions`** — adaptive thinking settings, prompt-cache discipline, frontmatter schemas.
- **`~/.claude/AI_PIPELINES_LLM.md`** — Pattern 5 canonical definition; strict conventions.

---

## Version notes

- **Updated** April 2026
- **Target models** Claude Sonnet 4.6, Opus 4.6, Haiku 4.5
- **Skill format** Agent Skills Open Standard (YAML frontmatter + markdown body)
- **Related** GitHub Spec Kit (https://github.com/github/spec-kit)
