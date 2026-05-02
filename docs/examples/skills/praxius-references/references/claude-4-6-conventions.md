# Claude 4.6 Conventions for Skill Authoring

Current (April 2026) conventions specific to authoring SKILL.md files on Claude 4.6. Canonical reference: `sk-claude-code-conventions`.

## Frontmatter Schema (all current fields)

```yaml
---
name: {lowercase-hyphens, <=64 chars, matches directory, no reserved words}
description: {<=1024 chars, third person, "<what>. <when to use>."}
when_to_use: {optional, extends description, counts toward 1536-char cap}
argument-hint: {e.g. "[issue-number]"}
disable-model-invocation: {true | false — default false; true = reference-only}
user-invocable: {true | false — default true}
allowed-tools: {space-separated or YAML list, tools allowed without prompt}
model: {optional override, e.g. sonnet, opus, haiku}
effort: {low | medium | high | xhigh | max}
context: {fork = run in forked subagent}
agent: {subagent type when context: fork, e.g. Explore}
hooks: {PreToolUse, PostToolUse, Stop, UserPromptSubmit, ...}
paths: {glob patterns; skill activates only when matching files in context}
shell: {bash | powershell}
---
```

Every field is optional except `name` and `description`. Reach for the rest only when needed — extra fields are extra tokens on every session load.

## Progressive Disclosure Rules

- **SKILL.md body <=500 lines** (hard ceiling). Split if approaching.
- **Refs one level deep** from SKILL.md. Never nest `references/` inside `references/` — Claude truncates on partial reads.
- **Long refs (>100 lines) include a table of contents** at the top for efficient navigation.
- **Metadata pre-loads** (~100 tokens/skill in system context). **Body loads** on invocation. **Refs load** only when SKILL.md instructs Claude to read them.
- SKILL.md serves as a navigation index; references carry depth.

## Prompt Caching in Skills

Low cache-hit rate = SEV at Anthropic. Skills must preserve the static prefix:

- **Stable skills list.** Never mutate the skills container mid-session. Adding/removing a skill invalidates the entire cache prefix.
- **No mid-session mutation.** Keep `allowed-tools`, `skills:`, and frontmatter consistent across requests in the same container.
- **No dynamic timestamps** in SKILL.md body. Use version notes at the bottom, not inline dates that shift.
- **Static first, dynamic last.** System prompt -> skills -> tools -> conversation history.
- **`ultrathink` trigger** — including the literal word `ultrathink` in SKILL.md body enables extended thinking when the skill is active. Use sparingly; it costs tokens.

## `context: fork` + `agent: Explore` Pattern

For research skills that should run isolated from the main conversation:

```yaml
---
name: deep-research
description: "Researches a topic end-to-end and returns a summary. Use when..."
context: fork
agent: Explore
---
```

- SKILL.md body becomes the subagent's prompt.
- Main thread gets only the final summary — no intermediate file reads polluting context.
- Use for: isolated analysis, repo archaeology, multi-file synthesis with a single report output.

## Adaptive Thinking per Skill

Claude 4.6 uses `thinking: {type: "adaptive"}` — model calibrates per query and effort parameter. Override per-skill only when needed:

- **Default** — inherit from parent agent (`effort: high` for architects, `medium` for workers, `low` for triage).
- **Override via `effort:`** — when the skill demands more or less reasoning than the parent agent's baseline.
- **`ultrathink` keyword** — for skills that require deep reasoning regardless of parent effort.
- **`max_tokens`** — 64k recommended for autonomous multi-step skills at medium+ effort.

Thinking blocks CAN be cached in previous assistant turns; they count as input tokens on cache read.

## Anti-patterns

- **Deep-nested refs.** `references/a/b/c.md` — Claude reads the top of a file and truncates. Keep refs one level deep.
- **First/second person descriptions.** "I help you..." / "You can use this to..." — breaks discovery. Third person only.
- **Descriptions >1024 chars.** Truncates in the skill index. If you cannot describe the skill concisely, it is doing too much — split it.
- **Time-sensitive info in body.** "As of March 2026..." inline dates shatter prompt-cache prefix matching and decay. Use a collapsible "Old patterns" section or a version-notes block at the bottom of SKILL.md.
- **Mutating the skills list mid-session.** Invalidates the cache prefix — use mode-switching tools, not skill churn.
- **`defer_loading` for tool management.** Use ToolSearch-style discovery instead.
- **Mixing preload + on-demand refs.** Shared method skills (sk-4d-method, sk-spec-driven-development) preload via `skills:`. Agent-specific refs load on demand via `Read`. Never mix the two modes.
