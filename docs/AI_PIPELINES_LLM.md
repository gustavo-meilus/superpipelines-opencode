# AI Pipelines — Orchestration Reference (LLM-Optimized)

> **Version:** 2.0 — Full remake addressing all gaps from `ai-pipelines-improvement-plan.md`.
> **Sources:** `AI_PIPELINES_LLM.md` v1, `superpowers-vs-ai-pipelines.md`, `ai-pipelines-improvement-plan.md`, Superpowers v5.0.7 skill corpus.

---

<core_architecture>
- `SUB_AGENT_SPAWNING: FALSE` (Only parent session, skill, or lead agent orchestrates).
- `ANT_SWARM_PRINCIPLE: TRUE` (Prefer many small-context agents over single large-context agents).
- `PIPELINE_PHASE_ISOLATION: TRUE` (Tester, Analyzer, Healer are separate instances).
- `WORKTREE_MERGE_REQUIRED: TRUE` (If `isolation: worktree` is used, orchestrator MUST explicitly commit and merge successful changes before worktree destruction — see `<worktree_safety_protocol>`).

<write_review_isolation>
`WRITE_REVIEW_ISOLATION: TRUE`

- Writing agent != Reviewing agent (enforced — always separate instances).
- `REVIEW_STAGES: TWO` — spec compliance first, code quality second.
  - **Stage 1 (Spec Compliance):** Does output match spec exactly? Under-build AND over-build both fail Stage 1.
    - **Gate:** Stage 2 cannot begin until Stage 1 passes. Running quality review on spec-noncompliant output is wasted work.
  - **Stage 2 (Code Quality):** Is output well-written, maintainable, idiomatic?
- `REVIEW_LOOP`: Reviewer finds issues → Implementer fixes → Reviewer re-reviews. Terminate only when reviewer approves, not after a single pass.
- `OVER_BUILD_IS_SPEC_FAILURE`: Adding unrequested features fails Stage 1, not Stage 2.

<EXTREMELY-IMPORTANT>
Stage 1 spec compliance review MUST pass before Stage 2 code quality review begins.
This order is not optional.
</EXTREMELY-IMPORTANT>
</write_review_isolation>

<agent_definition_schema>
# Path: .claude/agents/<name>.md
---
name: string-identifier          # ≤64 chars, lowercase + hyphens only
description: string              # Triggering conditions ONLY — see <description_discipline>
tools: Tool1, Tool2
disallowedTools: Write, Edit
model: sonnet
effort: low | medium | high | xhigh | max   # See <effort_reference> for all 5 levels
maxTurns: integer
version: "1.0"                   # Bump major on breaking change — see <agent_versioning>
initialPrompt: string
skills:
  - sk-method-skill-name         # ONLY sk-* shared method skills. NEVER large workflow skills.
mcpServers:
  - server-name
background: boolean
isolation: worktree
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: 'echo ''{"permissionDecision": "allow"}'''
---
# Agent body: ≤150 lines STRICT. System prompt injected at every startup.
# Offload depth to companion {agent}-references/ skill — read on demand via Read tool.
</agent_definition_schema>
</core_architecture>

---

<execution_modes_and_patterns>

<pattern id="1" name="Sequential">
`Agent_A -> writes(file_a) -> Agent_B(reads file_a) -> writes(file_b) -> Agent_C(reads file_b)`
</pattern>

<pattern id="2" name="Parallel_Fan_Out_Merge">
`Phase 1: [Agent_A, Agent_B, Agent_C] PARALLEL -> writes([file_a, file_b, file_c])`
`Phase 2: Agent_D(reads [file_a, file_b, file_c]) -> writes(merged_file)`
</pattern>

<pattern id="2b" name="Parallel_with_QA">
`Phase 1: [QA_Agent(validates Phase_0_output), Worker_A, Worker_B] PARALLEL`
`Phase N: [QA_Agent(purifies Output_A), QA_Agent(purifies Output_B)] PARALLEL`
</pattern>

<pattern id="3" name="Iterative_Loop">
`Loop(MAX_ITERATIONS: N): Tester(tests) -> Analyzer(diagnoses) -> Fixer(applies) -> RESTART`

