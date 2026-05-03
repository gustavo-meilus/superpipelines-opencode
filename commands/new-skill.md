---
description: Design a new SKILL.md file with a triggering-only description, progressive disclosure, and (when applicable) Red Flags + Rationalization Table
argument-hint: [skill name and capability]
---

# /superpipelines:new-skill

Dispatch the `skill-architect` subagent.

Brief: $ARGUMENTS

The architect will:

1. Determine operating mode (ARCHITECT / QUICK-BUILD / DIAGNOSE / EXTRACT / ITERATE).
2. Glob existing skills to avoid name collisions.
3. Write the description FIRST per `skill-architect-references/description-engineering.md`.
4. Choose body length tier (single SKILL.md vs SKILL.md + references/).
5. Build the skill following `skill-architect-references/skill-architecture.md` template.
6. Validate against the Validation Checklist before delivery.
7. Deliver Architect's Brief + 3–5 routing test prompts.

For discipline-enforcing skills, include Red Flags + Rationalization Table per `sk-rationalization-resistance`.
