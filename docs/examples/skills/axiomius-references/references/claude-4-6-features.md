# Claude 4.6 Features (Agent-Authoring Reference)

> Canonical reference: `sk-claude-code-conventions`. This file summarizes the axiomius-relevant subset.

## 1. Adaptive thinking

Claude 4.6 uses `thinking: {type: "adaptive"}` — the model calibrates reasoning depth per query, scaled by an explicit `effort` parameter.

### `effort` scale

| Value | Use | Typical role |
| :--- | :--- | :--- |
| `low` | Triage, classification, extraction | Router, filter, tagger |
| `medium` | General worker | Implementor, transformer |
| `high` | Architect / auditor | axiomius, censorus, reviewer |
| `xhigh` | Deep reasoning on hard problems | Pipeline design, security audit |
| `max` | Maximum; use sparingly | One-shot high-stakes reasoning |

Set at frontmatter level, not inline. Default: `effort: high` for architect/auditor agents; `medium` for workers; `low` for triage.

### `max_tokens`

Recommend 64k for autonomous multi-step agents at medium+ effort.

### Enabling extended thinking in a skill

Include the word `ultrathink` anywhere in the SKILL.md body. Triggers extended thinking when that skill is active.

### Cache interaction

Thinking blocks CAN be cached in previous assistant turns. They count as input tokens on cache read.

## 2. Prompt caching discipline

Low cache-hit rate is a SEV at Anthropic. Design every agent/skill with cache hits in mind.

- **Static first, dynamic last.** System prompt → skills → tools → conversation history.
- **No tool churn.** Never add/remove/reorder tools mid-session. Use mode-switching tools (`EnterPlanMode`, `ExitPlanMode`) or `defer_loading`.
- **Skills list stability.** Mutating the `skills:` list invalidates cache. Keep consistent across requests.
- **No dynamic timestamps** in static prompts (they shatter prefix matching).
- **Breakpoints:** up to 4 `cache_control` breakpoints. Put the LAST breakpoint on the last block that stays identical across requests.
- **TTL ordering:** 1-hour cache entries MUST appear BEFORE 5-minute entries. Use 1h for agentic loops with >5min gaps between calls.

## 3. Memory tool

Claude 4.6 extracts key facts to local files for cross-session continuity.

- Use for: learned heuristics, stable user preferences, environment facts.
- Do NOT use for: deterministic rules (use `references/*.md` instead).
- Disable auto-memory in pipelines to reclaim 658+ tokens per call:
  - Env: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`
  - Settings: `"autoMemoryEnabled": false`

## 4. Model selection policy

- **Pipelines:** `MODEL_SELECTION: SONNET_ONLY`. Scale via `effort`, never via model swap.
- **Interactive agents:** Sonnet 4.6 default. Opus 4.6 only on explicit user upgrade. Haiku 4.5 for batch/triage.
- **Never hardcode retired model IDs.** Current: `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`.

## Cross-references

- `agent-frontmatter-schema.md` — where `effort`, `skills:`, `maxTurns` live.
- `anti-patterns.md` — caching/tooling anti-patterns in detail.
- `sk-claude-code-conventions` — canonical reference library.