ESCALATION_PROTOCOL:

<HARD-GATE>
After 3 failed iterations without measurable progress: STOP. Do NOT attempt iteration 4.
</HARD-GATE>

- **Signal for stopping early:** Each fix reveals a new failure in a different location (not the same failure improving). This is an architectural problem, not a fixable bug. Applying more fixes will corrupt the codebase further.
- **Action on early stop:** Escalate to human or invoke Pattern 4 (Human_Gated) before continuing. Write current state to `pipeline-state.json`.
- **On MAX_ITERATIONS reached without resolution:**
  - Write failure summary: `{ "status": "escalated", "iterations": N, "last_failure": "<description>", "attempted_fixes": ["fix1", "fix2"] }`
  - Do NOT silently exit. Surface state to orchestrator.
- **Progress detection:** Between iterations, compare test failure count. If failures are not decreasing after 2 consecutive iterations: treat as architectural signal.

Red Flags — STOP iterating:
- "One more fix should do it" (after 2+ failures)
- "The fix is almost working"
- Each new fix reveals a failure in a new location
All of these mean: Stop. Question the architecture. Escalate before attempting another fix.
</pattern>

<pattern id="4" name="Human_Gated">
`Phase 1: Agent_A -> writes(output)`
`Phase 2: GATE(AskUserQuestion) -> Wait for [APPROVE | REJECT | REVISE]`
`Phase 3: IF REVISE -> Re-invoke Agent_A(prompt: "REVISION: {feedback} + read {original_files}")`
</pattern>

<pattern id="5" name="Spec_Driven_Development">
# Aligned with GitHub Spec Kit (spec → plan → tasks → implement).
`Phase 1: /specify -> spec.md (WHAT + WHY, no implementation).`
`Phase 2: /clarify (optional) -> resolve ambiguities + /plan -> plan.md (HOW: stack, architecture, constraints).`
`Phase 3: /tasks -> tasks.md (small reviewable chunks, 1 Agent Session / Task).`
`Phase 4: /analyze + /checklist (optional) -> BLOCK if missing Acceptance Criteria.`

<HARD-GATE>
Phase 4b: GATE(AskUserQuestion):
"Spec and tasks written. Please review spec.md and tasks.md before I begin parallel implementation. [APPROVE | REVISE]"
Wait for APPROVE. If REVISE: return to Phase 2.

Rationale: Phase 5 dispatches N parallel agents. A misunderstood spec means N agents produce wrong output simultaneously.
Gate cost: ~1 minute. Ungated mistake cost: discard all parallel work and restart from spec.
</HARD-GATE>

`Phase 5: /implement -> [RPI_Loop(Task_1), RPI_Loop(Task_2)] PARALLEL.`
`Phase 6: Reconcile -> Update spec-state.json.`
# Slash commands ship as skills/commands in .claude/ after spec-kit init.
</pattern>

<pattern id="6" name="4D_Processing_Wrapper">
# Per-invocation processing, NOT a workflow. Runs INSIDE Patterns 1-5 on every agent turn.
`DECONSTRUCT -> extract core intent, entities, missing slots; restate task; GATE if >=3 critical slots missing.`
`DIAGNOSE -> replace vague terms with measurable specs; split overloaded asks; resolve constraint conflicts; anticipate top 2-3 failure modes.`
`DEVELOP -> match task type to strategy; assign role; define output format; layer constraints (primacy + recency).`
`DELIVER -> lead with conclusion; match user context; emit actionable next step; self-review.`

4D_FEEDBACK_ROUTING (concrete signals per re-entry point):

| Feedback type | Signals | Re-entry |
| :--- | :--- | :--- |
| Intent drift | "That's not what I asked", "You misunderstood the goal", response addresses a different problem | re-Deconstruct |
| Vague/wrong | "This is incorrect", factual errors, wrong values/formats, technically correct but misses the point | re-Diagnose |
| Approach | "Use a different method", "That approach won't work because", critique of strategy not output | re-Develop |
| Polish | "Make it more concise", "Change the format", cosmetic/presentation changes, no logical content change | re-Deliver |

