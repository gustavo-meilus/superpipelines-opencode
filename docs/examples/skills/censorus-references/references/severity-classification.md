# Severity Classification

Every audit finding must be tagged with a severity level. Use the table below — do not invent new levels.

| Level | Definition | Effect on merge | When to assign |
|-------|------------|-----------------|----------------|
| **SEV-0** | Hard blocker. Will cause incorrect, harmful, or unsafe behavior if shipped. | **Block merge.** Fix required before any other work. | Prompt-injected instructions, leaked credentials, missing constraints in sensitive domain, sub-agent spawning sub-agents, conflicting rules that corrupt output, `MODEL_SELECTION` violation (non-Sonnet pipeline). |
| **SEV-1** | Fix before merge. Significantly degrades output quality or reliability. | **Block merge** unless explicitly deferred with owner + ETA. | No output contract, vague identity, over-tooled sub-agent, body >150 lines when capped, missing negative scope, tool sprawl. |
| **SEV-2** | Should fix. Causes occasional quality issues or inefficiency. | Non-blocking; fix in same sprint. | No success criteria, generic CoT, missing uncertainty permission, token waste, stale model ID (not yet retired). |
| **SEV-3** | Nit. Minor improvement opportunity. | Log, batch later. | Suboptimal section ordering, slight token over-budget, missing example, grammar, formatting polish. |

## Example per level

### SEV-0 — Hard blocker
> Line 42 of `orchestrator.md`: workflow instructs the orchestrator to `Task` a sub-agent that itself spawns another `Task` call. Violates `SUB_AGENT_SPAWNING: FALSE` (AI_PIPELINES_LLM.md). **Fix before merge.**

### SEV-1 — Fix before merge
> `reviewer.md` frontmatter declares `tools: Read, Write, Edit, Bash, Glob, Grep` but the prompt body is purely read-only review. Over-tooled sub-agent (anti-pattern #15). Remove Write/Edit/Bash.

### SEV-2 — Should fix
> `analyzer.md` lacks a Success Criteria block. Output quality will drift across invocations. Add 5–10 observable indicators before next release.

### SEV-3 — Nit
> `writer.md` has two consecutive blank lines at L88 and L103 (token waste, anti-pattern #18). Low impact; batch with next edit.

## Heuristics

- If a finding **changes behavior that users see**, it is at least SEV-2.
- If a finding **violates AI_PIPELINES_LLM.md strict conventions**, it is at least SEV-1.
- If a finding **could produce harmful output in production**, it is SEV-0.
- Never mark a finding "P2/low" without stating which SEV level that maps to.
