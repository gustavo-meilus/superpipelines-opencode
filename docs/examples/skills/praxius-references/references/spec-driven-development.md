# Applying SDD to Skill Authoring

When and how to use Spec-Driven Development (specify -> plan -> tasks -> implement) as the backbone of an authored skill. Reference: `sk-spec-driven-development` skill.

## When to Apply SDD

Embed SDD when the authored skill will:

- **Produce >=3 artifacts** — multi-file outputs where consistency across files matters.
- **Govern a feature or system** — end-to-end workflows (migration, deployment, scaffolding, release).
- **Coordinate multi-step execution** — ordered tasks with dependencies, verification gates, rollback paths.
- **Contract-before-execution** — the spec is load-bearing; drift between spec and output is a failure.

SDD is Pattern 5 in `AI_PIPELINES_LLM.md`. It IS the orchestration shape for non-trivial skills.

## Map Spec Kit Commands to Skill Sections

When authoring a skill that embeds SDD, map its sections directly to the Spec Kit phases:

| Spec Kit command | Skill section | Content |
| :--- | :--- | :--- |
| `/specify` | **Goal & Acceptance Criteria** | WHAT + WHY, user journeys, AC checklist, non-goals. |
| `/plan` | **Strategy** | Tech stack, architecture, API contracts, risks, rollout. |
| `/tasks` | **Workflow steps** | Ordered task list with id, files, AC, dependencies. |
| `/implement` | **Execution block** | Per-task RPI loop + verification (tsc, lint, tests). |

## Authored-Skill Template

Use this skeleton when authoring an SDD-backed skill:

```markdown
---
name: {skill-name}
description: "{what}. Use when {multi-step trigger}."
---

# {Skill Name}

## Spec (Goal & Acceptance Criteria)       # /specify
- User journey: {scenario -> outcome}
- AC-1: {verifiable outcome}
- AC-2: ...
- Non-goals: {out-of-scope}
- Constraints: {regulatory, perf, compat}

## Plan (Strategy)                          # /plan
- Tech stack: {libs, versions}
- Architecture: {layer diagram / data flow}
- Contracts: {schemas, signatures}
- Risks & mitigations: {high-stakes -> fix}

## Tasks (Workflow steps)                   # /tasks
### T-1: {short name}
- Files: {list}
- Acceptance: {verifiable}
- Depends on: {T-0 or none}

## Implement (Execution)                    # /implement
For each task:
1. Research: read referenced files.
2. Plan: compress into mini-spec.
3. Implement: write the change.
4. Verify: run {tsc|lint|tests}; report pass/fail.
5. Reconcile: update `spec-state.json`.
```

Each task block MUST carry its own verification step. The Implement section is where the skill executes, not where it loosens.

## Cross-reference sk-spec-driven-development

Do not duplicate SDD internals in the authored skill. Keep the skill's SDD section tight (template + gates) and defer deep-dive content to `sk-spec-driven-development` via either:

- Agent preload: `skills: [sk-spec-driven-development]` on the orchestrator.
- Body pointer: `For full Spec Kit semantics, see sk-spec-driven-development.`

## Anti-pattern: Over-speccing Simple Skills

Do NOT apply SDD when the skill is:

- **Single-prompt -> single-output** — commit message generator, naming helper, one-shot summarizer.
- **Stateless transform** — no artifacts persisted, no dependencies between steps.
- **Purely conversational** — critique, brainstorm, Q&A where each exchange is negotiated live.

For these, use the 4D processing wrapper or a plain prompt. SDD adds spec.md/plan.md/tasks.md ceremony with no payoff — the spec is longer than the output. If the skill has one prompt and one output, SDD is pure overhead.

Signal: if you cannot name >=3 distinct artifacts and >=2 task dependencies, SDD is the wrong scaffold.