# Runs internally by default; surface only on "show 4D" / "walk me through it". Reference: sk-4d-method skill.
</pattern>

</execution_modes_and_patterns>

---

<subagent_status_protocol>
# Standard terminal statuses for all pipeline subagents.
# Every agent MUST emit exactly one of these before exiting.
# Never ignore a non-DONE status. Never force a re-dispatch without addressing the root cause.

**DONE**
- Condition: Task completed. All outputs written to specified paths.
- Orchestrator action: Proceed to next phase or review stage.
- Output: `{ "status": "DONE", "outputs": ["{path1}", "{path2}"] }`

**DONE_WITH_CONCERNS**
- Condition: Task completed but agent flagged doubts about correctness or scope.
- Orchestrator action: Read concerns before proceeding. If concerns touch correctness or scope, address before review. If observational only, proceed to review.
- Output: `{ "status": "DONE_WITH_CONCERNS", "concerns": "<text>", "outputs": [...] }`

**NEEDS_CONTEXT**
- Condition: Task cannot begin — critical information was not provided.
- Orchestrator action: Identify missing context. Re-dispatch with same model + added context. Do NOT re-dispatch without resolving the missing information.
- Output: `{ "status": "NEEDS_CONTEXT", "missing": "<what is needed>" }`

**BLOCKED**
- Condition: Agent cannot complete task even with context.
- Orchestrator action (in order):
  1. If context problem: provide more context, re-dispatch with same model.
  2. If reasoning problem: re-dispatch with higher effort or more capable model.
  3. If task too large: decompose into smaller tasks, re-dispatch each.
  4. If architectural problem: escalate to human. Do NOT retry same approach.
- Output: `{ "status": "BLOCKED", "reason": "<description>", "attempted": "<what was tried>" }`
</subagent_status_protocol>

---

<context_distribution_matrix>
| Storage Location | Scope & Purpose | Load Mechanism | Token Cost Factor |
| :--- | :--- | :--- | :--- |
| `CLAUDE.md` | Global absolute rules. | Always Loaded | HIGH (`MAX_LINES: 200` STRICTLY ENFORCED) |
| `.claude/rules/{dir}.md` | Path-scoped rules (e.g., frontend, testing). | Lazy (Auto-loads on dir access) | LOW (Contextual) |
| Agent body (`.claude/agents/<name>.md`) | Agent-specific system prompt, workflow, constraints. MAX 150 lines STRICT. Offload depth to companion `references/` skill. | Injected at every agent startup, unconditionally. | HIGH (always-on for the agent) |
| `skills` (session-level) | Discoverable by all session agents. | Metadata only at startup (~100 tokens/skill); body loaded lazily when agent invokes via Skill tool. | LOW startup + MED on-use |
| `skills:` frontmatter (preloaded) | Pre-configured for specific agent. ONLY for `sk-*` shared method skills (<100 lines each). NEVER large workflow skills (brainstorming, debugging, TDD). | **Full body injected at agent startup, unconditionally.** | HIGH (always-on, per skill) |
| `references/` | Static templates, platform specs, schema structures. | Runtime `Bash cat` / `Read` | LOW (Only when read) |
| `.claudeignore` | Excludes build artifacts and dev directories from Glob/Grep tools. | Static file in repo root | LOW (prevents tool bloat) |

**SKILL_FRONTMATTER_SCOPE: SHARED_METHODS_ONLY**
- Agent `skills:` frontmatter: ONLY `sk-*` shared method skills (<100 lines each).
- Session-workflow skills (`brainstorming`, `systematic-debugging`, `test-driven-development`): NEVER in agent frontmatter. These are designed for lazy session-level invocation, not pre-injection. A single large workflow skill injected at agent startup multiplies context cost across every pipeline run.
- Companion reference skills (`{agent}-references`): NEVER in `skills:` frontmatter — read on demand via `Read` tool.
</context_distribution_matrix>

---

<optimization_rules>

<memory_management>
- `AUTO_MEMORY: DISABLED`.
- Mandate: Inject `export CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` into pipeline environments OR set `"autoMemoryEnabled": false` in `.claude/settings.json` to reclaim 658+ token baseline.
</memory_management>

