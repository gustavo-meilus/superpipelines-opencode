# Claude Code Skill Specification

## Overview

Claude Code skills are Markdown files (SKILL.md) with YAML frontmatter, stored in a directory structure. Skills follow the Agent Skills open standard (agentskills.io) with Claude Code extensions for invocation control, subagent execution, and dynamic context injection.

Three-level loading system:

1. **Description** -- Always in context (~2% of context window budget)
2. **SKILL.md body** -- Loaded when skill is invoked (keep under 500 lines)
3. **Supporting files** -- Loaded on demand by the agent when referenced

## Storage Locations

Skills are directories containing SKILL.md as the entrypoint:

| Scope      | Path                                         | Priority    |
|------------|----------------------------------------------|-------------|
| Enterprise | Managed settings                             | 1 (highest) |
| Personal   | `~/.claude/skills/<skill-name>/SKILL.md`     | 2           |
| Project    | `.claude/skills/<skill-name>/SKILL.md`       | 3           |
| Plugin     | `<plugin>/skills/<skill-name>/SKILL.md`      | 4 (lowest)  |

Higher-priority locations win when skills share the same name. Nested `.claude/skills/` directories are auto-discovered for monorepo support.

Directory structure:

```
skill-name/
├── SKILL.md           # Required -- main instructions
├── references/        # Optional -- detailed documentation
│   └── api-docs.md
├── scripts/           # Optional -- utility scripts
│   └── validate.sh
└── assets/            # Optional -- templates, configs
    └── template.md
```

## Frontmatter Fields

All fields are optional. Only `description` is strongly recommended.

### name

Display name and `/slash-command`. If omitted, uses directory name. Lowercase letters, numbers, and hyphens only (max 64 characters).

### description

What the skill does and when to use it. Claude uses this to decide when to load the skill automatically. If omitted, uses the first paragraph of markdown content. Max budget: ~2% of context window.

### argument-hint

Hint shown during autocomplete. E.g., `[issue-number]` or `[filename] [format]`.

### disable-model-invocation

Default: `false`. Set to `true` to prevent Claude from auto-loading this skill. Only the user can invoke it via `/name`. Use for workflows with side effects (deploy, send-message, commit).

### user-invocable

Default: `true`. Set to `false` to hide from the `/` menu. Only Claude can invoke it. Use for background knowledge (legacy-system-context, domain-knowledge).

### allowed-tools

Tools Claude can use without permission prompts when this skill is active. E.g., `Read, Grep, Glob` for a read-only skill.

### model

Model to use when this skill is active.

### context

Set to `fork` to run in a forked subagent context. The skill content becomes the subagent's task prompt. Only makes sense for skills with explicit task instructions.

### agent

Which subagent type to use when `context: fork` is set. Options: `Explore`, `Plan`, `general-purpose`, or any custom subagent from `.claude/agents/`. Default: `general-purpose`.

### hooks

Hooks scoped to this skill's lifecycle.

## Invocation Control

| Frontmatter                      | User invokes | Claude invokes | Context loading                       |
|----------------------------------|-------------|----------------|---------------------------------------|
| (default)                        | Yes         | Yes            | Description always, body when invoked |
| `disable-model-invocation: true` | Yes         | No             | Description NOT in context            |
| `user-invocable: false`          | No          | Yes            | Description always, body when invoked |

## String Substitutions

Skills support dynamic value injection in the markdown body:

| Variable               | Description                                   |
|------------------------|-----------------------------------------------|
| `$ARGUMENTS`           | All arguments passed when invoking the skill  |
| `$ARGUMENTS[N]`        | Specific argument by 0-based index            |
| `$N`                   | Shorthand for `$ARGUMENTS[N]`                 |
| `${CLAUDE_SESSION_ID}` | Current session ID for logging/correlation    |

If `$ARGUMENTS` is not present in content, arguments are appended as `ARGUMENTS: <value>`.

## Dynamic Context Injection

The `` !`command` `` syntax runs shell commands BEFORE the skill content is sent to Claude. The command output replaces the placeholder.

Example:

```yaml
---
name: pr-summary
context: fork
agent: Explore
---
## PR context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`

Summarize this pull request...
```

This is preprocessing -- Claude only sees the final rendered result.

## Context Fork Pattern

Add `context: fork` to run a skill in an isolated subagent context. The skill content becomes the task that drives the subagent.

Only makes sense for skills with explicit action instructions. A skill with only guidelines (e.g., "use these API conventions") will return without meaningful output because the subagent has no task.

The `agent` field picks which subagent executes the skill:

- `Explore` -- Read-only, fast, optimized for codebase search
- `Plan` -- Research for planning, read-only
- `general-purpose` -- Full tool access (default)
- Any custom subagent name from `.claude/agents/`

---

## Multi-Model Notes

### Claude 4.x

- For Claude Code skills (SKILL.md), use standard Markdown headings -- the file is Markdown with YAML frontmatter.
- Use XML tags only when the skill will be injected into a system prompt (non-Claude Code contexts).
- Leverage Claude's natural conciseness -- avoid over-specifying obvious behaviors.
- Claude responds well to reasoning-based instructions; lean into "explain the why" over rigid commands.
- In Claude Code, skill descriptions compete for a ~2% context window budget. Keep descriptions concise but assertive to counter undertriggering.
- Use `disable-model-invocation: true` for side-effect skills (deploy, commit, send). Use `user-invocable: false` for background knowledge skills.
- Use `context: fork` + `agent: Explore` for research skills that produce verbose output. This isolates the output from the main conversation.

### Gemini 3

- Use consistent delimiters throughout (XML or Markdown, not mixed).
- Place the most critical instructions at the end of the skill for long-context scenarios (recency bias).
- Include explicit self-verification: "Before delivering output, check against all constraints."

### GPT-4.1+

- Use Markdown headings and standard formatting.
- Include explicit chain-of-thought triggers for complex workflows.
- Leverage structured output schemas when the skill produces JSON.
