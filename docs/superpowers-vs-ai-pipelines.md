# Superpowers vs AI Pipelines — Architectural Comparison

> **Sources:** Superpowers codebase v5.0.7 (all 14 core skills, plugin configs, hook system, contributor guidelines) and `AI_PIPELINES_LLM.md` (pipeline orchestration reference for Claude Code multi-agent systems). Both documents were fully read before writing this comparison.

---

## The Fundamental Difference in One Sentence

**Superpowers shapes how a single agent behaves inside a session. AI Pipelines defines how multiple agents are constructed, deployed, and connected across a system.**

They operate at different layers of the stack. They are not competing approaches — they are complementary tools for different problems, and using one does not exclude the other.

---

## Table of Contents

1. [Stack Position](#1-stack-position)
2. [Side-by-Side Comparison](#2-side-by-side-comparison)
3. [Where They Converge](#3-where-they-converge)
4. [Key Conceptual Differences Explained](#4-key-conceptual-differences-explained)
5. [Gaps in Each System](#5-gaps-in-each-system)
6. [Using Them Together](#6-using-them-together)
7. [Decision Guide](#7-decision-guide)
8. [Universal Standards](#8-universal-standards-confirmed-by-both)

---

## 1. Stack Position

```
┌─────────────────────────────────────────────────────────┐
│                   AI PIPELINES layer                    │
│                                                         │
│  Agent definitions (.claude/agents/<name>.md)           │
│  Execution patterns (Sequential / Parallel / Loop /     │
│    Human-Gated / Spec-Driven / 4D)                      │
│  State management (pipeline-state.json in tmp/)         │
│  Prompt cache discipline                                │
│  Output bounding / Tool auditing / Path protocols       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              SUPERPOWERS layer                    │  │
│  │                                                   │  │
│  │  Session bootstrap (using-superpowers hook)       │  │
│  │  Skill invocation discipline                      │  │
│  │  Workflow skills (brainstorm → plan → TDD → SDD)  │  │
│  │  Debugging / Verification / Review disciplines    │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │        The agent doing work                 │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Superpowers operates at the **session layer** — it wraps the agent's behavior inside a single conversation. AI Pipelines operates at the **infrastructure layer** — it defines the agents themselves, how they are wired together, and how they run.

---

## 2. Side-by-Side Comparison

| Dimension | Superpowers | AI Pipelines |
|---|---|---|
| **Primary unit** | Skill — a markdown guide invoked at runtime by the agent | Agent — a YAML-defined worker with explicit tools, model, effort, hooks |
| **Agent definition** | None — subagents are ad-hoc dispatches with crafted prompts | Formal schema at `.claude/agents/<name>.md` |
| **What shapes behavior** | Skills the agent reads and follows at runtime | Agent frontmatter: tools, model, effort, hooks, isolation, initialPrompt |
| **Orchestration style** | Implicit — emerges from skill checklists and dispatch loops | Explicit — 6 named patterns with structured state |
| **Subagent spawning** | Within skills (SDD dispatches implementer + spec reviewer + code reviewer) | `SUB_AGENT_SPAWNING: FALSE` — only the parent/lead orchestrator spawns |
| **Parallel execution** | `dispatching-parallel-agents` skill guides when/how | Patterns 2 (Fan-Out/Merge), 2b (Fan-Out with QA) are first-class constructs |
| **State management** | Git history + plan files in `docs/superpowers/plans/` | `pipeline-state.json` bounded to `tmp/` directories |
| **Model selection** | Agent's judgment per task: cheapest capable model for the role | `SONNET_ONLY` — scale reasoning depth via `effort: low/medium/high/xhigh/max` |
| **Per-turn processing** | None — workflow lives in the skill invoked for the task | 4D Wrapper (Deconstruct→Diagnose→Develop→Deliver) runs internally every turn |
| **Session bootstrap** | `SessionStart` hook injects `using-superpowers` before any message | No bootstrap — agents loaded directly via `skills:` frontmatter |
| **Skill discovery** | Dynamic: all metadata pre-loaded; agent decides at runtime to load body | `skills:` frontmatter = full content injected at agent startup (not lazy) |
| **Prompt caching** | Not addressed | Fully specified: STATIC_FIRST, NO_TOOL_CHURN, SKILLS_LIST_STABLE, NO_DYNAMIC_TIMESTAMPS, cache breakpoints, TTL ordering |
| **Auto-memory** | Not controlled | `AUTO_MEMORY: DISABLED` — `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` reclaims 658+ tokens |
| **Path management** | No formal protocol | `{OUT}` and `{REF}` as absolute shell env vars; no hardcoded paths in any agent |
| **Tool auditing** | Not specified | `PostToolUse` hook tracks invocations; auto-prunes tools unused across 3 iterations |
| **Output bounding** | Not specified | `BOUND_STDOUT: TRUE`, `SCOPE_FILE_READS: TRUE`, `PASS_PATHS_NOT_CONTENT: TRUE` |
| **Worktree lifecycle** | `finishing-a-development-branch`: user chooses merge/PR/keep/discard | `WORKTREE_MERGE_REQUIRED: TRUE` — orchestrator must commit before destruction |
| **Platform scope** | Cross-platform: Claude Code, Cursor, Codex, OpenCode, Copilot, Gemini | Claude Code-first (`.claude/agents/`, `settings.json`, specific Claude model IDs) |
| **Dependency policy** | Zero external dependencies — hard, non-negotiable requirement | No stated constraint |
| **Testing methodology** | Skills tested with TDD: run pressure scenarios before/after writing | Evaluations built before documentation; eval-driven development |
| **Contribution standards** | CLAUDE.md: 94% rejection rate, strict PR template, zero-dep enforcement | Not a shared library — no equivalent PR standards |

---

## 3. Where They Converge

Both systems independently arrived at the same conclusions. These are the areas where consensus is strongest — treat them as reliable universal standards.

### Progressive Disclosure (Identical Specification)

Both specify:
- Main body (SKILL.md or agent body): **≤ 500 lines**
- Reference files: **one level deep from the main file** — never nested further
- Reference files > 100 lines: **must include a table-of-contents at the top**
- Token loading order: **metadata at startup → body on invocation → reference files on read**

This identical spec from two independent architectures means it's the correct approach. Violating it in either system causes the same failure: Claude partially reads files using `head -100` and misses content.

### Description Discipline (Identical Rules)

Both specify:
- `name`: ≤ 64 characters, lowercase letters + hyphens only
- `description`: ≤ 1024 characters, **third person only**
- First/second person (`"I can…"`, `"You can use…"`) breaks POV consistency in the system prompt
- Both `name` and `description` load on **every session** — every unnecessary word costs tokens on every message

### Write/Review Isolation

- **Superpowers:** Implementer subagent ≠ spec reviewer ≠ code quality reviewer. Two-stage review, separate agents for each.
- **AI Pipelines:** `WRITE_REVIEW_ISOLATION: TRUE` — writing agent is never the reviewing agent.

Both independently enforce the same principle: **the agent that creates cannot objectively verify its own work.** This is not a preference — both systems treat it as a hard architectural requirement.

### Fresh Context Per Task

- **Superpowers:** Fresh subagent per task in SDD prevents context pollution between tasks.
- **AI Pipelines:** `PIPELINE_PHASE_ISOLATION: TRUE` — Tester, Analyzer, and Healer are always separate instances.

Both reject the pattern of a single long-running agent accumulating context across unrelated tasks. The rationale differs slightly (Superpowers: prevents context confusion; AI Pipelines: keeps each agent's context minimal) but the outcome is the same design.

### Ant-Swarm / Subagent Architecture

- **Superpowers:** Controller curates exactly the context each subagent needs. Subagents are clean, focused, and do not inherit session history.
- **AI Pipelines:** `ANT_SWARM_PRINCIPLE: TRUE` — prefer many small-context agents over one large-context agent.

Both reject "one massive agent that does everything." Both prefer dispatch patterns where each worker has only what it needs. The emphasis differs: Superpowers stresses context precision; AI Pipelines stresses context minimization. The result is the same architecture.

---

## 4. Key Conceptual Differences Explained

### 4.1 Skills as Runtime Guides vs. Preloaded Infrastructure

**Superpowers:** A skill is a markdown document. The running agent reads the description, decides the skill applies, then reads the body and follows it. The agent chooses at runtime. Skills shape *process*.

**AI Pipelines:** When `skills:` appears in an agent's frontmatter, the skill's **full content** is injected at agent startup — not discovered lazily. This is fundamentally different from the session-level metadata-only discovery. Pipeline skills are closer to preloaded agent instructions than to runtime guidance.

**Why this matters in practice:**

A Superpowers skill designed for lazy session-level invocation (large body, detailed checklists, flowcharts) will be injected in full at every startup if placed in a pipeline agent's `skills:` frontmatter. That is expensive and likely wrong — the agent gets a wall of process instructions before it has any context for why they apply.

Conversely, a pipeline reference skill (no SKILL.md body, `references/` directory only, `disable-model-invocation: true`) has no discoverable metadata and will never be found by the Superpowers bootstrap at session start.

**Rule:** Superpowers skills and pipeline preload skills are architecturally different artifacts even though they share the same file format. Don't mix them without understanding which loading mode is active.

### 4.2 Implicit vs. Explicit Orchestration

**Superpowers:** Orchestration is *implicit*. It emerges from skill checklists. The `brainstorming` skill has a 9-step checklist. The `subagent-driven-development` skill has a dispatch loop. The agent follows skills in sequence. There is no pipeline DSL, no state file, no named patterns.

**AI Pipelines:** Orchestration is *explicit*. Patterns 1–6 are named, formal, and reusable. The orchestrator knows it is executing Pattern 3 (Iterative Loop) or Pattern 5 (Spec-Driven Development). State is tracked in `pipeline-state.json`. Phase boundaries are explicit. Recovery and retry logic are defined.

**When explicit matters:** Long-running automated pipelines with many phases, human gates, recovery points, and parallelism need the explicitness of AI Pipelines. The system can be reasoned about, inspected, and resumed. Interactive sessions with a human in the loop benefit from Superpowers' implicit model — the workflow emerges naturally from skill invocations rather than being declared upfront.

### 4.3 The 4D Processing Wrapper Has No Superpowers Equivalent

AI Pipelines defines a per-invocation request processing method that runs **internally on every agent turn**:

1. **Deconstruct:** Extract core intent, entities, missing slots. Restate task. Gate if ≥3 critical slots are missing.
2. **Diagnose:** Replace vague terms with measurable specs. Split overloaded asks. Resolve constraint conflicts. Anticipate top 2–3 failure modes.
3. **Develop:** Match task type to strategy. Assign role. Define output format. Layer constraints.
4. **Deliver:** Lead with conclusion. Match user context. Emit actionable next step. Self-review.

This runs silently by default (surface only on "show 4D"). It ensures every agent response is structured, grounded, and forward-pointing.

Superpowers has no per-turn equivalent. The closest analogue is `brainstorming` — which also explores intent, constraints, and approaches before acting — but brainstorming is a one-time workflow step at the start of a feature, not a per-turn internal process.

**Gap for Superpowers:** Skills that involve many back-and-forth turns (debugging sessions, code review discussions) benefit from the kind of structured per-turn reasoning 4D enforces, but Superpowers provides no mechanism for it.

### 4.4 Model Selection Philosophy

**AI Pipelines:** `SONNET_ONLY` — never configure Opus. Scale reasoning depth via `effort: low | medium | high | xhigh | max`. This keeps pipelines cost-predictable and behaviorally consistent across many runs.

**Superpowers:** Use the least powerful model that can handle each role. Mechanical single-file tasks → cheap/fast model. Integration judgment → standard model. Architecture and review → most capable available. This is explicitly multi-model.

**Synthesis:**
- Automated pipelines running repeatedly → SONNET_ONLY + effort scaling. Cost is predictable; behavior is consistent.
- Interactive single sessions making real-time judgment calls → Superpowers model selection. The right tool for the current task matters more than consistency.
- If you are building automated agents that will run Superpowers-style workflows, apply the AI Pipelines model constraint to keep costs bounded.

**Current model IDs (as of 2026-05):**
- `claude-sonnet-4-6` — default for most work
- `claude-opus-4-7` — most capable; interactive/architecture tasks only
- `claude-haiku-4-5-20251001` — fast/cheap; batch and triage
Never hardcode retired model IDs in agents or skills.

### 4.5 Prompt Cache Discipline

**AI Pipelines** has a fully specified cache strategy:

| Rule | Meaning |
|---|---|
| `STATIC_FIRST` | System prompt, skills, tools go at the start of context; dynamic content (conversation, current task) goes last |
| `NO_TOOL_CHURN` | Never add, remove, or reorder tools mid-session; use mode-switching tools or `defer_loading` instead |
| `SKILLS_LIST_STABLE` | Changing the skills list in a container invalidates the entire cache |
| `NO_DYNAMIC_TIMESTAMPS` | Timestamps in static prompts shatter prefix matching; don't include them in invariant content |
| Breakpoints | Up to 4 `cache_control` breakpoints; place on the last block that stays identical across requests |
| TTL ordering | 1-hour cache entries MUST appear before 5-minute entries |
| Thinking cache | Thinking blocks CAN be cached in previous assistant turns; count as input tokens on cache read |

**Superpowers** does not address caching at all. This is a real gap: the `session-start` hook that injects `using-superpowers` could inadvertently break cache prefix matching if its output is non-deterministic (e.g., includes a timestamp or varies based on environment state).

**Implication for skill authors targeting pipeline contexts:**
- Keep `session-start` hook output **byte-for-byte identical** across identical sessions
- Do not include session-specific metadata in skill content (no `# Generated: 2026-05-02`)
- Keep the skills list stable across requests in a container
- Ensure `SKILL.md` content does not change between requests (no computed/dynamic sections)

### 4.6 Worktree Lifecycle in Automated Contexts

**Superpowers** handles worktree cleanup via `finishing-a-development-branch`: the user chooses merge/PR/keep/discard, and cleanup happens accordingly. This works well in interactive sessions where the agent reaches the finishing step.

**AI Pipelines** adds: `WORKTREE_MERGE_REQUIRED: TRUE` — if `isolation: worktree` is used, the orchestrator **must** explicitly commit and merge successful changes before the worktree is destroyed. This is critical in automated pipelines where infrastructure may tear down worktree containers after a timeout, with no user in the loop to choose an option.

**Gap:** Superpowers does not define behavior for externally-destroyed worktrees. In a pipeline context, if the container is killed before `finishing-a-development-branch` runs, uncommitted changes are silently lost. When running Superpowers workflows inside pipelines:
- Commit completed work after each task, not only at the end
- Do not rely on `finishing-a-development-branch` as the sole commit gate
- Consider adding a `PostToolUse` hook that auto-commits when tests pass

### 4.7 Skill Suppression and Context Slots

**AI Pipelines** documents a non-obvious behavior: `user-invocable: false` does **not** suppress a skill from the system context reminder — it only prevents users from manually invoking it. The skill still consumes a context slot. To fully remove a skill from context, delete `SKILL.md`; keep only `references/` if the skill is reference-only.

**Superpowers** does not address this. Authors who create reference-only skills (API docs, syntax guides) and assume `user-invocable: false` suppresses them from context are wrong — the metadata still loads on every session.

**Fix:** For reference-only skills in both systems, delete `SKILL.md`, keep `references/`, and have agents read the files directly via `Read`. No context slot consumed until actually read.

---

## 5. Gaps in Each System

### Superpowers Gaps (AI Pipelines Fills These)

| Gap in Superpowers | AI Pipelines Solution |
|---|---|
| No prompt cache discipline | STATIC_FIRST, NO_TOOL_CHURN, SKILLS_LIST_STABLE, NO_DYNAMIC_TIMESTAMPS, up to 4 breakpoints, TTL ordering |
| No formal pipeline patterns | 6 named patterns: Sequential, Parallel Fan-Out/Merge, Parallel with QA, Iterative Loop, Human-Gated, Spec-Driven Development |
| No per-turn request processing | 4D Wrapper: Deconstruct→Diagnose→Develop→Deliver on every agent turn |
| No auto-memory control | `AUTO_MEMORY: DISABLED` via `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` — reclaims 658+ token baseline |
| No tool utilization auditing | `PostToolUse` orchestrator hook auto-prunes tools unused across 3 consecutive iterations |
| No output bounding | `BOUND_STDOUT: TRUE` (e.g., `| tail -80`), `SCOPE_FILE_READS: TRUE`, `PASS_PATHS_NOT_CONTENT: TRUE` |
| No path variable protocol | `{OUT}` and `{REF}` as absolute shell env vars; no hardcoded paths in agents |
| No formal state machine | `pipeline-state.json` with structured JSON in `tmp/` directories |
| No adaptive thinking spec | `effort: low/medium/high/xhigh/max` + `max_tokens: 64k` for multi-step agents |
| No worktree destruction guarantee | `WORKTREE_MERGE_REQUIRED: TRUE` — explicit commit before container teardown |
| No model ID currency guarantee | Explicit current model IDs listed; retired model use forbidden |
| No skill suppression guidance | Documented: `user-invocable: false` ≠ context suppression; delete SKILL.md to fully suppress |
| No `.claudeignore` guidance | Exclude `dist/`, `node_modules/`, `.nx/cache/`, `coverage/`, `playwright-report/`, `test-results/`, `tmp/pipeline-*` |
| Context distribution matrix absent | Explicit: CLAUDE.md (HIGH, max 200 lines), `.claude/rules/{dir}.md` (LOW, lazy), skills (MED, on-demand), references (LOW, runtime) |

### AI Pipelines Gaps (Superpowers Fills These)

| Gap in AI Pipelines | Superpowers Solution |
|---|---|
| No session bootstrap / skill discipline enforcement | `SessionStart` hook injects `using-superpowers`; Red Flags table prevents rationalization |
| No TDD enforcement mechanism | `test-driven-development` iron law with full rationalization table and Red Flags list |
| No root-cause-first debugging requirement | `systematic-debugging` 4-phase process: root cause → pattern → hypothesis → implementation |
| No verification-before-claims gate | `verification-before-completion`: run command → read output → THEN claim; no "should work" allowed |
| No design-before-code gate | `brainstorming` hard gate: no code, scaffolding, or implementation before approved spec |
| No spec compliance review | SDD two-stage review: spec compliance MUST pass before code quality review begins |
| No over-building protection | Spec compliance reviewer catches both under-building (missing requirements) and over-building (unrequested features) |
| No worktree safety verification | `using-git-worktrees` runs `git check-ignore` before creating project-local worktrees; fixes `.gitignore` if needed |
| Platform abstraction | Cross-platform via platform-specific hooks: Claude Code, Cursor, Codex, OpenCode, Copilot CLI, Gemini CLI |
| No PR quality standards | CLAUDE.md contributor guidelines: 94% rejection rate context, strict template, zero-dep enforcement, skill eval requirements |
| No skill testing methodology | `writing-skills` TDD-for-documentation: run pressure scenarios before and after writing; close rationalization loopholes |
| No rationalization resistance framework | Red Flags tables, rationalization tables, `<EXTREMELY-IMPORTANT>` / `<HARD-GATE>` XML tags in skills |
| Feedback loop for code review not specified | `receiving-code-review`: READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT; forbids performative agreement |

---

## 6. Using Them Together

The two systems are most powerful when each handles what it is designed for.

### Pattern: Superpowers for Development, Pipelines for Automation

Use Superpowers to develop the software that the pipeline will run. Use AI Pipelines patterns to build the pipeline itself.

```
Developer session (Superpowers active):
  brainstorming → spec
  writing-plans → plan
  using-git-worktrees → isolated branch
  subagent-driven-development → implementation with TDD + review
  finishing-a-development-branch → merge

The thing that was built (a pipeline, using AI Pipelines patterns):
  .claude/agents/tester.md
  .claude/agents/analyzer.md
  .claude/agents/fixer.md
  Pattern 3: Loop(tester → analyzer → fixer)
  pipeline-state.json in tmp/
```

### Pattern: Pipeline Agent With Superpowers Discipline

A pipeline agent (defined via AI Pipelines schema) can carry Superpowers workflow skills in its `skills:` frontmatter. Note: these are fully loaded at agent startup, not discovered lazily.

```yaml
---
name: implementer
description: Implements a single task from the implementation plan
tools: Bash, Read, Edit, Write
model: sonnet
effort: medium
skills:
  - superpowers:test-driven-development
  - superpowers:verification-before-completion
---
Implement the task described below. Follow TDD. Verify before claiming done.
```

This gives a pipeline worker Superpowers' discipline (test first, verify before claiming done) inside the AI Pipelines infrastructure.

### What Not to Mix

**Don't put Superpowers session-workflow skills in pipeline agent frontmatter:**

Skills like `brainstorming`, `writing-plans`, or `subagent-driven-development` are designed for an interactive session with a human in the loop. Injecting them at pipeline agent startup is expensive (large bodies) and wrong (the agent is executing a task, not starting a design conversation).

**Don't rely on Superpowers' lazy discovery for pipeline reference skills:**

A skill with no SKILL.md body (only `references/`) will not be discovered by the Superpowers bootstrap. Pipeline reference skills are read directly by agents via the `Read` tool. They are not part of the lazy skill discovery system.

### Cache-Safe Hook Output

If Superpowers' `session-start` hook is used in a pipeline context, its output must be cache-stable:

```bash
# The hook's JSON output must be byte-for-byte identical across
# sessions with the same skill content. Verify with:
diff <(./hooks/session-start) <(./hooks/session-start)
# Should produce no output (identical runs).
```

Any environment-variable-dependent output that varies between runs will shatter the cache prefix.

---

## 7. Decision Guide

```
What are you trying to do?
  │
  ├── Shape how an agent behaves in a single interactive session?
  │     → Superpowers skills
  │
  ├── Define, deploy, and wire together multiple agents in a system?
  │     → AI Pipelines agent schema + patterns
  │
  ├── Enforce development discipline (TDD, debugging, verification)?
  │     → Superpowers discipline skills
  │
  ├── Build a pipeline that runs automatically without human-in-loop?
  │     → AI Pipelines patterns + state management + cache discipline
  │
  ├── Both: interactive development that produces automated pipeline artifacts?
  │     → Superpowers for the development session
  │     → AI Pipelines conventions for the agents the session produces
  │
  ├── A pipeline worker that must follow TDD and verify before claiming done?
  │     → AI Pipelines agent definition
  │     → `skills: [superpowers:test-driven-development,
  │                  superpowers:verification-before-completion]`
  │        in the agent frontmatter
  │
  ├── Managing token costs at scale (high-throughput, many sessions)?
  │     → AI Pipelines prompt cache discipline + SONNET_ONLY + AUTO_MEMORY: DISABLED
  │
  └── Platform portability (needs to work on Cursor, Codex, OpenCode, etc.)?
        → Superpowers (cross-platform hooks)
        → AI Pipelines (Claude Code-first)
```

---

## 8. Universal Standards — Confirmed by Both

These rules appear independently in both systems. Treat them as the strongest available signal for correctness. They are safe to apply in any context.

| Standard | Rule |
|---|---|
| **Main body size limit** | ≤ 500 lines (SKILL.md or agent body) |
| **Reference depth** | One level deep from the main file only — never `main → A → B` chains |
| **Reference ToC** | Files > 100 lines must include a table-of-contents at the top |
| **Loading order** | Metadata at startup → body on invocation → reference files on explicit read |
| **Description format** | Third person only; starts with "Use when…" or describes conditions; no workflow summary; ≤ 1024 chars total frontmatter |
| **Name format** | ≤ 64 characters; lowercase letters and hyphens only; no special characters |
| **Write ≠ review** | The agent that produces output must not be the agent that reviews it |
| **Fresh context per task** | Each task gets a clean agent with only the context it needs; no accumulated session history across tasks |
| **Ant-swarm over monolith** | Many small-context focused agents beat one large-context generalist |
| **No hardcoded paths** | All file paths parameterized or dynamically resolved |
| **One excellent example** | Depth over breadth; one complete, real, runnable example beats many mediocre ones |
| **No deeply nested references** | 2+ level chains cause `head -100` partial reads and missed content |
| **Description ≠ workflow summary** | Descriptions used as shortcuts when they summarize workflow; keep them as triggering conditions only |
| **No retired model IDs** | Hardcoded model IDs rot; always use current IDs or resolve dynamically |