<description_discipline>
Description = ONLY triggering conditions. NEVER summarize the skill's process or workflow.

Pattern: `"Use when [specific triggering conditions and symptoms]"`

Why: Claude reads the description to decide whether to load the skill body. If the description summarizes the workflow, Claude follows the description as a shortcut and skips the body. The skill becomes documentation that is never read — a silent failure with no error.

```
# ❌ WRONG: Summarizes workflow — Claude skips the body
description: Processes Excel files by reading sheets, cleaning data, and generating charts.
             Use when working with spreadsheets.

# ❌ WRONG: Process detail in description
description: Use for commit messages — analyze diff, extract intent, write conventional commit.

# ✅ CORRECT: Triggering conditions only
description: Use when working with Excel files, spreadsheets, or .xlsx data extraction.

# ✅ CORRECT: Problem-symptom triggers
description: Use when tests have race conditions, timing dependencies, or fail inconsistently.
```

- Third person ONLY (Anthropic Skills Open Standard). `name` ≤64 chars lowercase+hyphens. `description` ≤1024 chars.
- NO first/second person ("I can…", "You can use…") — inconsistent POV breaks discovery.
- Both load into system context on EVERY session — every extra sentence = wasted tokens per message.
- Audit with `/optimize-prompt [agent-name | skill-name]` to check and rewrite.
</description_discipline>

<skill_suppression>
- `user-invocable: false` does NOT suppress a skill from the system reminder — only deleting SKILL.md removes it.
- Reference-only skills (agent `skills:` preload + `disable-model-invocation: true`): delete SKILL.md, keep `references/`. Agents read files directly; no system-context slot consumed.
- Merge overlapping skills into one with routing tables rather than maintaining parallel duplicates.
</skill_suppression>

<prompt_engineering_snippets>
<use_parallel_tool_calls>
If calling multiple tools without dependencies, make ALL independent calls in parallel in a single message. Never call independent tools sequentially.
</use_parallel_tool_calls>

<investigate_before_answering>
Never speculate about unread files. If tasked with a specific file, you MUST read it before answering. Output must be strictly grounded in opened file content.
</investigate_before_answering>
</prompt_engineering_snippets>

<output_size_discipline>
- `BOUND_STDOUT: TRUE` (e.g., `npx playwright test 2>&1 | tail -80`).
- `SCOPE_FILE_READS: TRUE` (Read specific line ranges over full files when possible).
- `PASS_PATHS_NOT_CONTENT: TRUE` for large files (logs, datasets, full codebases). Orchestrators pass `{file_path}`, NEVER paste large file content into spawn prompts.

**EXCEPTION — Task text is content, not a path:**
- Orchestrator reads plan file ONCE, extracts all task texts upfront.
- Per-task dispatch: pass extracted task text directly — do NOT pass a path and say "find your task."
- Why: Agents don't know which task is theirs; reading the full file wastes context and risks confusion.

```
# WRONG: Forces agent to read full file and locate its own task
spawn(agent, "Read tasks.md and implement Task 3")

# CORRECT: Orchestrator extracts; agent receives exactly what it needs
task_text = extract_task(tasks_file, task_index=3)
spawn(agent, f"Implement this task:\n\n{task_text}")
```
</output_size_discipline>

<rationalization_resistance>
# Agents shortcut discipline rules under time pressure, sunk cost, and "obvious" scenarios.
# Use these three mechanisms in skills and agent bodies to prevent rationalization.

**HARD_GATE_TAG: `<HARD-GATE>`**
Wrap any non-negotiable checkpoint. Agent must complete the gate condition before proceeding.

**EXTREMELY_IMPORTANT_TAG: `<EXTREMELY-IMPORTANT>`**
Wrap rules that are frequently rationalized away. Signals maximum priority; cannot be treated as optional.

**RED_FLAGS_LIST:** In every discipline skill, add a "Red Flags — STOP" section.
Format: List of exact thoughts/behaviors → single corrective action.

