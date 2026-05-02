# Claude 4.6 Conventions Audit

Reference: `~/.claude/skills/sk-claude-code-conventions/SKILL.md` and AI_PIPELINES_LLM.md `<claude_4_6_conventions>` / `<prompt_cache_discipline>` blocks.

## Adaptive thinking / effort

- [ ] **`effort:` set** in frontmatter. Valid values: `low | medium | high | xhigh | max`.
- [ ] **Architect / auditor agents:** `effort: high` (or `xhigh` for deep reasoning tasks).
- [ ] **Worker agents:** `effort: medium`.
- [ ] **Triage / classification agents:** `effort: low`.

**Failure:** `effort:` missing → **SEV-2**. Wrong tier (e.g. auditor on `low`) → **SEV-2**.

## max_tokens

- [ ] **`max_tokens` reasonable.** 64k recommended for autonomous multi-step agents at medium+ effort.
- [ ] Not inflated beyond what the agent actually emits (wastes billing ceiling calculations).

**Failure:** Multi-step agent with `max_tokens: 4096` will truncate → **SEV-1**. Missing entirely → **SEV-3** (falls back to default).

## Prompt cache discipline

- [ ] **`STATIC_FIRST`** — system prompt / skills / tools first; dynamic content last.
- [ ] **No tool churn** — tool set does not mutate mid-session (no `defer_loading` for tool-set swapping; use mode-switching tools instead). **SEV-1** if violated.
- [ ] **Skills list stable** — `skills:` list does not change across requests.
- [ ] **No dynamic timestamps** in static prompt bodies (e.g. `Today is {{date}}` baked into system prompt). **SEV-1** if detected.
- [ ] **Breakpoint strategy** — `cache_control` on the LAST block that stays identical across requests. Up to 4 breakpoints.
- [ ] **TTL ordering** — 1-hour entries appear BEFORE 5-minute entries.

## Skills preload

- [ ] **`skills:`** preload used for shared method skills (`sk-4d-method`, `sk-spec-driven-development`, `sk-claude-code-conventions`).
- [ ] Companion reference skills (`{agent}-references`) are NOT preloaded — agent reads them on demand via `Read`.

**Failure:** Preloading the companion reference skill → **SEV-2** (bloats context).

## Memory tool

- [ ] **Memory used only for heuristics**, user preferences, learned patterns. Not for deterministic rules.
- [ ] Deterministic rules live in `references/*.md`, not memory.
- [ ] **Auto-memory disabled** in pipelines (`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` or `autoMemoryEnabled: false`) — reclaims 658+ tokens.
- [ ] If `memory: user` is set, body contains memory-curation instructions naming what to remember vs not.

**Failure:** Agent stuffs rules into memory → **SEV-2**. Agent has `memory:` without curation guidance → **SEV-2**.

## Model IDs

- [ ] **Current IDs only:** `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`.
- [ ] No retired IDs (`claude-3-*`, `claude-sonnet-4-5`, etc.). **SEV-1** if detected.

## Progressive disclosure (for agents paired with a companion skill)

- [ ] Agent body ≤ 150 lines.
- [ ] Companion skill `references/` one level deep — no nested refs.
- [ ] Ref files > 100 lines include a table-of-contents at the top.
