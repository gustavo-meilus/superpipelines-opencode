# Claude 4.6/4.7 Features (Documentation Reference)

> Per-model traits Scribius must encode accurately in any doc that references Claude models. Outdated model details cause agents to misconfigure API calls or apply wrong constraints.

## Current Model IDs

| Model | ID | Context | Notes |
| :--- | :--- | :--- | :--- |
| Opus 4.7 | `claude-opus-4-7` | 1M tokens | Highest capability; most literal; fewer subagents; more direct tone |
| Opus 4.6 | `claude-opus-4-6` | 200K tokens | Deep reasoning; architect-grade work |
| Sonnet 4.6 | `claude-sonnet-4-6` | 200K (1M beta) | Default workhorse for pipelines; balanced speed/quality |
| Haiku 4.5 | `claude-haiku-4-5` | 128K tokens | High-volume, low-latency, simple classification |

Never document `claude-3-*`, `claude-3-5-*`, or `claude-4-0` — these IDs are retired.

## Adaptive Thinking

Claude 4.6/4.7 uses `thinking: {type: "adaptive"}`. The model calibrates reasoning depth per query based on the `effort` parameter, not a fixed token budget.

### effort Levels

| Value | Use | Typical agent role |
| :--- | :--- | :--- |
| `low` | Fast triage, extraction, classification | Router, tagger, filter |
| `medium` | General generation and transformation | Worker, implementor |
| `high` | Architecture, audit, complex analysis | Architect, auditor, reviewer |
| `xhigh` | Deep reasoning on hard or ambiguous problems | Security audit, pipeline design |
| `max` | Maximum reasoning; use sparingly | One-shot high-stakes reasoning |

Set `effort` at the frontmatter level, never inline. Default: `high` for architect/auditor agents; `medium` for workers; `low` for triage.

### What Replaced budget_tokens

`budget_tokens` is deprecated. Document `thinking: {type: "adaptive"}` paired with `effort` instead. The model decides internal reasoning depth; callers only signal the desired effort level.

### Haiku 4.5 Thinking Budget

Haiku 4.5 supports a 128K internal thinking budget when `effort: high` or above. For docs targeting Haiku 4.5, note that extended reasoning is available but not always engaged by default at lower effort levels.

### ultrathink Convention

In Claude Code skills, including the word `ultrathink` anywhere in a SKILL.md body enables extended thinking when that skill is active. This is a Claude Code convention, not an API parameter.

## 1M Context

Opus 4.7 supports 1M-token context generally available. Sonnet 4.6 supports 1M tokens in beta. Haiku 4.5 is 128K. When documenting context limits, verify the current GA or beta status against the Anthropic model documentation before publishing; GA/beta designations change across releases.

## Opus 4.7 Behavior Differences

Opus 4.7 is more literal than earlier versions: it follows instructions precisely without inferring additional context. Docs targeting Opus 4.7 should:
- State all required parameters explicitly; do not rely on Opus inferring defaults.
- Avoid ambiguous instructions; the model applies them literally.
- Note that Opus 4.7 spawns fewer subagents and prefers direct task execution over delegation.

## Memory Tool

The memory tool (`memory_20250818`) extracts and persists key facts to local files for cross-session continuity. The beta header for context management features is `context-management-2025-06-27`.

When documenting agents that use memory: recommend `references/*.md` for deterministic rules, and memory only for learned heuristics and user preferences.

To disable auto-memory (reclaims 658+ tokens per call):
- Environment: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`
- Settings: `"autoMemoryEnabled": false`

## Model Selection Policy for Docs

When a doc instructs callers to select a model:
- Recommend `claude-sonnet-4-6` as the default for pipelines and multi-step agents.
- Recommend `claude-opus-4-7` only for interactive architect-grade work or explicit user upgrade.
- Recommend `claude-haiku-4-5` for batch/triage/high-volume low-latency work.
- Never recommend selecting a model by swapping IDs mid-pipeline; scale by `effort` instead.