**RATIONALIZATION_TABLE:** Capture specific rationalizations from testing.
Format: `| Excuse | Reality |` — include after the Red Flags list in every discipline skill.
</rationalization_resistance>

<claudeignore_entries>
# Recommended .claudeignore entries for agent and skill development:
dist/
node_modules/
.nx/cache/
coverage/
playwright-report/
test-results/
tmp/pipeline-*
*.map
*.min.js
# Worktree directories (REQUIRED — see <worktree_safety_protocol>)
.worktrees/
worktrees/
# Python
.venv/
venv/
env/
__pycache__/
*.pyc
# Skill development artifacts
*.svg
# Database files
*.db
*.sqlite
*.sqlite3
# Secrets
.env
.env.local
*.pem
*.key
</claudeignore_entries>

</optimization_rules>

---

<session_bootstrap>
# Use SessionStart hooks to inject shared context before any user message.
# Critical: hook must be SYNCHRONOUS — async hooks arrive after the agent has already started responding.

Claude Code hook output format:
```json
{
  "hookSpecificOutput": {
    "additionalContext": "<shared skill or context content here>"
  }
}
```

Cursor hook output format:
```json
{ "additional_context": "<content>" }
```

Cache stability requirement (enforced by `<prompt_cache_discipline>`):
Hook output must be byte-for-byte identical across sessions with identical inputs.
Verify: `diff <(./hooks/session-start) <(./hooks/session-start)` — should produce no output.
If output varies: timestamps, env vars, or mutable state is leaking into output.

BOOTSTRAP_RULES:
- Keep injected content STATIC — no timestamps, no session IDs, no env-specific data.
- Bootstrap content must appear BEFORE dynamic content (STATIC_FIRST rule).
- If bootstrap content changes between deploys, the cache is invalidated for all sessions until the new prefix is cached.
</session_bootstrap>

---

<strict_conventions>
- `MODEL_SELECTION: SONNET_ONLY`. Do not request or configure Opus. Scale reasoning depth strictly via `effort:` levels.
- `PERMISSION_MODE: NULL`. Omit from all frontmatter. Rely on user prompting or structured hooks.
- `STATE_MANAGEMENT: STRUCTURED_JSON`. Use `pipeline-state.json` bounded to `tmp/` directories. DO NOT use `memory: project` or `memory: local`.

<effort_reference>
# All 5 values valid in agent frontmatter. Unified spec:
effort: low | medium | high | xhigh | max

low:    Triage, routing, simple extraction. Minimal reasoning depth.
medium: Most worker agents. Solid reasoning without extended thinking budget.
high:   Architect, auditor, multi-file analysis agents. Extended thinking enabled.
xhigh:  Cross-system integration tasks with multiple competing constraints.
max:    Last resort for truly ambiguous problems. High cost. Use sparingly.
</effort_reference>

<path_variable_protocol>
- Orchestrators MUST define `{OUT}` and `{REF}` as absolute shell environment variables.
- Sub-agent spawn prompts must resolve these via subshell string substitution before launch.
- Agents must never contain hardcoded paths.
</path_variable_protocol>

<programmatic_tool_audit>
- Orchestrator `PostToolUse` logic MUST track tool utilization.
- Rule: IF `Tool_X` invocations == 0 across 3 consecutive iterations -> Automatically prune `Tool_X` from sub-agent payload.
</programmatic_tool_audit>

<bash_permission_protocol>
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: 'echo ''{"permissionDecision": "allow"}'''
</bash_permission_protocol>

<settings_permissions>
- `Bash(*)` in `permissions.allow` covers ALL bash variants. Never add specific `Bash(command:*)` entries — redundant noise.
- Remove `PreToolUse` auto-allow hook when `Bash(*)` is already in permissions.
- `defaultMode` must appear once at top-level only — remove duplicate inside `permissions`.
</settings_permissions>

<worktree_safety_protocol>
# Execute in this order before creating any worktree.

1. VERIFY_IGNORED: Run `git check-ignore -q .worktrees` or `git check-ignore -q worktrees`.
   If NOT ignored:
   - Add `.worktrees/` to .gitignore.
   - Commit: `git add .gitignore && git commit -m "chore: ignore worktrees dir"`
   - Then create the worktree.
   - Why: Unignored worktree dirs pollute `git status` and risk accidental commits of secrets or binaries.

