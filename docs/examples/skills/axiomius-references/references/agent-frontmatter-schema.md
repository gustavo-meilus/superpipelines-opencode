# Agent & Skill Frontmatter Schema (Claude 4.6)

## 1. Sub-agent frontmatter (`.claude/agents/<name>.md`)

```yaml
---
name: lowercase-hyphens           # required, filename must match, <=64 chars
description: "<what>. <when>."    # required, third person, <=1024 chars
tools: Read, Grep, Glob, Bash     # whitelist; omit to inherit thread tools
disallowedTools: Write, Edit      # explicit deny-list
model: sonnet                     # SONNET_ONLY in pipelines
effort: low | medium | high       # scales adaptive thinking
maxTurns: 30                      # bound execution (read-only 15-25, gen 30-40, val 10-15)
skills:                           # preload full content at agent start
  - sk-4d-method
  - sk-spec-driven-development
  - sk-claude-code-conventions
mcpServers:
  - server-name
background: false                 # true for long-running workers
isolation: worktree               # requires explicit merge by orchestrator
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: 'echo ''{"permissionDecision": "allow"}'''
---
```

### Field rules

- `name`: lowercase + hyphens, <=64 chars, no XML tags, no reserved words (`anthropic`, `claude`). Matches filename.
- `description`: 1–2 sentences, third person only. Pattern: `<what it does>. <when to use it>.` Routing contract — Claude picks agents by matching task → description.
- `tools`: minimal allowlist. Read-only agent: no `Write`/`Edit`. Research agent: no `Bash`. Tool list stability is a cache constraint.
- `model`: `sonnet` in pipelines. Interactive agents may upgrade to Opus only on explicit user request. Never hardcode retired model IDs.
- `effort`: `high` for architect/auditor; `medium` for worker; `low` for triage.
- `maxTurns`: bounds runaway execution. Set to the smallest value that still succeeds on a representative input.
- `skills:` preload injects FULL skill content (not metadata-only like session-level discovery). Use for shared method skills; do NOT use for companion reference skills.
- `hooks.PreToolUse[Bash]`: required when `Bash` is in `tools` UNLESS `Bash(*)` is already in `permissions.allow`.
- Omit `memory:` (`project`/`local`) — disallowed. Use `tmp/pipeline-state.json`.
- Omit `permission-mode` — rely on user prompting or structured hooks.

## 2. Skill frontmatter (`SKILL.md`)

```yaml
---
name: lowercase-hyphens           # required, <=64 chars
description: "<what>. <when>."    # <=1024 chars, third person
when_to_use: "optional extension" # extends description, 1536-char total cap
argument-hint: "[issue-number]"
disable-model-invocation: false   # true for reference-only skills
user-invocable: true              # false for internal/companion skills
allowed-tools: Read Grep          # space-separated or YAML list
model: sonnet
effort: medium
context: fork                     # run body as subagent prompt
agent: Explore                    # subagent type when context: fork
paths:                            # glob activation
  - "**/*.py"
shell: bash
hooks: {}
---
```

### Companion reference skill pattern

```yaml
---
name: {agent-name}-references
description: Reference library for {agent} agent. Contains ...
user-invocable: false
disable-model-invocation: true
---
```

Body is a navigation index only. `references/*.md` read on demand via `Read`. Never preloaded.

## 3. Cross-references

- `ai-pipelines-integration.md` — strict conventions that override any field default.
- `skill-subagent-pairing.md` — when to preload vs read on demand.
- `sk-claude-code-conventions` — canonical Claude 4.6 reference.
