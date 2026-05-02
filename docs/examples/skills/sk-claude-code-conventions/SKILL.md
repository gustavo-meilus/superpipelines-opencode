---
name: sk-claude-code-conventions
description: Reference library for Claude Code conventions on Claude 4.6 — adaptive thinking, prompt caching, memory tool, skill/subagent frontmatter schemas, progressive disclosure, and skill-subagent pairing. Use when creating or modifying agents, skills, or orchestration pipelines.
user-invocable: false
---

# Claude Code Conventions (Claude 4.6) — Reference Library

> **Purpose:** Canonical reference for current (April 2026) Anthropic best practices when authoring agents, skills, and orchestration pipelines for Claude Code on Claude 4.6.
>
> **Compatibility:** Claude Sonnet 4.6, Opus 4.6, Haiku 4.5. Agent Skills Open Standard (published Dec 2025).

---

## 1. Model selection

| Tier | Model ID | Use for |
| :--- | :--- | :--- |
| Workhorse | `claude-sonnet-4-6` | Default for pipelines, agents, skills. Scale effort, not model. |
| Deep reasoning | `claude-opus-4-7` | Interactive architect/auditor work on explicit user upgrade. |
| Triage / batch | `claude-haiku-4-5-20251001` | High-volume, low-latency, simple classification. |

Pipelines: **`MODEL_SELECTION: SONNET_ONLY`**. Scale reasoning via `effort:` only.

---

## 2. Adaptive thinking (extended thinking)

Claude 4.6 uses `thinking: {type: "adaptive"}` — model decides when and how much to reason based on:
- `effort: low | medium | high | xhigh | max`
- Query complexity

**Defaults:**
- Architect/auditor agents: `effort: high`
- Worker agents: `effort: medium`
- Triage agents: `effort: low`

**max_tokens:** 64k for autonomous multi-step agents at medium+ effort.

**In skills:** include `ultrathink` anywhere in the SKILL.md body to enable extended thinking when that skill is active.

**Cache interaction:** thinking blocks CAN be cached alongside content in previous assistant turns; count as input tokens on cache read.

---

## 3. Prompt caching discipline

At Anthropic's Claude Code team, low cache-hit rate triggers a SEV. Optimize for cache hits.

### Rules
- **Static first, dynamic last.** System prompt → skills → tools → conversation history.
- **Never mutate tool set mid-session.** Adding or removing a tool invalidates the entire cache prefix.
- **Never mutate skills list mid-session.** Same invalidation.
- **No dynamic timestamps in static system prompts.**
- **Breakpoint placement:** up to 4 `cache_control` breakpoints. Put the LAST breakpoint on the last block that stays identical across requests.

### TTL strategy
- **5-min TTL** (default) for active interactive sessions.
- **1-hour TTL** for agentic loops where gaps between API calls can exceed 5 min.
- **Ordering:** 1-hour entries MUST appear BEFORE 5-minute entries in a single request.

### Anti-patterns
- `defer_loading` for managing large tool sets (use ToolSearch-style discovery, not tool churn).
- Mode-switching via tool call (`EnterPlanMode`, `ExitPlanMode`), NOT via tool set mutation.

---

## 4. Memory tool

Claude 4.6 can extract and persist facts to local files for cross-session continuity.

- **Use case:** learned heuristics, user preferences, stable environment facts.
- **Don't use for:** deterministic rules (put in `references/*.md` instead).
- **Disable auto-memory** in pipelines to save 658+ tokens per call:
  - Env: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`
  - Settings: `"autoMemoryEnabled": false`

---

## 5. Agent Skills Open Standard — frontmatter schema

```yaml
---
name: {lowercase-hyphens, <=64 chars, no XML tags, no reserved words anthropic/claude}
description: {<=1024 chars, third person, "<what>. <when to use>."}
when_to_use: {optional, extends description, counts toward 1536-char cap}
argument-hint: {e.g. "[issue-number]"}
disable-model-invocation: {true | false, default false}
user-invocable: {true | false, default true}
allowed-tools: {space-separated or YAML list — tools allowed w/o prompt}
model: {optional override}
effort: {low | medium | high | xhigh | max}
context: {fork = run in forked subagent}
agent: {subagent type when context: fork}
hooks: {lifecycle hooks}
paths: {glob patterns; skill activates only when matching files in context}
shell: {bash | powershell}
---
```

### Skill file layout (progressive disclosure)

```
skill-name/
├── SKILL.md              # <=500 lines. Overview + navigation
├── reference.md          # Loaded when needed
├── examples.md           # Loaded when needed
├── references/           # One level deep, descriptive names
│   ├── domain-a.md
│   └── domain-b.md
└── scripts/
    └── helper.py         # Executed, not loaded