2. SETUP_AFTER_CREATE: After `git worktree add`, auto-detect and run project setup:
   - Node.js (`package.json`): `npm install`
   - Rust (`Cargo.toml`): `cargo build`
   - Python (`requirements.txt`): `pip install -r requirements.txt`
   - Go (`go.mod`): `go mod download`

3. VERIFY_BASELINE: Run the full test suite before any implementation begins.
   If tests fail: Report failures. Do NOT proceed without human approval.
   Why: Distinguishes pre-existing failures from failures caused by implementation.

4. COMMIT_BEFORE_DESTROY: Before any worktree removal (container teardown, pipeline end):
   If uncommitted changes exist: `git stash` or `git commit --allow-empty-message`.
   Do NOT destroy a worktree with uncommitted changes.
</worktree_safety_protocol>

<pipeline_state_schema>
# Standard schema for tmp/pipeline-state.json
{
  "pipeline_id": "<uuid>",
  "started_at": "<iso8601>",
  "pattern": "<1|2|2b|3|4|5>",
  "status": "running|completed|escalated|failed",
  "current_phase": 0,
  "phases": [
    {
      "index": 0,
      "name": "<phase name>",
      "status": "pending|running|done|failed",
      "agent": "<agent name>",
      "outputs": ["<path>"],
      "error": null
    }
  ],
  "metadata": {}
}

RECOVERY_RULES:
- On startup: check for existing state file.
  - `status == "running"` and `started_at > 1h ago`: treat as crashed, log warning.
  - `status == "completed"`: skip pipeline, log "already done".
  - `status == "escalated"` or `"failed"`: surface to human. Do not auto-resume.
- Resume: start from `current_phase + 1` (skip completed phases).
- Restart: delete state file and re-initialize.
- Corrupt state (parse error): do NOT auto-resume. Escalate to human.
- Write state atomically: write to `.tmp`, then rename. Prevents partial writes.
</pipeline_state_schema>

<mcp_tool_naming>
# Always use fully qualified names when referencing MCP tools in skills or agent bodies.
Format: ServerName:tool_name

Examples:
  Use the BigQuery:bigquery_schema tool to retrieve table schemas.
  Use the GitHub:create_issue tool to file a bug report.

Where: ServerName = MCP server name as configured in `mcpServers`; tool_name = tool within that server.
Unqualified names fail when multiple MCP servers expose tools with similar names. Always qualify.
</mcp_tool_naming>

</strict_conventions>

---

<claude_4_6_conventions>
# Canonical patterns for Claude Sonnet 4.6 / Opus 4.6 / Haiku 4.5 agent and skill authoring.

<adaptive_thinking>
- Models: `thinking: {type: "adaptive"}` — calibrates per query + effort parameter.
- Scale via `effort: low | medium | high | xhigh | max` (frontmatter-level, not inline). See `<effort_reference>`.
- `max_tokens`: 64k recommended for autonomous multi-step agents at medium+ effort.
- Enable extended thinking in a skill by including the word `ultrathink` in the skill body.
</adaptive_thinking>

