# Anti-Patterns — 19 Failure Patterns

Extracted from the censorus agent body. For each detected pattern, cite the specific location (line range or snippet) in the audited prompt.

| # | Pattern | Symptom | Root cause | Fix |
|---|---------|---------|------------|-----|
| 1 | **The Mega-Prompt** | One monolithic block, no structure. | Author dumped everything into a single paragraph. | Split into identity / scope / workflow / constraints / output sections. |
| 2 | **The Prompting Fallacy** | Endless rewording, same bad behavior. | Author rewriting prose to fix an architectural problem. | Restructure (add sections, extract skills) — don't reword. |
| 3 | **Vague Identity** | "You are a helpful assistant". | No domain role specified. | Rewrite identity to name domain + role + specialty. |
| 4 | **Missing Negative Scope** | Agent drifts into adjacent tasks. | No "does NOT do" list. | Add explicit refusals and redirects. |
| 5 | **Generic CoT** | "Think step by step" with no structure. | Author expects emergent reasoning. | Replace with 3–7 named domain steps. |
| 6 | **No Output Contract** | "Respond clearly" with no format. | Author forgot to specify shape. | Add required sections + ordering + length bounds. |
| 7 | **No Success Criteria** | Output shape defined, quality not measured. | No QA loop defined. | Add 5–10 observable success indicators. |
| 8 | **Ungrounded Constraints** | Bare NEVER/ALWAYS with no rationale. | Copy-paste from generic style guide. | Add source + alternative behavior per rule. |
| 9 | **No Uncertainty Permission** | Agent hallucinates rather than admit ignorance. | Rules forbid "I don't know". | Grant explicit permission to flag uncertainty. |
| 10 | **Context Stuffing** | Raw history, full files, verbose tool outputs pasted in. | Author thought more context = better output. | Pass paths, not content; scope file reads to line ranges. |
| 11 | **Few-Shot Rut** | Output mimics examples too rigidly. | Too many similar shots. | Reduce to 2–3 diverse examples; add counter-example. |
| 12 | **Tool Sprawl** | Overlapping tools; wrong tool picked. | `tools: *` or no pruning. | Whitelist ONLY required tools; prune duplicates. |
| 13 | **Invisible Failures** | Agent finishes silently on error. | No self-verification step. | Add post-action check + explicit error reporting. |
| 14 | **Leaky Sub-Agent Context** | Sub-agent references CLAUDE.md or parent convo. | Author assumes inheritance. | Remove refs; inline the needed context or load via `skills:`. |
| 15 | **Over-Tooled Sub-Agent** | Read-only reviewer with Write/Edit. | Author granted default tool set. | Remove Write/Edit; use `disallowedTools` or tight `tools:` list. |
| 16 | **Vague Sub-Agent Description** | "Helps with code" — no routing signal. | Author wrote description as label, not contract. | Rewrite as `<what it does>. <when to use it>.` third person. |
| 17 | **Decorative Persona** | Elaborate backstory unrelated to task. | Style over function. | Strip lore; keep only facets that alter output. |
| 18 | **Token Waste** | Double blank lines, commented-out chunks, redundant sections. | No proofread pass. | Delete dead text; collapse duplicates. |
| 19 | **Conflicting Instructions** | Constraint A contradicts instruction B. | Additive edits over time. | Diff constraints against workflow; resolve or remove one. |
