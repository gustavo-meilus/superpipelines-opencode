# Fix Templates — Auditor Reference

Canonical fixes for common findings. Use as Edit templates when the user requests remediation.

## Table of contents

1. Description summarizes workflow
2. Agent body >150 lines
3. `permissionMode` in frontmatter
4. `memory: project` / `memory: local`
5. Skill preload includes workflow skill
6. Reviewer agent has Write/Edit
7. Pattern 3 missing iteration cap
8. Hardcoded plugin path
9. Missing capability contract
10. Per-agent Bash hook with global allow

---

## Fix 1 — Description summarizes workflow

**Symptom:** Description includes verbs describing what the skill does ("processes", "reads", "writes").

**Before:**
```yaml
description: Processes Excel files by reading sheets, cleaning data, and generating charts. Use when working with spreadsheets.
```

**After:**
```yaml
description: Use when working with Excel files, spreadsheets, or .xlsx data extraction.
```

## Fix 2 — Agent body >150 lines

**Action:** Split into body + companion `<agent>-references/references/*.md`.

1. Identify the deepest sections (frontmatter schemas, anti-pattern catalogs, decision trees).
2. Move them to `skills/<agent>-references/references/<topic>.md`.
3. In the body, replace the section with a 1–3 line summary + "Read `references/<topic>.md` for detail."
4. Verify body ≤150 lines.

## Fix 3 — `permissionMode` in frontmatter

**Before:**
```yaml
permissionMode: acceptEdits
```

**After:** Remove the field entirely. Move equivalent permission to plugin `settings.json`:

```json
{
  "permissions": { "allow": ["Bash(*)", "Edit(*)"] }
}
```

## Fix 4 — `memory: project` / `memory: local`

**Before:**
```yaml
memory: project
```

**After:** Remove. Convert to `pipeline-state.json` writes per `sk-pipeline-state` schema.

## Fix 5 — Skill preload includes workflow skill

**Before:**
```yaml
skills:
  - sk-4d-method
  - brainstorming
  - executing-plans
```

**After:**
```yaml
skills:
  - sk-4d-method
```

Workflow skills (`brainstorming`, `executing-plans`, etc.) are session-level lazy invocation, not pre-injection. Reference them in body text instead.

## Fix 6 — Reviewer agent has Write/Edit

**Before:**
```yaml
tools: Read, Write, Edit, Glob, Grep
```

**After:**
```yaml
tools: Read, Glob, Grep
disallowedTools: Write, Edit
```

## Fix 7 — Pattern 3 missing iteration cap

**Before (in body):**
```markdown
Loop until tests pass.
```

**After:**
```markdown
Loop bounded by `MAX_ITERATIONS: 3`. After 3 failures without measurable progress (failure count not decreasing), STOP and escalate per `sk-pipeline-patterns` Pattern 3 escalation protocol.
```

## Fix 8 — Hardcoded plugin path

**Before:**
```markdown
Read ~/.claude/agents/code-reviewer.md
```

**After:**
```markdown
Read ${CLAUDE_PLUGIN_ROOT}/agents/code-reviewer.md
```

## Fix 9 — Missing capability contract

**Action:** Add near top of agent body:

```markdown
# Inputs required: {list of required context fields}
# Output schema: { "status": "DONE|BLOCKED|...", "outputs": [...] }
# Breaking change log: v1.0 — initial release
```

## Fix 10 — Per-agent Bash hook with global allow

**Action:** Remove the hooks block from agent frontmatter when plugin `settings.json` already has `Bash(*)` in `permissions.allow`. Verify before removing — without the global allow, removing the hook breaks the agent.