<memory_tool>
- Claude 4.6 extracts and saves key facts to local files for continuity across sessions.
- Prefer `references/*.md` over memory tool for deterministic rules; use memory only for learned heuristics.
- Set `autoMemoryEnabled: false` (or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`) to reclaim the 658+ token baseline.
</memory_tool>

<model_selection_policy>
- Pipelines: `MODEL_SELECTION: SONNET_ONLY` (scale via effort, not model).
- Interactive agents: Sonnet 4.6 default; Opus 4.7 only on explicit user upgrade; Haiku 4.5 for batch/triage.
- Current model IDs (as of 2026-05): `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`.
- Never hardcode retired model IDs. These IDs are current — verify before using in production.
</model_selection_policy>

</claude_4_6_conventions>

---

<prompt_cache_discipline>
# At Anthropic's Claude Code harness, devs run alerts on cache-hit rate; low hit rate = SEV.
- `STATIC_FIRST: TRUE` — System prompt, skills, tools at the start; dynamic content LAST.
- `NO_TOOL_CHURN: TRUE` — Never add/remove/reorder tools mid-session; use mode-switching tools or `defer_loading` instead.
- `SKILLS_LIST_STABLE: TRUE` — Changing the skills list in a container invalidates cache. Keep consistent across requests.
- `NO_DYNAMIC_TIMESTAMPS: TRUE` — Timestamps in static prompts shatter prefix matching.
- `BREAKPOINT_STRATEGY` — Place `cache_control` breakpoint on the LAST block that stays identical across requests. Up to 4 breakpoints.
- `TTL_ORDERING` — 1-hour cache entries MUST appear before 5-minute entries. Use 1h TTL for long agent loops (>5 min between calls).
- `THINKING_CACHE` — Thinking blocks CAN be cached in previous assistant turns; count as input tokens on cache read.
</prompt_cache_discipline>

---

<skill_agent_pairing_convention>
# Every orchestrator agent pairs with EITHER an inline workflow OR a companion `{agent-name}-references/` skill.

<pairing_rules>
- Agent body ≤150 lines STRICT. Offload depth to the companion skill's `references/*.md`.
- Companion skill: `name: {agent}-references`, `user-invocable: false`, `disable-model-invocation: true`.
- Companion skill has NO `SKILL.md` body-invocation logic — only a `references/` subdirectory.
- Agent reads reference files on demand via `Read` tool. NEVER preload reference files.
- Agent `skills:` frontmatter preloads SHARED method skills (`sk-4d-method`, `sk-spec-driven-development`, `sk-claude-code-conventions`), NOT the companion reference skill.
</pairing_rules>

<subagent_skill_integration>
- `skills:` frontmatter on a subagent = FULL CONTENT injected at startup (different from session-level metadata-only discovery).
- Skills with `context: fork` run the skill body as a subagent prompt — useful for isolated research/analysis.
- `Skill(name)` / `Skill(name *)` in permissions = fine-grained allow/deny per skill.
</subagent_skill_integration>

<progressive_disclosure_rules>
- SKILL.md body ≤500 lines. Reference files one level deep from SKILL.md (never nested).
- Reference files with >100 lines MUST include a table-of-contents at the top.
- SKILL.md serves as a navigation index; refs carry depth.
- Metadata (name + description) pre-loads in system context (~100 tokens per skill). Body loads on invocation. Refs on read.
- Avoid `head -100` partial reads: if a file is long, Claude truncates; put summary + ToC first.
</progressive_disclosure_rules>

<skill_body_structure>
# Standard SKILL.md structure. Adapt section depth to skill complexity.

---
name: skill-name-with-hyphens
description: Use when [triggering conditions only — NO workflow summary]
---

# Skill Name

## Overview
Core principle in 1-2 sentences. What problem this solves.

## When to Use
Bullet list: symptoms and contexts where this applies.
When NOT to use.
[Flowchart ONLY if the decision is non-obvious. Never for linear steps.]

## Core Pattern or Process
[For technique/discipline skills: the step-by-step or cycle]
[Before/after comparison if a "bad vs. good" pattern exists]

## Quick Reference
Table or short bullet list — optimized for scanning, not reading.

## Common Mistakes
What goes wrong + specific fix for each.

## Red Flags — STOP (for discipline-enforcing skills only)
List of exact thoughts/behaviors that signal the agent is rationalizing.
Format: bullet list → single corrective action.

## Rationalization Table (for discipline-enforcing skills only)
| Excuse | Reality |
|--------|---------|
| "<specific rationalization>" | "<why it is wrong>" |

RULES for skill authors:
- Flowcharts: ONLY for non-obvious decisions, process loops, or A-vs-B choices.
  Never for: reference material (use tables), code (use code blocks), linear steps (use numbered lists).
- Code examples: ONE excellent example in the most relevant language. Not multi-language.
- Cross-references: Use explicit markers:
    REQUIRED: `**REQUIRED SUB-SKILL:** Use sk-test-driven-development`
    Background: `**REQUIRED BACKGROUND:** Understand sk-systematic-debugging first`
  NEVER use `@path/to/file` — this force-loads the file into context immediately.
</skill_body_structure>

</skill_agent_pairing_convention>

---

<skill_namespace>
NAMING_TIERS (priority order when names conflict):
1. User personal skills (`~/.claude/skills/`) — highest priority
2. Project skills (`.claude/skills/` in repo) — project-specific overrides
3. Plugin skills (installed via plugin manager) — shared library
4. `sk-*` shared method skills — lowest priority

QUALIFIED_INVOCATION:
When conflict is known or possible, use plugin-qualified names:
`plugin-name:skill-name` (e.g., `superpowers:test-driven-development`)

PREFIX_RESERVATION:
- `sk-*` — Reserved for shared cross-pipeline method skills.
- `{agent}-references` — Reserved for companion reference skills.
- Do NOT use either prefix for project-specific or user personal skills.

CONFLICT_DETECTION:
If two skills have the same name at the same tier: the last one loaded wins.
Log a warning when this occurs: "Skill name collision: {name} from {source_a} shadowed by {source_b}."
</skill_namespace>

---

<skill_deployment_checklist>
# Test every skill before deploying to pipeline agents.
# Untested skills in pipeline contexts cost more to fix than to test upfront.

MINIMUM_TEST_PROTOCOL:
1. **RED (Baseline):** Run 2-3 representative tasks WITHOUT the skill.
   Document: What did the agent do? What did it skip? What rationalizations did it use?

2. **GREEN (With skill):** Run the same tasks WITH the skill.
   Verify: Agent follows the skill's process. Check each checklist item.

3. **PRESSURE TEST:** Combine 2-3 simultaneous pressures:
   - Time: "I need this in 5 minutes"
   - Sunk cost: "I've already spent 3 hours on this"
   - Obvious answer: "The solution is clearly just X"
   Verify: Agent follows the skill even under combined pressure.

4. **MODEL VARIANCE:** Test with the weakest model you plan to deploy with.
   A skill that works with Sonnet at `effort: high` may fail with Sonnet at `effort: low`.

<HARD-GATE>
Do NOT add a skill to any agent's `skills:` frontmatter until all four steps pass.
Document baseline failures and test results — this becomes the skill's test record.
</HARD-GATE>
</skill_deployment_checklist>

---

<agent_versioning>
BREAKING_CHANGES (require version bump):
- Changes to the output schema (field names, types, required fields)
- Changes to required inputs (new required context orchestrators must provide)
- Removal of a tool the orchestrator relies on
- Changes to status protocol (DONE/BLOCKED/etc. format)

NON_BREAKING_CHANGES (no version bump required):
- Improving internal reasoning
- Adding optional output fields (backwards-compatible)
- Changing effort level
- Adding tools that don't change output schema

VERSIONING CONVENTION (add to agent frontmatter):
```
version: "1.0"    # Bump major on breaking change, minor on non-breaking
```

CAPABILITY CONTRACT (document in agent body):
```
# Inputs required: {task_file_path}, {project_context}
# Output schema: { "status": "DONE|BLOCKED|...", "outputs": [...] }
# Breaking change log: v2.0 - changed output.results to output.findings
```
</agent_versioning>

---

<method_registry>
# Canonical shared method-reference skills. Preload via agent `skills:` frontmatter.
| Skill | Purpose | Invoke pattern |
| :--- | :--- | :--- |
| `sk-4d-method` | Per-invocation request processing (Deconstruct→Diagnose→Develop→Deliver). | Reference-only; preload in agent `skills:`. |
| `sk-spec-driven-development` | Multi-step SDD workflow (GitHub Spec Kit commands + artifacts). | Reference-only; preload in agent `skills:`. |
| `sk-claude-code-conventions` | Claude 4.6 feature reference (thinking, caching, memory, frontmatter schemas). | Reference-only; preload in agent `skills:`. |
| `sk-*` prefix reserved for shared method skills | — | — |
| `{agent}-references` | Agent-specific deep reference library. | `Read` files on demand; do NOT preload. |
</method_registry>
