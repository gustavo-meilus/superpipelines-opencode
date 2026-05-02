# Frontmatter Audit

Validate every YAML frontmatter field against the Agent Skills Open Standard + Claude Code sub-agent schema. Reference: `sk-claude-code-conventions` sections 5–6.

## Sub-agent / skill shared fields

### `name`
- [ ] Present.
- [ ] ≤ 64 chars.
- [ ] Lowercase + hyphens only. No spaces, CamelCase, underscores, XML tags.
- [ ] Reserved words excluded: `anthropic`, `claude`.
- [ ] File name matches `name`.

### `description`
- [ ] Present.
- [ ] ≤ 1024 chars.
- [ ] Third person only ("Audits …", "Generates …"). No "I can…" / "You can…". **SEV-1** if violated.
- [ ] Pattern: `<what it does>. <when to use it>.`
- [ ] Front-loads the key use case (truncation at ~1536 chars when combined with `when_to_use`).
- [ ] Includes trigger keywords a user would naturally say.

### `when_to_use` (optional, skills only)
- [ ] If present, extends description; counts toward combined 1536-char cap.

### `tools`
- [ ] Whitelist only tools the agent actually uses.
- [ ] OR omitted to inherit thread tools.
- [ ] Read-only agents do NOT list `Write` / `Edit`. **SEV-1** if violated.
- [ ] No conflict with `disallowedTools`.

### `disallowedTools`
- [ ] If present, does not re-list a tool already omitted from `tools` (redundant).

### `model`
- [ ] Valid current ID: `claude-sonnet-4-6` / `claude-opus-4-7` / `claude-haiku-4-5-20251001`.
- [ ] OR short form: `sonnet` / `opus` / `haiku`.
- [ ] No retired model IDs. **SEV-1**.

### `effort`
- [ ] Valid: `low | medium | high | xhigh | max`.
- [ ] Matches agent tier (auditor = high; worker = medium; triage = low).

### `maxTurns`
- [ ] Integer.
- [ ] Reasonable upper bound (5–30 for most agents; higher for long-horizon orchestrators).

### `hooks`
- [ ] Valid Claude Code hook schema (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, etc.).
- [ ] No redundant `PreToolUse` Bash-allow hook if `Bash(*)` already in `permissions.allow`. **SEV-2**.

### `skills:`
- [ ] Array of skill names.
- [ ] Each skill exists in `~/.claude/skills/` or project `.claude/skills/`.
- [ ] Preloads method skills only (`sk-*`), NOT companion reference skills.

### Forbidden / discouraged

- [ ] **`permission_mode`** — must NOT be in frontmatter. **SEV-1**.
- [ ] **`memory: project` / `memory: local`** — must NOT be set. State in `tmp/`. **SEV-1**.
- [ ] **`MODEL_SELECTION: OPUS`** in pipelines — forbidden. **SEV-0**.

## Skill-only fields

### `user-invocable`
- [ ] `true | false`. Default `true`.
- [ ] Reference-only companion skills: `user-invocable: false`.

### `disable-model-invocation`
- [ ] `true | false`. Default `false`.
- [ ] Reference-only companion skills: `disable-model-invocation: true`.

### `allowed-tools`
- [ ] Space-separated or YAML list — tools permitted without prompt.

### `context: fork`
- [ ] Valid only when skill runs as forked subagent.
- [ ] Paired with `agent: <subagent-type>`.

### `agent`
- [ ] Subagent type name. Required when `context: fork`.

### `paths`
- [ ] Glob patterns. Skill activates only when matching files are in context.

### `argument-hint`
- [ ] String template (e.g. `"[issue-number]"`) for slash-command skills.

### `shell`
- [ ] `bash | powershell`.
