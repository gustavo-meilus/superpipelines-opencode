# AI_PIPELINES_LLM.md Integration

> **Mandate:** At the start of every axiomius session, `Read` `~/.claude/AI_PIPELINES_LLM.md` in full. It is the canonical rules file. This reference summarizes how to apply it; it does not replace it.

## Why re-read every session

The file encodes orchestration invariants that evolve. Caching them in the agent body rots. Read once per session and treat its contents as authoritative over anything restated here.

## The six patterns (one-line)

| # | Name | Shape |
| :--- | :--- | :--- |
| 1 | Sequential | `A -> writes(f_a) -> B(reads f_a) -> writes(f_b)` |
| 2 | Parallel Fan-Out / Merge | `[A, B, C] PARALLEL -> D merges` |
| 2b | Parallel with QA | QA purifies worker outputs in parallel |
| 3 | Iterative Loop | `Tester -> Analyzer -> Healer -> RESTART(bounded)` |
| 4 | Human-Gated | `Agent -> GATE(AskUserQuestion) -> [APPROVE | REVISE]` |
| 5 | Spec-Driven Development | `/specify -> /plan -> /tasks -> /analyze -> /implement` |
| 6 | 4D Processing Wrapper | Runs inside every turn of Patterns 1–5 |

## Context distribution matrix (load mechanism)

| Location | Scope | Load | Cost |
| :--- | :--- | :--- | :--- |
| `CLAUDE.md` | Global rules | Always loaded | HIGH (<=200 lines) |
| `.claude/rules/*.md` | Path-scoped | Auto on dir access | LOW |
| Shared skills (`sk-*`) | Methods, standards | On-demand or `skills:` preload | MED |
| `references/*.md` | Static templates, schemas | Runtime `Read` | LOW |
| `.claudeignore` | Exclude build artifacts | Static | LOW |

## Strict conventions axiomius MUST honor

- `SUB_AGENT_SPAWNING: FALSE` — subagents never spawn children. Orchestrate from a skill or lead agent.
- `MODEL_SELECTION: SONNET_ONLY` — scale via `effort`, never via model swap.
- `PERMISSION_MODE: NULL` — omit from frontmatter.
- `STATE_MANAGEMENT: STRUCTURED_JSON` — use `pipeline-state.json` in `tmp/`; never `memory: project` or `memory: local`.
- `PATH_VARIABLE_PROTOCOL` — orchestrators define `{OUT}` and `{REF}` as absolute env vars; agents never hardcode paths.
- `PASS_PATHS_NOT_CONTENT` — orchestrators pass `{file_path}`, never pasted content.
- `BASH_PERMISSION_PROTOCOL` — any agent with `Bash` in tools declares the `PreToolUse` allow hook, unless `Bash(*)` is already in `permissions.allow`.

## Section-to-task routing

| axiomius task | Sections to Read |
| :--- | :--- |
| Create a single agent | `<agent_definition_schema>`, `<description_discipline>`, `<strict_conventions>`, `<claude_4_6_conventions>` |
| Design a pipeline | `<execution_modes_and_patterns>`, `<context_distribution_matrix>`, `<prompt_cache_discipline>` |
| Update an agent | `<agent_definition_schema>`, `<output_size_discipline>`, `<programmatic_tool_audit>` |
| Pair agent + references skill | `<skill_agent_pairing_convention>`, `<progressive_disclosure_rules>`, `<method_registry>` |
| Diagnose a failing pipeline | `<execution_modes_and_patterns>`, `<memory_management>`, `<skill_suppression>` |

## Cross-references

- `topology-patterns.md` — deeper Pattern 1–6 guidance.
- `agent-frontmatter-schema.md` — full frontmatter reference.
- `skill-subagent-pairing.md` — when to preload a skill vs read references.
