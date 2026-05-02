# Fix Templates

Canonical, ready-to-paste snippets for the most common audit findings. Use `Edit` for targeted fixes; `Write` only when >50% of the prompt changes.

## 1. Reduce agent body under 150 lines via reference extraction

**Before:** Agent body contains a 60-line compliance matrix and 50-line anti-pattern list inline.

**After:** Keep a 5-line pointer; move the bulk to `~/.claude/skills/{agent}-references/references/`.

```markdown
<audit_references>
Full compliance matrix, anti-patterns, severity levels, and fix templates live in
`~/.claude/skills/{agent}-references/references/`. Read them on demand during audits:

- `compliance-matrix.md`, `anti-patterns.md`, `severity-classification.md`
- `fix-templates.md`, `audit-report-template.md`
</audit_references>
```

## 2. Convert first-person description to third-person

**Before:** `description: "I audit agent prompts. Use me for reviewing agents."`

**After:** `description: "Audits agent prompts against a structured compliance framework. Use for reviewing, diagnosing, or improving agent definitions."`

## 3. Extract matrix / anti-patterns to ref files

When an inline `<compliance_matrix>` or `<anti_patterns>` block > 20 lines, move the table to `references/compliance-matrix.md` and leave a pointer:

```markdown
<compliance_matrix>
See `~/.claude/skills/{agent}-references/references/compliance-matrix.md` for all
20 criteria. Read before every audit.
</compliance_matrix>
```

## 4. Add 4D preload

In the agent frontmatter:

```yaml
skills:
  - sk-4d-method
```

Optionally cite in the body:

```markdown
<processing_framework>
Apply the 4D Method (Deconstruct → Diagnose → Develop → Deliver) from `sk-4d-method`
on every invocation before emitting output.
</processing_framework>
```

## 5. Add SDD preload

```yaml
skills:
  - sk-spec-driven-development
```

Body reference:

```markdown
<multi_step_workflow>
Multi-step tasks follow Spec-Driven Development (Pattern 5): spec → plan → tasks →
implement. See `sk-spec-driven-development`. Block `/implement` if any acceptance
criterion lacks a task.
</multi_step_workflow>
```

## 6. Add AI_PIPELINES read step

```markdown
<canonical_rules>
Before emitting any structural recommendation, read `~/.claude/AI_PIPELINES_LLM.md`
for the strict conventions (SUB_AGENT_SPAWNING, MODEL_SELECTION, path variables,
cache discipline). Do not recommend patterns that violate them.
</canonical_rules>
```

## 7. Remove redundant `PreToolUse` Bash-allow hook

When `permissions.allow` contains `Bash(*)`:

```yaml
# REMOVE this block — Bash(*) already allows all bash variants:
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: 'echo ''{"permissionDecision": "allow"}'''
```

## 8. Convert inline anti-patterns block to ref

```markdown
<anti_patterns>
Scan for the 19 documented patterns in
`~/.claude/skills/{agent}-references/references/anti-patterns.md`. For each found,
cite its specific location (line range or snippet) in the audited prompt.
</anti_patterns>
```

## 9. De-duplicate `defaultMode`

Only the top-level `defaultMode` is valid. Remove any copy inside `permissions`:

```yaml
# settings.json
{
  "defaultMode": "acceptEdits",  // keep only this
  "permissions": {
    // "defaultMode": "..."       // REMOVE — duplicate
    "allow": ["Bash(*)", ...]
  }
}
```

## 10. Convert Opus to Sonnet (pipeline)

```yaml
# Before
model: opus
# After — pipelines are SONNET_ONLY; scale reasoning via effort
model: sonnet
effort: high
```
