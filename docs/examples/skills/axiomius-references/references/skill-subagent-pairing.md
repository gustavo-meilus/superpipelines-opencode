# Skill–Subagent Pairing Patterns

Three canonical ways to pair a skill with a subagent. Pick one per pairing; do not mix.

## Pattern A — Skill with `context: fork` (forked skill)

The skill runs as a forked subagent prompt. SKILL.md body becomes the subagent's system prompt.

```yaml
# SKILL.md
---
name: research-explorer
description: Explores codebase for a given topic and returns a structured brief.
context: fork
agent: Explore
---
```

**Use when:** isolated research/analysis tasks with explicit instructions and no conversation-history dependency. The caller invokes the skill; it runs in a fresh forked context; result returns as a single structured message.

**Strengths:** zero context pollution in the caller; the skill is effectively a one-shot tool.

**Weaknesses:** no streaming back to parent; cannot do multi-turn negotiation with caller.

## Pattern B — Subagent preloads shared method skills

The subagent's `skills:` frontmatter preloads shared method skills. Full skill content injects at subagent startup.

```yaml
# .claude/agents/my-agent.md
---
name: my-agent
skills:
  - sk-4d-method
  - sk-spec-driven-development
  - sk-claude-code-conventions
---
```

**Use when:** every orchestrator or worker agent that needs consistent methodology (4D, SDD, Claude 4.6 conventions).

**Strengths:** consistent method across agents; no duplicated instructions in each agent body; cache-friendly if skills list is stable.

**Weaknesses:** injects at startup — full cost even if the method is unused in the session. Do NOT preload large or rarely-used skills here.

## Pattern C — Agent + companion `{agent}-references/` skill

Agent body is short (<=150 lines). A companion skill `{agent-name}-references/` holds `references/*.md` files the agent reads on demand via `Read`.

```
.claude/agents/my-agent.md            # <=150 lines
~/.claude/skills/my-agent-references/
├── SKILL.md                          # navigation index only, disable-model-invocation
└── references/
    ├── core-philosophy.md
    ├── topology-patterns.md
    └── ...
```

Companion skill frontmatter:
```yaml
---
name: my-agent-references
description: Reference library for my-agent. Contains ...
user-invocable: false
disable-model-invocation: true
---
```

**Use when:** agent has deep reference material (matrices, anti-patterns, templates, schemas) that is consulted occasionally, not always.

**Strengths:** zero startup cost for the references; agent body stays lean; progressive disclosure; cache-friendly.

**Weaknesses:** agent must know the reference filenames. Keep the SKILL.md body as a clean index.

## Decision tree

```
Is the skill always needed on every turn?
├─ YES → Pattern B (preload via skills:)
└─ NO
   ├─ Does the agent call the skill as a one-shot tool?
   │   └─ YES → Pattern A (context: fork)
   └─ NO
       └─ Is the content deep reference material?
           └─ YES → Pattern C (companion-references + Read on demand)
```

## Anti-patterns

- Preloading a companion `{agent}-references` skill via `skills:` — bloats context. Use `Read` on demand.
- Mixing shared-method skills (preload) and agent-specific refs (on demand) into the same skill — keeps them separated.
- Nesting references deeper than one level from SKILL.md — agents partial-read or lose track.
- Skills that cover multiple unrelated capabilities — each skill has a single capability.

## Cross-references

- `agent-frontmatter-schema.md` — full `skills:` field semantics.
- `anti-patterns.md` — deeper anti-patterns list.
- `AI_PIPELINES_LLM.md` → `<skill_agent_pairing_convention>` — canonical rules.
