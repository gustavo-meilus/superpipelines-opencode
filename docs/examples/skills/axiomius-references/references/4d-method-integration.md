# 4D Method Integration (Pattern 6)

> **Canonical skill:** `sk-4d-method`. The 4D Method is Pattern 6 in `AI_PIPELINES_LLM.md` — a per-invocation processing wrapper that runs INSIDE Patterns 1–5, not a workflow of its own.

## The four phases (one-line)

1. **DECONSTRUCT** — extract core intent, entities, missing slots; restate task; GATE if >=3 critical slots missing.
2. **DIAGNOSE** — replace vague terms with measurable specs; split overloaded asks; resolve constraint conflicts; anticipate top 2–3 failure modes.
3. **DEVELOP** — match task type to strategy; assign role; define output format; layer constraints (primacy + recency).
4. **DELIVER** — lead with conclusion; match user context; emit actionable next step; self-review.

## When to embed 4D in a created agent/skill

Embed 4D when the agent will encounter:
- **Ambiguous user inputs** (free-form prompts, vague descriptions, marketing briefs).
- **Creative craft** (copywriting, design feedback, naming).
- **Technical craft that needs structured reasoning** (code review, architecture review, audit).
- **Multi-stakeholder outputs** (spec drafting, cross-team documents).

Do NOT embed 4D when the agent will only handle:
- Deterministic transforms (format A → format B).
- Pure extraction/search tasks.
- Single-shot tool wrappers.

## How to embed — two mechanisms

### Mechanism A: Preload via `skills:` frontmatter (preferred)

```yaml
---
name: my-agent
skills:
  - sk-4d-method
---
```

Skill content injects at agent startup. Zero duplication. Preferred for any agent that handles free-form inputs.

### Mechanism B: Inline block in SKILL.md body

For a SKILL.md that must process ambiguous inputs but cannot rely on a preloaded skill, paste the 4D block between the `<!-- BEGIN -->` and `<!-- END -->` markers in `sk-4d-method`'s SKILL.md.

Use only when: the skill is distributed standalone, or the target environment does not support `skills:` preload.

## Behavioral rules inside an agent that uses 4D

- Run all four phases internally by default. Surface output only on explicit "show 4D" / "walk me through it".
- Compress phases on trivially simple requests; do not over-engineer.
- Route feedback to the correct phase on iteration:
  - Intent drift → re-Deconstruct.
  - Vague/wrong → re-Diagnose.
  - Approach/structure → re-Develop.
  - Polish/format → re-Deliver.

## Interaction with other patterns

4D runs on every agent turn in Patterns 1–5. It does not replace Pattern 5's `/specify → /plan → /tasks → /implement` arc — it refines each phase's input/output. An SDD agent invoked with an ambiguous request first runs 4D, then produces `spec.md`.

## Cross-references

- `topology-patterns.md` — Pattern 6 shape and anti-patterns.
- `spec-driven-development.md` — 4D runs inside SDD phases.
- `sk-4d-method` — canonical block + examples.
