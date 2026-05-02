# Compliance Matrix — 20 Criteria

Extracted from the censorus agent body. Assign **PASS / FAIL / PARTIAL / N/A** to each with cited evidence (line numbers or snippets) from the audited prompt.

| # | Criterion | Why it matters | How to check | Remediation |
|---|-----------|----------------|--------------|-------------|
| 1 | **Format** matches target model | XML for Claude, Markdown for GPT; mismatched format reduces model adherence. | Inspect tag style. Claude agents use `<section>`; GPT uses `##` headings. | Convert to the target model's idiomatic syntax. |
| 2 | **Token budget** within bounds | Over-budget prompts invalidate cache, slow inference, and waste context. | Char-count body / 4 ~= tokens. Bounds: sub-agent <5K (hard 10K), API <2K (hard 3K), orchestrator <8K (hard 15K). | Extract depth to `references/`; delete filler; compress. |
| 3 | **Section ordering** | Identity before capabilities before constraints before output keeps primacy/recency working. | Read headings top-down and verify order. | Reorder sections: identity → scope → workflow → constraints → output. |
| 4 | **Identity** 1–3 sentences, specific | "Helpful assistant" never routes or constrains behavior. | First block names domain expertise and role. | Rewrite as `You are {Name}, a {specific role} specialising in {domain}.` |
| 5 | **Positive scope** | Agents drift without an explicit "what I do" list. | Look for a bullet list of agent responsibilities. | Add 3–6 bullets of concrete actions. |
| 6 | **Negative scope** | Without "does NOT do" bounds agents adopt adjacent tasks. | Look for explicit "NOT" list. | Add 3–5 bullets naming what the agent refuses and who to redirect to. |
| 7 | **Knowledge hierarchy** | Conflict resolution requires priority ordering of sources. | Does the prompt rank sources? N/A for simple domains. | Add numbered priority list (e.g. spec → CLAUDE.md → repo rules → web). |
| 8 | **Domain frameworks** | Taxonomies must be inlined, not assumed from training. | Look for named rubrics/matrices/heuristics. | Embed the rubric or reference a skill that contains it. |
| 9 | **Reasoning protocol** 3–7 named steps | Generic CoT underperforms domain-specific reasoning. | Locate a workflow block with named steps. | Rewrite CoT as domain verbs (CLASSIFY, DIAGNOSE, REMEDIATE). |
| 10 | **Steps domain-specific** | Steps must match expert workflow order. | Compare step order to how a human expert would solve the task. | Re-sequence; merge or split steps to match expert order. |
| 11 | **Tool definitions** precise, non-overlapping | Tool sprawl produces wrong-tool selection. | Check tool list for duplication/overlap. | Prune duplicates; document failure behavior per tool. |
| 12 | **Output format contract** | "Respond clearly" produces inconsistent output. | Find a section naming required output sections + length bounds. | Add explicit required sections and ordering. |
| 13 | **Success criteria** 5–10 measurable | Unmeasured quality drifts. | Look for a checklist of observable success indicators. | Add bullets like "Each finding cites line numbers." |
| 14 | **Constraints grounded** | NEVER/ALWAYS with no rationale is brittle. | Each rule should cite source + alternative behavior. | Rewrite: `NEVER X (source: AI_PIPELINES). Instead: Y.` |
| 15 | **Uncertainty permission** | Without it, the agent hallucinates. | Look for "say so when unsure" or "mark PARTIAL". | Add a line granting the agent the right to say "unknown". |
| 16 | **Disclaimer** for sensitive domains | Legal/medical/security outputs need scope limits. | Look for "this output IS X, IS NOT Y". | Add disclaimer naming what the output replaces / does not replace. |
| 17 | **Error recovery** 3+ failure modes | Tool-using agents silently fail without recovery paths. | Look for retry limits, fallbacks, abort conditions. | Add 3 failure modes with bounded retry + fallback. |
| 18 | **Context management** | Long-horizon agents need WRITE/SELECT/COMPRESS/ISOLATE strategies. | Look for explicit context-handling instructions. | Add instructions to compress stale context, isolate sub-tasks. |
| 19 | **Platform-specific** sub-agent | Sub-agents must be self-contained with tight tools and routable descriptions. | Check for CLAUDE.md references, tool whitelist, descriptive routing string. | Remove parent-context refs; tighten tool list; sharpen description. |
| 20 | **No anti-patterns** | Clean of all 19 documented failure patterns (see `anti-patterns.md`). | Cross-run the anti-pattern scan. | Apply the matching fix for each detected pattern. |
