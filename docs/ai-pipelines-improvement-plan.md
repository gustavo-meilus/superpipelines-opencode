# AI_PIPELINES_LLM.md — Improvement Plan

> **Purpose:** Identify every gap and critical edge case in `AI_PIPELINES_LLM.md` that prevents seamless operation with Claude skills and agents. For each gap: what is broken, why it matters, exactly what to add or change.
>
> **Sources for this analysis:** Full read of `AI_PIPELINES_LLM.md`, all 14 Superpowers core skills, Anthropic's official skill authoring best practices, and the empirical findings documented in `superpowers-vs-ai-pipelines.md`.
>
> **Priority tiers:**
> - **CRITICAL** — causes failures, incorrect agent behavior, or silent data loss
> - **IMPORTANT** — causes inconsistency, quality degradation, or wasted tokens
> - **ENHANCEMENT** — improves completeness and long-term maintainability

---

## Table of Contents

1. [Critical Gaps](#critical-gaps)
   - [C1 — Description discipline instructs the wrong pattern](#c1--description-discipline-instructs-the-wrong-pattern)
   - [C2 — Skill loading modes are conflated](#c2--skill-loading-modes-are-conflated)
   - [C3 — WRITE_REVIEW_ISOLATION is underspecified](#c3--write_review_isolation-is-underspecified)
   - [C4 — PASS_PATHS_NOT_CONTENT contradicts task dispatch](#c4--pass_paths_not_content-contradicts-task-dispatch)
   - [C5 — Iterative Loop has no failure escalation protocol](#c5--iterative-loop-has-no-failure-escalation-protocol)
   - [C6 — Pattern 5 has no human approval gate before implementation](#c6--pattern-5-has-no-human-approval-gate-before-implementation)
   - [C7 — No subagent status protocol](#c7--no-subagent-status-protocol)

2. [Important Gaps](#important-gaps)
   - [I1 — Worktree safety prerequisites missing](#i1--worktree-safety-prerequisites-missing)
   - [I2 — Context distribution matrix has two missing rows](#i2--context-distribution-matrix-has-two-missing-rows)
   - [I3 — effort values inconsistent between sections](#i3--effort-values-inconsistent-between-sections)
   - [I4 — No SessionStart bootstrap architecture](#i4--no-sessionstart-bootstrap-architecture)
   - [I5 — SKILL.md body structure not specified](#i5--skillmd-body-structure-not-specified)
   - [I6 — MCP tool naming convention absent from skill guidance](#i6--mcp-tool-naming-convention-absent-from-skill-guidance)
   - [I7 — Pipeline state schema and recovery undefined](#i7--pipeline-state-schema-and-recovery-undefined)

3. [Enhancement Gaps](#enhancement-gaps)
   - [E1 — 4D feedback routing triggers are underspecified](#e1--4d-feedback-routing-triggers-are-underspecified)
   - [E2 — .claudeignore missing key entries](#e2--claudeignore-missing-key-entries)
   - [E3 — No rationalization resistance framework](#e3--no-rationalization-resistance-framework)
   - [E4 — Skill namespace conflict resolution absent](#e4--skill-namespace-conflict-resolution-absent)
   - [E5 — No skill testing protocol before pipeline deployment](#e5--no-skill-testing-protocol-before-pipeline-deployment)
   - [E6 — No agent versioning or capability contract](#e6--no-agent-versioning-or-capability-contract)

4. [Implementation Order](#implementation-order)

---

## Critical Gaps

---

### C1 — Description discipline instructs the wrong pattern

**Location in current doc:** `<description_discipline>` block, `<optimization_rules>`

**The bug:**

The current rule is:
```
Pattern: <what it does>. <when to use it>.
```

This is the empirically wrong pattern. When a description summarizes what a skill _does_ (including any part of its workflow), Claude uses the description as a shortcut and never reads the full skill body. This is not theoretical — it was discovered in production testing on the Superpowers codebase:

A description saying "dispatches subagent per task with code review between tasks" caused Claude to perform ONE review instead of the two-stage review clearly specified in the skill's flowchart. Changing the description to triggering conditions only ("Use when executing implementation plans with independent tasks") fixed the behavior without changing any skill content.

**Why it matters for pipelines:** A pipeline agent using a skill with a workflow-summary description will silently execute a truncated version of that skill. There is no error — the agent believes it followed the skill. This is one of the hardest failure modes to diagnose.

**The fix:**

Replace the current rule:
```
Pattern: <what it does>. <when to use it>.
```

With:
```
Description = ONLY triggering conditions. NEVER summarize the skill's process or workflow.

Pattern: "Use when [specific triggering conditions and symptoms]"

Why: Claude reads description to decide whether to load the skill body. If the description
summarizes the workflow, Claude follows the description as a shortcut and skips the body.
The skill becomes documentation that is never read.

# ❌ WRONG: Summarizes workflow — Claude skips the body
description: Processes Excel files by reading sheets, cleaning data, and generating charts.
             Use when working with spreadsheets.

# ❌ WRONG: Process detail in description
description: Use for commit messages — analyze diff, extract intent, write conventional commit.

# ✅ CORRECT: Triggering conditions only, no workflow
description: Use when working with Excel files, spreadsheets, or .xlsx data extraction.

# ✅ CORRECT: Problem-symptom triggers
description: Use when tests have race conditions, timing dependencies, or fail inconsistently.
```

---

### C2 — Skill loading modes are conflated

**Location in current doc:** `<context_distribution_matrix>` (skills row) and `<subagent_skill_integration>`

**The bug:**

The context distribution matrix lists skills as:
```
| `skills` | Orchestration logic, shared QA standards. | On-demand or `skills:` YAML | MED (On-invocation) |
```

"On-demand or `skills:` YAML" describes two completely different behaviors as if they were equivalent. They are not:

| Mode | How it loads | Token cost | Trigger |
|---|---|---|---|
| Session-level discovery | Only `name` + `description` (~100 tokens per skill) pre-loaded; body loaded lazily when agent invokes | LOW at startup, MED on invocation | Agent decides at runtime |
| Agent `skills:` frontmatter | **Full body content injected at startup** | HIGH (burns immediately, every startup) | Static, unconditional |

A developer reading "MED (On-invocation)" for a skill in an agent's `skills:` frontmatter will expect lazy loading. They will get the full body injected at every startup — potentially hundreds of lines of content for every agent invocation, paid whether or not the skill is relevant to the current task.

**Why it matters:** A single large session-workflow skill (e.g., `brainstorming` at ~165 lines, `subagent-driven-development` at ~120 lines) placed in an agent's `skills:` frontmatter will inject that content in full at every startup. Across 100 pipeline runs, this multiplies context cost by the number of skills in frontmatter.

**The fix:**

Split the skills row into two rows in the context distribution matrix:

```
| Storage Location          | Scope & Purpose                              | Load Mechanism                           | Token Cost Factor         |
| :---                      | :---                                         | :---                                     | :---                      |
| `skills` (session-level)  | Discoverable by all session agents.          | Metadata only at startup; body on agent  | LOW startup + MED on-use  |
|                           |                                              | invocation via Skill tool                |                           |
| `skills:` (frontmatter)   | Pre-configured for specific agent.           | FULL body injected at agent startup,     | HIGH (every startup)      |
|                           | Use ONLY for shared method skills            | unconditionally                          |                           |
|                           | (sk-4d-method, sk-spec-driven-development).  |                                          |                           |
|                           | NEVER put large workflow skills here.        |                                          |                           |
```

Also add an explicit rule:
```
SKILL_FRONTMATTER_SCOPE: SHARED_METHODS_ONLY
- Agent `skills:` frontmatter: ONLY sk-* shared method skills (< 100 lines each).
- Session-workflow skills (brainstorming, debugging, TDD): NEVER in agent frontmatter.
  These are designed for lazy session-level invocation, not pre-injection.
- Companion reference skills ({agent}-references): NEVER in `skills:` — read on demand via `Read`.
```

---

### C3 — WRITE_REVIEW_ISOLATION is underspecified

**Location in current doc:** `<core_architecture>` (top-level flag)

**The bug:**

```
WRITE_REVIEW_ISOLATION: TRUE (Writing agent != Reviewing agent).
```

This defines isolation at the agent boundary but says nothing about:

1. **Two-stage review order:** Review is not a single step. There are two distinct reviews that must happen in a specific order:
   - **Stage 1 — Spec compliance:** Does the output match the requirements exactly? (Neither missing requirements nor adding unrequested features)
   - **Stage 2 — Code/output quality:** Is it well-written, maintainable, and correct?
   Stage 1 MUST pass before Stage 2 begins. Running quality review on spec-noncompliant output is wasted work.

2. **Over-building is a spec violation, not a quality issue:** If an implementer adds a feature that was not in the spec ("while I was in there, I also added..."), this fails spec compliance review. The current rule implies review is a single pass; in practice it requires two separate specialized agents.

3. **Review loops:** When a reviewer finds issues, the implementer fixes them and the reviewer re-reviews. The rule says nothing about this loop or when it terminates.

**Why it matters for pipelines:** Without the two-stage structure, a Pattern 3 (Iterative Loop) will often loop on quality issues while spec compliance problems are already baked in. The loop terminates when quality looks acceptable, not when requirements are met.

**The fix:**

Replace the single flag with an expanded rule:

```
WRITE_REVIEW_ISOLATION: TRUE
- Writing agent != Reviewing agent (enforced).
- REVIEW_STAGES: TWO — spec compliance first, code quality second.
  - Stage 1 (Spec Compliance): Does output match spec exactly? Under-build AND over-build both fail.
    Gate: Stage 2 cannot begin until Stage 1 passes.
  - Stage 2 (Code Quality): Is output well-written, maintainable, idiomatic?
- REVIEW_LOOP: Reviewer finds issues → Implementer fixes → Reviewer re-reviews.
  Terminate only when reviewer approves, not after a single pass.
- OVER_BUILD_IS_SPEC_FAILURE: Adding unrequested features fails Stage 1, not Stage 2.
```

---

### C4 — PASS_PATHS_NOT_CONTENT contradicts task dispatch

**Location in current doc:** `<output_size_discipline>`

**The bug:**

```
PASS_PATHS_NOT_CONTENT: TRUE (Orchestrators pass `{file_path}`, NEVER paste file content into spawn prompts).
```

This is correct for large files (logs, datasets, full codebases) but creates an unresolved contradiction for task dispatch:

- Pattern 5 creates `tasks.md` — a file containing N tasks, one per agent session.
- When the orchestrator dispatches Task #3, should it pass `{tasks_file_path}` and tell the agent to "find your task"? That forces the agent to read the whole file and guess which task is theirs.
- Or should it extract Task #3's text and pass it directly? That contradicts PASS_PATHS_NOT_CONTENT.

The Superpowers SDD skill resolves this explicitly: the **orchestrator** reads the plan file once, extracts all task text upfront, and passes each task's **extracted text** (not a path) to the implementer. The agent never touches the plan file. This is not a violation of PASS_PATHS_NOT_CONTENT because the task text is small and targeted, not a large file dump.

The rule as written does not distinguish between "don't dump large file content" (correct) and "never pass any content" (wrong for targeted task descriptions).

**The fix:**

Add a clarification with a concrete example:

```
PASS_PATHS_NOT_CONTENT: TRUE — for large files (logs, datasets, full codebases).
EXCEPTION — Task text is content, not a path:
  - Orchestrator reads plan file ONCE, extracts all task texts upfront.
  - Per-task dispatch: pass extracted task text directly — do NOT pass a path and say "find your task."
  - Why: Agents don't know which task is theirs; reading the full file wastes context and risks confusion.

Pattern:
  # WRONG: Forces agent to read full file and locate its task
  spawn(agent, "Read tasks.md and implement Task 3")

  # CORRECT: Orchestrator extracts; agent receives exactly what it needs
  task_text = extract_task(tasks_file, task_index=3)
  spawn(agent, f"Implement this task:\n\n{task_text}")
```

---

### C5 — Iterative Loop has no failure escalation protocol

**Location in current doc:** Pattern 3 `<pattern id="3" name="Iterative_Loop">`

**The bug:**

```
Loop(MAX_ITERATIONS: N): Tester(tests) -> Analyzer(diagnoses) -> Fixer(applies) -> RESTART
```

The loop defines MAX_ITERATIONS but specifies nothing about what happens when it is reached, and more importantly, provides no signal that the loop should be abandoned before MAX_ITERATIONS.

Evidence from Superpowers' `systematic-debugging` skill: when 3+ fix attempts all fail, this almost always indicates an **architectural problem**, not a fixable bug. Each fix attempt tends to reveal a new failure in a different place. Attempting a fourth fix without reconsidering the architecture produces more bugs, not resolution.

The current pattern will silently burn all N iterations before stopping, with no human escalation and no architectural reconsideration.

**Why it matters:** A pipeline loop that runs MAX_ITERATIONS=10 on an architectural problem will make 10 incremental changes that together corrupt the codebase. The system exits the loop in a worse state than it entered.

**The fix:**

Add an escalation clause to Pattern 3:

```xml
<pattern id="3" name="Iterative_Loop">
Loop(MAX_ITERATIONS: N): Tester(tests) -> Analyzer(diagnoses) -> Fixer(applies) -> RESTART

ESCALATION_PROTOCOL:
- After 3 failed iterations without progress: STOP. Do NOT attempt iteration 4.
  Signal: Each fix reveals a new failure in a different location.
  Diagnosis: This is an architectural problem, not a fixable bug.
  Action: Escalate to human or Pattern 4 (Human_Gated) before continuing.

- On MAX_ITERATIONS reached without resolution:
  Action: Write failure summary to pipeline-state.json.
  Fields: { "status": "escalated", "iterations": N, "last_failure": "<description>",
            "attempted_fixes": ["fix1", "fix2", ...] }
  Do NOT silently exit. Surface the state to the orchestrator.

- Progress detection: Between iterations, compare test failure count.
  If failures are not decreasing after 2 iterations: treat as architectural signal.
</pattern>
```

---

### C6 — Pattern 5 has no human approval gate before implementation

**Location in current doc:** Pattern 5 `<pattern id="5" name="Spec_Driven_Development">`

**The bug:**

```
Phase 4: /analyze + /checklist (optional) -> BLOCK if missing Acceptance Criteria.
Phase 5: /implement -> [RPI_Loop(Task_1), RPI_Loop(Task_2)] PARALLEL.
```

Phase 4 blocks on missing Acceptance Criteria (a machine-checkable condition), but there is no gate requiring a human to review and approve the spec before implementation begins at scale.

This is critical in pipeline contexts: Phase 5 may dispatch many parallel agents simultaneously. If the spec misunderstood the requirements, all parallel work is wrong and must be discarded. The cost of a misunderstood spec compounds with every parallel agent.

Pattern 4 (Human_Gated) exists but is not referenced as a required step between spec validation and parallel implementation in Pattern 5.

**The fix:**

Insert a mandatory gate between Phase 4 and Phase 5:

```
Phase 4: /analyze + /checklist (optional) -> BLOCK if missing Acceptance Criteria.
Phase 4b: GATE(AskUserQuestion) ->
          "Spec and tasks written. Please review spec.md and tasks.md before I begin
           parallel implementation. [APPROVE | REVISE]"
          Wait for APPROVE. If REVISE: return to Phase 2.
          Rationale: Phase 5 dispatches N parallel agents. A misunderstood spec
          means N agents produce wrong output simultaneously. Gate cost: ~1 minute.
          Ungated mistake cost: discard all parallel work and restart.
Phase 5: /implement -> [RPI_Loop(Task_1), RPI_Loop(Task_2)] PARALLEL.
```

---

### C7 — No subagent status protocol

**Location in current doc:** No current coverage — entirely absent.

**The bug:**

The document defines how to spawn agents and how to structure pipelines, but never defines what statuses a subagent should return to its orchestrator or how the orchestrator handles each status.

Without a standard protocol, agents either:
- Return freeform text that the orchestrator must parse heuristically
- Signal completion via side effects (file written) with no status metadata
- Fail silently (no output, no error, no indication of why)

**Why it matters:** Silent failure is the worst failure mode. A timed-out agent, an agent that hit context limits, and an agent that successfully completed all look the same if there's no status protocol.

**The fix:**

Add a new section `<subagent_status_protocol>`:

```xml
<subagent_status_protocol>
# Standard terminal statuses for all pipeline subagents.
# Every agent MUST emit exactly one of these before exiting.

DONE
  Condition: Task completed. All outputs written to specified paths.
  Orchestrator action: Proceed to next phase or review stage.
  Output: { "status": "DONE", "outputs": ["{path1}", "{path2}"] }

DONE_WITH_CONCERNS
  Condition: Task completed but agent flagged doubts about correctness or scope.
  Orchestrator action: Read concerns before proceeding. If concerns touch correctness
    or scope, address before review. If observational only, proceed to review.
  Output: { "status": "DONE_WITH_CONCERNS", "concerns": "<text>", "outputs": [...] }

NEEDS_CONTEXT
  Condition: Task cannot begin — critical information was not provided.
  Orchestrator action: Identify missing context. Re-dispatch with same model + added context.
    Do NOT re-dispatch without resolving the missing information.
  Output: { "status": "NEEDS_CONTEXT", "missing": "<what is needed>" }

BLOCKED
  Condition: Agent cannot complete task even with context.
  Orchestrator action:
    1. If context problem: provide more context, re-dispatch with same model.
    2. If reasoning problem: re-dispatch with higher effort or more capable model.
    3. If task too large: decompose into smaller tasks, re-dispatch each.
    4. If architectural problem: escalate to human. Do NOT retry same approach.
  Output: { "status": "BLOCKED", "reason": "<description>", "attempted": "<what was tried>" }

RULE: Never ignore a non-DONE status. Never force a re-dispatch without addressing
the root cause of NEEDS_CONTEXT or BLOCKED.
</subagent_status_protocol>
```

---

## Important Gaps

---

### I1 — Worktree safety prerequisites missing

**Location in current doc:** `WORKTREE_MERGE_REQUIRED: TRUE` in `<core_architecture>`

**The gap:**

`WORKTREE_MERGE_REQUIRED: TRUE` states the merge requirement but skips the prerequisites that make worktrees safe to create. Creating a project-local worktree directory without first verifying it is gitignored will cause `git status` to show the worktree's contents — including any secrets, compiled binaries, or large files generated during the task. This can lead to accidental commits of worktree contents or noise in every subsequent git operation.

**The fix:**

Expand the worktree rule:

```
WORKTREE_MERGE_REQUIRED: TRUE

WORKTREE_SAFETY_PROTOCOL (execute in order before creating any worktree):
1. VERIFY_IGNORED: Run `git check-ignore -q .worktrees` or `git check-ignore -q worktrees`.
   If NOT ignored:
     a. Add `.worktrees/` to .gitignore.
     b. Commit the change: git add .gitignore && git commit -m "chore: ignore worktrees dir"
     c. Then create the worktree.
   Why: Unignored worktree dirs pollute git status and risk accidental secret commits.

2. SETUP_AFTER_CREATE: After `git worktree add`, auto-detect and run project setup:
   - Node.js (package.json): npm install
   - Rust (Cargo.toml): cargo build
   - Python (requirements.txt): pip install -r requirements.txt
   - Go (go.mod): go mod download

3. VERIFY_BASELINE: Run the full test suite before any implementation begins.
   If tests fail: Report failures; do NOT proceed without human approval.
   Why: Distinguishes pre-existing failures from failures caused by implementation.

4. COMMIT_BEFORE_DESTROY: Before any worktree removal (container teardown, pipeline end):
   If uncommitted changes exist: git stash or git commit --allow-empty-message.
   Do NOT destroy worktree with uncommitted changes.
```

---

### I2 — Context distribution matrix has two missing rows

**Location in current doc:** `<context_distribution_matrix>`

**The gap:**

The current matrix has 5 rows. Two critical loading contexts are missing:

**Missing row 1 — Agent body:** The agent's system prompt (the markdown body below the YAML frontmatter) is injected at every agent startup and is always present. It is unconditionally HIGH cost. The matrix has no entry for it, making the table incomplete as a cost reference.

**Missing row 2 — `skills:` preloaded (vs. session-level):** The current "skills" row says "On-demand or `skills:` YAML — MED (On-invocation)." This is wrong for the frontmatter case. See C2 for details.

**The fix:**

Add two rows to the matrix:

```
| Agent body (.claude/agents/<name>.md) | Agent-specific workflow, constraints, initialPrompt.
  MAX 150 lines STRICT. Offload depth to companion references skill.
  | Injected at every agent startup, unconditionally. | HIGH (always-on for agent) |

| `skills:` frontmatter (preloaded)     | ONLY shared method skills (sk-4d-method, etc.).
  NEVER large workflow skills.
  | Full body injected at agent startup.             | HIGH (always-on, per skill) |
```

---

### I3 — `effort` values inconsistent between sections

**Location in current doc:** `<agent_definition_schema>` vs. `<claude_4_6_conventions>`

**The gap:**

The agent definition schema shows: `effort: low | medium | high`

The `<adaptive_thinking>` section shows: `effort: low | medium | high | xhigh | max`

The schema is authoritative for what goes in an agent file. If `xhigh` and `max` are valid values, they must appear in the schema. If they are not valid in frontmatter, the conventions section is wrong.

Additionally, the conventions section says `high` for architect/auditor agents, but never defines what `xhigh` or `max` do differently. Without this, authors cannot make an informed choice between `high`, `xhigh`, and `max`.

**The fix:**

Unify the effort values and document their effects:

```
effort: low | medium | high | xhigh | max

# Usage defaults
low:    Triage, routing, simple extraction. Minimal reasoning depth.
medium: Most worker agents. Solid reasoning without extended budget.
high:   Architect, auditor, multi-file analysis agents.
xhigh:  Cross-system integration tasks; multiple competing constraints.
max:    Last resort for truly ambiguous problems. High cost. Use sparingly.

# Schema (authoritative — all 5 values valid in frontmatter)
effort: low | medium | high | xhigh | max
```

---

### I4 — No SessionStart bootstrap architecture

**Location in current doc:** `<bash_permission_protocol>` references SessionStart only for bash auto-allow

**The gap:**

The document shows a `SessionStart` hook that auto-allows bash, but provides no guidance on using `SessionStart` for its primary use case: injecting shared context at the beginning of every session.

The Superpowers bootstrap pattern (inject `using-superpowers` before the first message) is one of the most important skill-system patterns, but it has no representation in AI_PIPELINES_LLM.md. Authors building pipeline systems that need shared session context have no guidance on:

- How to write a SessionStart hook that injects content
- The required output format for each platform (Claude Code vs. Cursor vs. others)
- Why the hook must be synchronous (`async: false`)
- How to keep the hook output cache-stable (critical given the cache discipline section)

**The fix:**

Add a new `<session_bootstrap>` section:

```xml
<session_bootstrap>
# Use SessionStart hooks to inject shared context before any user message.
# Critical: hook must be SYNCHRONOUS (async: false) — async hooks arrive after
# the agent has already started responding, defeating the purpose.

# Claude Code hook format:
{
  "hookSpecificOutput": {
    "additionalContext": "<shared skill or context content here>"
  }
}

# Cursor hook format:
{ "additional_context": "<content>" }

# Cache stability requirement (enforced by prompt_cache_discipline):
# Hook output must be byte-for-byte identical across sessions with identical inputs.
# Verify: diff <(./hooks/session-start) <(./hooks/session-start)
# If output varies: timestamps, env vars, or mutable state is leaking into output.

BOOTSTRAP_RULES:
- Keep injected content STATIC — no timestamps, no session IDs, no env-specific data.
- Injected skill content counts toward the cache prefix. Keep it stable.
- Bootstrap content must appear BEFORE dynamic content (STATIC_FIRST rule).
- If bootstrap content changes between deploys, the cache is invalidated for all
  sessions until the new prefix is cached again.
</session_bootstrap>
```

---

### I5 — SKILL.md body structure not specified

**Location in current doc:** `<skill_agent_pairing_convention>` covers agent body; `<progressive_disclosure_rules>` covers size/depth limits

**The gap:**

The document specifies how long SKILL.md can be (≤500 lines) and how deep references can nest (one level), but never specifies the internal structure of SKILL.md. Without a standard structure:

- Claude cannot efficiently scan a skill for relevant content (no Overview → Quick Reference → Implementation ordering)
- Flowcharts are used for linear content (should be bullet lists) and omitted for non-obvious decisions (where they're genuinely needed)
- Code examples are duplicated across multiple languages instead of one excellent example
- Discipline skills lack rationalization resistance (no Red Flags list, no rationalization table)

**The fix:**

Add a standard SKILL.md template:

```markdown
<skill_body_structure>
# Standard SKILL.md structure (adapt section depth to skill complexity):

---
name: skill-name-with-hyphens
description: Use when [triggering conditions only — NO workflow summary]
---

# Skill Name

## Overview
Core principle in 1-2 sentences. What problem this solves.

## When to Use
[Flowchart ONLY if the decision is non-obvious. Never for linear steps.]
Bullet list: symptoms and contexts where this applies.
When NOT to use.

## Core Pattern or Process
[For technique/discipline skills: the step-by-step or cycle]
[Before/after comparison if a "bad vs. good" pattern exists]

## Quick Reference
Table or short bullet list — optimized for scanning, not reading.

## Common Mistakes
What goes wrong + specific fix for each.

## Red Flags — STOP (for discipline-enforcing skills only)
List of thoughts/actions that signal the agent is rationalizing.
Format: bullet list of exact phrases/behaviors + "All of these mean: [corrective action]."

## Rationalization Table (for discipline-enforcing skills only)
| Excuse | Reality |
|--------|---------|
| "<specific rationalization>" | "<why it is wrong>" |

RULES:
- Flowcharts: ONLY for non-obvious decisions, process loops, or A-vs-B choices.
  Never for: reference material (use tables), code (use code blocks), linear steps (use numbered list).
- Code examples: ONE excellent example in the most relevant language. Not multi-language.
- Cross-references: Use skill names with explicit markers:
    REQUIRED: **REQUIRED SUB-SKILL:** Use sk-test-driven-development
    Background: **REQUIRED BACKGROUND:** Understand sk-systematic-debugging first
  NEVER use @path/to/file — this force-loads the file into context immediately.
</skill_body_structure>
```

---

### I6 — MCP tool naming convention absent from skill guidance

**Location in current doc:** `mcpServers: - server-name` in the agent schema; no skill-level guidance

**The gap:**

The agent schema includes `mcpServers:` but when a skill references an MCP tool, there is no guidance on the naming format. When multiple MCP servers are active, an unqualified tool name (`bigquery_schema`) is ambiguous. Claude may fail to locate the tool or invoke the wrong server's version.

**The fix:**

Add to the skill body structure guidance (or as a separate rule):

```
MCP_TOOL_NAMING_IN_SKILLS:
Always use fully qualified names: ServerName:tool_name

Examples:
  Use the BigQuery:bigquery_schema tool to retrieve table schemas.
  Use the GitHub:create_issue tool to file a bug report.

Where:
  BigQuery, GitHub = MCP server names (as configured in mcpServers)
  bigquery_schema, create_issue = tool names within those servers

Unqualified names ("use bigquery_schema") will fail when multiple MCP servers
expose tools with similar names. Always qualify.
```

---

### I7 — Pipeline state schema and recovery undefined

**Location in current doc:** `STATE_MANAGEMENT: STRUCTURED_JSON` in `<strict_conventions>`

**The gap:**

`Use pipeline-state.json bounded to tmp/ directories` is stated but nothing defines:

- The schema of `pipeline-state.json` (required fields, optional fields, types)
- How to detect stale state from a crashed previous run
- Whether to resume from last checkpoint or restart from beginning on failure
- How to handle a corrupted or partially-written state file

This means every pipeline author invents their own schema, producing incompatible state formats across agents that may need to coordinate.

**The fix:**

Define a standard state schema and recovery rules:

```
PIPELINE_STATE_SCHEMA (tmp/pipeline-state.json):
{
  "pipeline_id": "<uuid>",              // Required. Unique per run.
  "started_at": "<iso8601>",            // Required. Set at pipeline init.
  "pattern": "<1|2|2b|3|4|5>",         // Required. Which execution pattern.
  "status": "running|completed|escalated|failed",  // Required. Top-level state.
  "current_phase": <integer>,           // Required. Last successfully completed phase index.
  "phases": [                           // Required. One entry per phase.
    {
      "index": <integer>,
      "name": "<phase name>",
      "status": "pending|running|done|failed",
      "agent": "<agent name>",
      "outputs": ["<path>", ...],       // Files written by this phase.
      "error": "<string or null>"
    }
  ],
  "metadata": {}                        // Optional. Pipeline-specific data.
}

RECOVERY_RULES:
- On startup: check for existing state file.
  - If status == "running" and started_at is > 1h ago: treat as crashed, log warning.
  - If status == "completed": skip pipeline, log "already done".
  - If status == "escalated" or "failed": surface to human, do not auto-resume.
- Resume: start from current_phase + 1 (skip completed phases).
- Restart: delete state file and re-initialize.
- Corrupt state (parse error): do NOT auto-resume. Escalate to human.
- Always write state atomically (write to .tmp, then rename) to prevent partial writes.
```

---

## Enhancement Gaps

---

### E1 — 4D feedback routing triggers are underspecified

**Location in current doc:** Pattern 6, `# Feedback routing: intent drift -> re-Deconstruct; ...`

**The gap:**

The feedback routing rule exists but an agent cannot determine which feedback type it received without trigger definitions. The four re-entry triggers need concrete signal descriptions:

**The fix:**

```
4D_FEEDBACK_ROUTING:
intent drift      -> re-Deconstruct
  Signals: "That's not what I asked", "You misunderstood the goal", task response
           addresses a different problem than the one asked.

vague/wrong       -> re-Diagnose
  Signals: "This is incorrect", "The output doesn't match", factual errors,
           wrong values/formats, output is technically correct but misses the point.

approach          -> re-Develop
  Signals: "Use a different method", "That approach won't work because", "Can you
           try X instead", critique of the strategy rather than the output.

polish            -> re-Deliver
  Signals: "Make it more concise", "Change the format to", "Adjust the tone",
           "Add more detail on X", cosmetic or presentation changes with no
           logical content change.
```

---

### E2 — `.claudeignore` missing key entries for agent/skill development

**Location in current doc:** `<context_distribution_matrix>` (`.claudeignore` row)

**The gap:**

Current entries: `dist/`, `node_modules/`, `.nx/cache/`, `coverage/`, `playwright-report/`, `test-results/`, `tmp/pipeline-*`, `*.map`, `*.min.js`

Missing entries that are relevant specifically for agent and skill development workflows:

**The fix:**

Add to the .claudeignore recommendation:

```
# Worktree directories (REQUIRED — see WORKTREE_SAFETY_PROTOCOL)
.worktrees/
worktrees/

# Python virtual environments
.venv/
venv/
env/
__pycache__/
*.pyc

# Skill development artifacts
*.svg               # Rendered flowchart SVGs from skill tools

# Database files (common in local dev pipelines)
*.db
*.sqlite
*.sqlite3

# Secrets and credentials (belt-and-suspenders)
.env
.env.local
*.pem
*.key
```

---

### E3 — No rationalization resistance framework

**Location in current doc:** Not present anywhere

**The gap:**

Both discipline skills (TDD, debugging, verification) and pipeline patterns face agent rationalization under pressure. Without explicit resistance mechanisms, agents shortcut discipline rules when facing time pressure, sunk cost, or "obvious" solutions.

The Superpowers system uses three mechanisms: Red Flags lists (easy self-check), rationalization tables (explicit "excuse → reality" pairs), and XML hard gates (`<HARD-GATE>`, `<EXTREMELY-IMPORTANT>`). None of these are mentioned in AI_PIPELINES_LLM.md.

**The fix:**

Add a `<rationalization_resistance>` block to the `<optimization_rules>` section:

```xml
<rationalization_resistance>
# Agents shortcut discipline rules under time pressure, sunk cost, and "obvious" scenarios.
# Use these three mechanisms in skills and agent bodies to prevent rationalization.

HARD_GATE_TAG: <HARD-GATE>
  Usage: Wrap any non-negotiable checkpoint.
  Effect: Agent must complete the gate condition before proceeding.
  Example:
    <HARD-GATE>
    Do NOT proceed to Phase 5 implementation until spec.md has human APPROVE.
    </HARD-GATE>

EXTREMELY_IMPORTANT_TAG: <EXTREMELY-IMPORTANT>
  Usage: Wrap rules that are frequently rationalized away.
  Effect: Signals maximum priority; agent cannot treat it as optional.
  Example:
    <EXTREMELY-IMPORTANT>
    Stage 1 spec compliance review MUST pass before Stage 2 code quality review begins.
    This order is not optional. This is not negotiable.
    </EXTREMELY-IMPORTANT>

RED_FLAGS_LIST: In every discipline skill, add a "Red Flags — STOP" section.
  Format: List of exact thoughts/behaviors → single corrective action.
  Example (for iterative loop):
    Red Flags — STOP iterating:
    - "One more fix should do it" (after 2+ failures)
    - "The fix is almost working"
    - Each fix reveals a failure in a new location
    All of these mean: Stop. Question the architecture. Escalate before attempting another fix.

RATIONALIZATION_TABLE: Capture specific rationalizations from testing.
  Format: | Excuse | Reality |
  Include in every discipline skill after the Red Flags list.
</rationalization_resistance>
```

---

### E4 — Skill namespace conflict resolution absent

**Location in current doc:** `<method_registry>` (defines `sk-*` prefix but no conflict rules)

**The gap:**

Multiple skill sources can be active simultaneously: project skills, `sk-*` shared method skills, companion reference skills, and user personal skills. When two sources provide skills with the same name, discovery behavior is undefined.

**The fix:**

Add to `<method_registry>` or create a `<skill_namespace>` section:

```xml
<skill_namespace>
NAMING_TIERS (priority order when names conflict):
1. User personal skills (~/.claude/skills/) — highest priority
2. Project skills (.claude/skills/ in repo) — project-specific overrides
3. Plugin skills (installed via plugin manager) — shared library
4. sk-* shared method skills — lowest priority

QUALIFIED_INVOCATION:
When conflict is known or possible, use plugin-qualified names:
  plugin-name:skill-name (e.g., superpowers:test-driven-development)

PREFIX_RESERVATION:
  sk-*         Reserved for shared cross-pipeline method skills.
  {agent}-references  Reserved for companion reference skills.
  Do NOT use either prefix for project-specific or user personal skills.

CONFLICT_DETECTION:
  If two skills have the same name at the same tier: the last one loaded wins.
  Log a warning when this occurs: "Skill name collision: {name} from {source_a} 
  shadowed by {source_b}."
</skill_namespace>
```

---

### E5 — No skill testing protocol before pipeline deployment

**Location in current doc:** Not present

**The gap:**

The document covers eval-driven agent development but provides no guidance on testing skills before deploying them to pipeline agents. An untested skill deployed to a production pipeline agent will exhibit gaps, loopholes, and rationalization failure modes that would have been caught with a 15-minute test session.

**The fix:**

Add a `<skill_deployment_checklist>` section:

```xml
<skill_deployment_checklist>
# Test every skill before deploying to pipeline agents.
# Untested skills in pipeline contexts cost more to fix than to test upfront.

MINIMUM_TEST_PROTOCOL:
1. RED (Baseline): Run 2-3 representative tasks WITHOUT the skill.
   Document: What did the agent do? What did it skip? What rationalizations did it use?

2. GREEN (With skill): Run the same tasks WITH the skill.
   Verify: Agent now follows the skill's process. Check each checklist item.

3. PRESSURE TEST: Combine 2-3 simultaneous pressures:
   - Time: "I need this in 5 minutes"
   - Sunk cost: "I've already spent 3 hours on this"
   - Obvious answer: "The solution is clearly just X"
   Verify: Agent follows the skill even under combined pressure.

4. MODEL VARIANCE: Test with the weakest model you plan to deploy with.
   A skill that works with Sonnet at effort=high may fail with Sonnet at effort=low.

DEPLOYMENT GATE:
Do NOT add a skill to any agent's `skills:` frontmatter until all four steps pass.
Document baseline failures and test results — this becomes the skill's test record.
</skill_deployment_checklist>
```

---

### E6 — No agent versioning or capability contract

**Location in current doc:** Not present

**The gap:**

Agents evolve. When an agent's interface changes (different output schema, different required inputs, renamed tool), orchestrators that depend on it may silently break. The document provides no versioning guidance.

**The fix:**

Add a `<agent_versioning>` section:

```xml
<agent_versioning>
BREAKING_CHANGES (require version bump):
- Changes to the output schema (field names, types, required fields)
- Changes to required inputs (new required context that orchestrators must provide)
- Removal of a tool the orchestrator relies on
- Changes to status protocol (DONE/BLOCKED/etc. format)

NON_BREAKING_CHANGES (no version bump required):
- Improving internal reasoning
- Adding optional output fields (backwards-compatible)
- Changing effort level
- Adding tools that don't change output schema

VERSIONING CONVENTION:
Add to agent frontmatter:
  version: "1.0"    # Bump major on breaking change, minor on non-breaking
  
COMPATIBILITY CONTRACT:
In the agent body, document:
  Inputs required: {file_path to task}, {project context}
  Output schema: { "status": "...", "outputs": [...] }
  Breaking change log: v2.0 - changed output.results to output.findings
</agent_versioning>
```

---

## Implementation Order

Ordered by impact-to-effort ratio. Fix critical gaps first; they cause active failures.

| # | Gap | Priority | Effort | Impact |
|---|---|---|---|---|
| 1 | C1 — Description discipline wrong pattern | CRITICAL | Low | Fixes silent skill shortcutting on every affected skill |
| 2 | C2 — Skill loading modes conflated | CRITICAL | Low | Fixes expensive over-loading from frontmatter misuse |
| 3 | C7 — No subagent status protocol | CRITICAL | Medium | Enables structured failure handling across all pipelines |
| 4 | C3 — WRITE_REVIEW_ISOLATION underspecified | CRITICAL | Low | Adds two-stage review order; prevents spec-noncompliant output passing review |
| 5 | C5 — Iterative Loop no escalation protocol | CRITICAL | Low | Prevents burning N iterations on architectural problems |
| 6 | C4 — PASS_PATHS_NOT_CONTENT contradiction | CRITICAL | Low | Clarifies task text vs. large file content distinction |
| 7 | C6 — Pattern 5 no human approval gate | CRITICAL | Low | Prevents parallel implementation of misunderstood spec |
| 8 | I2 — Context distribution matrix incomplete | IMPORTANT | Low | Prevents token cost surprises from frontmatter-loaded skills |
| 9 | I3 — effort values inconsistent | IMPORTANT | Low | Enables correct effort selection across all agents |
| 10 | I1 — Worktree safety prerequisites missing | IMPORTANT | Medium | Prevents gitignore pollution and uncommitted-work loss |
| 11 | I5 — SKILL.md body structure not specified | IMPORTANT | Medium | Enables consistent, scannable, rationalization-resistant skills |
| 12 | I4 — No SessionStart bootstrap architecture | IMPORTANT | Medium | Enables cache-stable context injection across pipeline sessions |
| 13 | I6 — MCP tool naming convention absent | IMPORTANT | Low | Prevents "tool not found" in multi-MCP environments |
| 14 | I7 — Pipeline state schema undefined | IMPORTANT | High | Enables state interop and crash recovery across pipelines |
| 15 | E3 — No rationalization resistance framework | ENHANCEMENT | Medium | Improves discipline skill compliance under pressure |
| 16 | E1 — 4D feedback routing underspecified | ENHANCEMENT | Low | Makes 4D routing actionable for all feedback types |
| 17 | E2 — .claudeignore missing entries | ENHANCEMENT | Low | Prevents tool bloat from worktrees and dev artifacts |
| 18 | E4 — Skill namespace conflict resolution | ENHANCEMENT | Low | Prevents silent name collision bugs in multi-source setups |
| 19 | E5 — No skill testing protocol | ENHANCEMENT | Medium | Reduces untested skill deployment to pipeline agents |
| 20 | E6 — No agent versioning contract | ENHANCEMENT | Medium | Enables safe agent evolution without breaking orchestrators |

### Minimum viable improvement (fixes all CRITICAL gaps, low effort)

Implement gaps C1, C2, C3, C4, C5, C6, C7 in a single pass. These are the seven gaps that cause active failures or incorrect agent behavior. Combined edit effort: approximately 2–3 hours. The result is an AI_PIPELINES_LLM.md that correctly describes how skills load, how subagents report status, how review works in two stages, and how pipelines escalate instead of silently failing.