```

### Rules
- **SKILL.md body** <=500 lines.
- **Refs one level deep** from SKILL.md. Nested refs cause partial reads.
- **Ref files >100 lines** include table-of-contents at the top.
- **Metadata pre-loaded** (~100 tokens per skill in system context).
- **Body loaded** only when skill is invoked/matched.
- **Refs loaded** only when the skill instructs Claude to read them.

### Description rules (Anthropic)
- Third person ONLY ("Processes X…", NOT "I can process…" or "You can use…")
- "What + when" (Claude picks skills by matching task to description)
- Include trigger keywords users would naturally say
- Front-load the key use case (truncation at 1536 chars)

---

## 6. Claude Code sub-agent schema

```yaml
---
name: {string identifier}
description: {action-oriented routing trigger, third person, "<what>. <when>."}
tools: {Tool1, Tool2 — whitelist when tight control needed; omit to inherit}
disallowedTools: {Write, Edit — explicit deny}
model: sonnet
effort: {low | medium | high}
maxTurns: {integer, bounds execution}
skills: [sk-4d-method, sk-spec-driven-development, sk-claude-code-conventions]
mcpServers: [server-name]
background: {boolean}
isolation: worktree
hooks: {PreToolUse, PostToolUse, UserPromptSubmit, Stop, …}
---
```

### Rules
- Description = routing contract. Claude picks a subagent by matching task → description.
- One clear goal, one input shape, one output shape, one handoff rule.
- Tool whitelist for tight control; omit to inherit thread tools.
- **`skills:` preload** = FULL content injected at subagent startup (not metadata-only like session-level discovery).

---

## 7. Skill–subagent pairing patterns

### Pattern A: Skill runs in forked subagent
Skill has `context: fork` + `agent: Explore` (or another subagent type). SKILL.md content becomes the subagent's prompt.

Use for: isolated research tasks with explicit instructions and no conversation-history dependency.

### Pattern B: Subagent preloads shared method skills
Subagent frontmatter: `skills: [sk-4d-method, sk-spec-driven-development]`. Method skills inject at startup; subagent body focuses on its specific role.

Use for: every orchestrator agent (axiomius, censorus, consortius, praxius).

### Pattern C: Agent + companion reference skill
Agent body <=150 lines. Companion skill `{agent}-references/` with `references/*.md` files agent reads on demand.

Use for: agents with deep reference material (matrices, anti-patterns, templates).

### Anti-pattern
- Preloading companion-reference skill via `skills:` — bloats context. Use `Read` on demand instead.
- Mixing shared-method skills (preload) and agent-specific refs (on demand) — keeps them separated.

---

## 8. Progressive disclosure checklist

- [ ] SKILL.md body <=500 lines
- [ ] Refs one level deep
- [ ] Long refs have ToC
- [ ] Description third person, "what + when"
- [ ] Consistent terminology throughout
- [ ] No time-sensitive info (or in collapsible "old patterns" section)
- [ ] Examples concrete, not abstract
- [ ] Workflow steps clear and numbered
- [ ] Feedback loops for quality-critical tasks
- [ ] Tested on Haiku + Sonnet + Opus before shipping

---

## 9. Cross-references

- **`sk-4d-method`** — per-invocation Deconstruct→Diagnose→Develop→Deliver.
- **`sk-spec-driven-development`** — multi-step SDD workflow (GitHub Spec Kit).
- **`~/.claude/AI_PIPELINES_LLM.md`** — canonical orchestration rules (Patterns 1–6, strict conventions).
- Anthropic official docs:
  - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/sub-agents
  - https://platform.claude.com/docs/en/build-with-claude/extended-thinking
  - https://platform.claude.com/docs/en/build-with-claude/prompt-caching

---

## Version notes

- **Updated** April 2026
- **Target models** Claude Sonnet 4.6, Opus 4.6, Haiku 4.5
- **Skill format** Agent Skills Open Standard (published Dec 2025)
