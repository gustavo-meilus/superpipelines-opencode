# Complete Guide to Creating Claude Plugins (Skills)

> **Source note:** This document is derived from a full audit of the Superpowers codebase (v5.0.7), including all 14 core skills, plugin configuration files, hook system, Anthropic's official skill authoring best practices, contributor guidelines, and the complete PR template. The referenced YouTube video (youtu.be/TX91PdBn_IA) was inaccessible during authoring (HTTP 403); all content comes from the project source. A second reference document (`AI_PIPELINES_LLM.md`) describing a complementary pipeline-orchestration architecture was also incorporated; see [Section 13](#13-superpowers-vs-ai-pipelines--architectural-comparison).

---

## Table of Contents

1. [What Superpowers Is](#1-what-superpowers-is)
2. [How the System Works](#2-how-the-system-works)
3. [Plugin Architecture](#3-plugin-architecture)
4. [Skill Discovery and Loading](#4-skill-discovery-and-loading)
5. [Platform Support and Installation](#5-platform-support-and-installation)
6. [Skill Authoring — Complete Reference](#6-skill-authoring--complete-reference)
7. [The 14 Core Skills — Reference](#7-the-14-core-skills--reference)
8. [The Development Workflow](#8-the-development-workflow)
9. [Standards and Best Practices](#9-standards-and-best-practices)
10. [Gaps, Edge Cases, and Anti-Patterns](#10-gaps-edge-cases-and-anti-patterns)
11. [Testing Skills](#11-testing-skills)
12. [Contributing — PR Standards](#12-contributing--pr-standards)
13. [Superpowers vs AI Pipelines — Architectural Comparison](#13-superpowers-vs-ai-pipelines--architectural-comparison)

---

## 1. What Superpowers Is

Superpowers is a **zero-dependency plugin** that gives Claude (and other AI agents) a library of proven, tested workflow skills. It is not a system prompt wrapper or a static instruction file. It is a composable skill system that:

- Loads itself at session start via platform hooks
- Teaches the agent _how to find and use_ skills before doing anything
- Provides 14 core skills covering the entire software development lifecycle
- Works across 6+ platforms (Claude Code, Cursor, Codex, OpenCode, Copilot CLI, Gemini CLI)

**Core philosophy:**

- Systematic over ad-hoc — process before guessing
- Evidence before claims — verify before declaring success
- Test-driven everything — both code and documentation
- Subagent isolation — fresh context per task, no session bleed

---

## 2. How the System Works

### Session Start Bootstrap

Every session begins with the `SessionStart` hook executing `hooks/session-start`, a shell script that:

1. Reads `skills/using-superpowers/SKILL.md` from disk
2. Escapes it for JSON embedding
3. Detects the current platform via environment variables (`CURSOR_PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, `COPILOT_CLI`)
4. Outputs the skill content in the platform-appropriate JSON format:
   - Cursor: `additional_context` (snake_case)
   - Claude Code: `hookSpecificOutput.additionalContext` (nested)
   - Other: `additionalContext` (top-level)

This means `using-superpowers` is **always injected before the first user message**. The agent never operates without having read the bootstrap.

### The Skill Invocation Rule

After loading the bootstrap, the agent follows one absolute rule from `using-superpowers`:

> **Invoke relevant or requested skills BEFORE any response or action. Even a 1% chance a skill might apply means invoke it.**

The flow is:

```
User message received
  → Does any skill apply? (even 1% chance)
    → YES: invoke Skill tool → read content → announce use → follow exactly
    → DEFINITELY NOT: respond directly
```

The agent never decides "I'll skip the skill this time." If a skill exists for the situation, it is used.

### Skill Content Loading

Skill metadata (name + description) is pre-loaded into the system prompt for all installed skills at startup. The full `SKILL.md` is only read when the agent decides the skill applies. Supporting files (reference docs, examples, scripts) are loaded on-demand as needed within the skill execution. This is **progressive disclosure** — only what is needed is loaded, minimizing context consumption.

### The Priority Hierarchy

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest
2. **Superpowers skills** — override default behavior
3. **Default system prompt** — lowest

If a user says "don't use TDD" and a skill says "always use TDD," the user wins.

---

## 3. Plugin Architecture

### Directory Layout

```
superpowers/
├── skills/                  # All skill modules
│   └── skill-name/
│       ├── SKILL.md         # Required — main skill content
│       └── supporting.*     # Optional — heavy reference, tools, scripts
├── hooks/
│   ├── hooks.json           # Claude Code (Windows) hook config
│   ├── hooks-cursor.json    # Cursor IDE hook config
│   ├── session-start        # Bash script — SessionStart hook body
│   └── run-hook.cmd         # Windows hook runner
├── agents/
│   └── code-reviewer.md     # Subagent dispatch templates
├── commands/
│   ├── brainstorm.md        # CLI command definitions
│   ├── execute-plan.md
│   └── write-plan.md
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata for Claude Code
│   └── marketplace.json     # Dev marketplace config
├── .cursor-plugin/
│   └── plugin.json          # Cursor IDE plugin config
├── .codex-plugin/
│   └── plugin.json          # Codex plugin config
└── .opencode/
    ├── INSTALL.md
    └── plugins/superpowers.js  # OpenCode plugin loader
```

### Plugin Metadata Files

Each platform needs its own `plugin.json`. The Claude Code format:

```json
{
  "name": "superpowers",
  "description": "Core skills library for Claude Code: TDD, debugging, collaboration patterns, and proven techniques",
  "version": "5.0.7",
  "author": { "name": "Jesse Vincent", "email": "jesse@fsck.com" },
  "homepage": "https://github.com/obra/superpowers",
  "repository": "https://github.com/obra/superpowers",
  "license": "MIT",
  "keywords": ["skills", "tdd", "debugging", "collaboration", "best-practices", "workflows"]
}
```

### Hook System

Hooks fire at `SessionStart` (also on `/clear` and `/compact` in Claude Code). There are two hook formats:

**Claude Code (Windows) — `hooks.json`:**
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup|clear|compact",
      "hooks": [{
        "type": "command",
        "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
        "async": false
      }]
    }]
  }
}
```

**Cursor — `hooks-cursor.json`:**
```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [{ "command": "./hooks/session-start" }]
  }
}
```

**Critical:** The hook MUST be synchronous (`async: false`). If it runs async, the bootstrap skill arrives after the agent has already started responding, defeating the purpose.

### The Acceptance Test for New Harness Support

Any new platform integration must pass this test: open a clean session and send:

> Let's make a react todo list

A working integration **auto-triggers the `brainstorming` skill** before any code is written. If brainstorming doesn't trigger, the bootstrap is not working. The following do NOT count as working integrations:

- Manually copying skill files
- Using `npx skills` or similar at-runtime shims
- Anything requiring per-session opt-in
- Anything where brainstorming doesn't auto-trigger on the test above

---

## 4. Skill Discovery and Loading

### How Claude Finds Skills

1. **At startup:** All skills' YAML frontmatter (name + description only) is pre-loaded into the system prompt. This costs only a small number of tokens per skill.
2. **When triggered:** Claude reads the full `SKILL.md` using bash/Read tools. This is when the main content is consumed.
3. **On demand:** Supporting files (referenced from SKILL.md) are loaded only when the agent navigates to them during skill execution.

### The Description Field is the Discovery Key

The `description` field is the **only thing Claude reads to decide whether to load a skill**. This is not informational — it is functional. It must answer: "Should I read this skill right now?"

**Critical rule:** The description must describe ONLY triggering conditions. It must NOT summarize the skill's workflow.

Why this matters (discovered through testing): when a description summarizes the workflow, Claude follows the description as a shortcut and never reads the full skill content. A description saying "dispatches subagent per task with code review between tasks" caused Claude to do ONE review instead of the two-stage review the flowchart clearly specified.

```yaml
# ❌ BAD: Summarizes workflow — Claude uses this as a shortcut
description: Use when executing plans — dispatches subagent per task with code review between tasks

# ✅ GOOD: Triggering conditions only
description: Use when executing implementation plans with independent tasks in the current session
```

### Skill Namespace

All skills live in one flat, searchable namespace. There is no nesting or hierarchy. Every skill must be findable via its name and description alone.

### Skill Priority When Multiple Apply

1. **Process skills first** (brainstorming, debugging) — determine HOW to approach the task
2. **Implementation skills second** — guide execution

"Let's build X" → brainstorming before any implementation skill.
"Fix this bug" → systematic-debugging before any domain skill.

### The SUBAGENT-STOP Guard

Skills may include a `<SUBAGENT-STOP>` tag at the top to prevent subagents from applying a skill meant only for the orchestrating agent:

```markdown
<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>
```

The `using-superpowers` bootstrap uses this to avoid subagents re-running the entire bootstrap ceremony on every dispatch.

---

## 5. Platform Support and Installation

| Platform | Install Method | Hook Config | Skill Discovery |
|---|---|---|---|
| Claude Code | Marketplace: `plugin install superpowers@...` | `hooks.json` via `run-hook.cmd` | Native `Skill` tool |
| Cursor IDE | `/add-plugin superpowers` | `hooks-cursor.json` | Native skill tool |
| OpenAI Codex | `git clone` + symlink to `~/.agents/skills/` | Native | Symlink-based |
| OpenCode | Add to `opencode.json` plugins array | Via plugin hooks | Native plugin system |
| GitHub Copilot CLI | `copilot plugin install superpowers@...` | TBD | Native skill system |
| Gemini CLI | `gemini extensions install <repo-url>` | Via GEMINI.md context | Native extension system |

### Personal Skills

- Claude Code: `~/.claude/skills/`
- Codex: `~/.agents/skills/`

Personal skills load alongside plugin skills and follow the same SKILL.md format.

### Project Skills

Skills in a project's own `skills/` directory are scoped to that project. Use these for project-specific conventions that don't belong in a shared plugin.

---

## 6. Skill Authoring — Complete Reference

### The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

Writing a skill IS Test-Driven Development applied to process documentation. The cycle:

| TDD for Code | TDD for Skills |
|---|---|
| Write failing test | Run pressure scenario WITHOUT skill — document baseline behavior |
| Watch it fail | Document exact rationalizations agent uses |
| Write minimal code | Write skill addressing those specific violations |
| Watch it pass | Verify agent now complies with skill present |
| Refactor | Find new rationalizations → add explicit counters → re-verify |

This applies to new skills AND edits to existing skills. No exceptions for "simple additions" or "just adding a section."

### SKILL.md Structure

```markdown
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions — no workflow summary]
---

# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.

## When to Use
[Small inline flowchart IF decision is non-obvious]

Bullet list of symptoms and use cases.
When NOT to use.

## Core Pattern (for techniques/patterns)
Before/after code comparison.

## Quick Reference
Table or bullets for scanning common operations.

## Implementation
Inline code for simple patterns.
Link to file for heavy reference or reusable tools.

## Common Mistakes
What goes wrong + fixes.

## Red Flags (for discipline-enforcing skills)
Table of rationalizations + reality.
```

### YAML Frontmatter Rules

| Field | Rules |
|---|---|
| `name` | Letters, numbers, hyphens only. No parentheses or special characters. Max 64 chars. |
| `description` | Third person. Start with "Use when...". Triggering conditions only — no workflow summary. Max 1024 chars total frontmatter. |

**Both fields are required.** See [agentskills.io/specification](https://agentskills.io/specification) for the full field list.

### Skill Types

**Technique** — concrete method with steps (e.g., `condition-based-waiting`, `root-cause-tracing`). Follow exactly. No adapting.

**Pattern** — way of thinking about problems (e.g., `flatten-with-flags`). Adapt principles to context.

**Reference** — API docs, syntax guides, tool documentation. Loaded on demand.

The skill itself tells you which type it is. Rigid skills (TDD, debugging) say "follow exactly." Flexible skills (patterns) say "adapt."

### Directory Structure

**Self-contained skill** (all content fits inline):
```
skill-name/
  SKILL.md
```

**Skill with reusable tool** (code worth adapting):
```
skill-name/
  SKILL.md
  example.ts      # working helpers to adapt
```

**Skill with heavy reference** (100+ lines of API docs):
```
skill-name/
  SKILL.md        # overview + navigation
  reference.md    # 100+ line API reference
  scripts/        # executable tools
```

**Never:** Nest references more than one level deep from SKILL.md. `SKILL.md → advanced.md → details.md` means Claude may partially read files and miss content.

### Token Efficiency (Critical)

Frequently-loaded skills consume context on every relevant conversation. Targets:

- Bootstrap/getting-started workflows: **< 150 words each**
- Frequently-loaded skills: **< 200 words total**
- Other skills: **< 500 words** (aim to be concise anyway)
- `SKILL.md` body: **< 500 lines** for optimal performance

Techniques:
- Reference `--help` instead of documenting all flags inline
- Cross-reference other skills with `**REQUIRED SUB-SKILL:** Use superpowers:skill-name`
- Compress examples — one excellent example beats many mediocre ones
- Move API docs and large reference material into separate files
- Don't repeat what's in cross-referenced skills

### Claude Search Optimization (CSO)

**Keywords:** Use words Claude would search for — error messages, symptoms, tool names, synonyms. Example: "flaky", "hanging", "race condition", "ENOTEMPTY".

**Naming conventions:**
- Active voice, verb-first: `condition-based-waiting` not `async-test-helpers`
- Gerunds work well for processes: `creating-skills`, `testing-skills`
- Name by what you DO, not what you have: `root-cause-tracing` not `debugging-techniques`

### Describing Degrees of Freedom

Match instruction specificity to task fragility:

**High freedom** (text-based): multiple approaches valid, context determines best path. Use for code reviews, design discussions.

**Medium freedom** (pseudocode with parameters): preferred pattern exists but some variation is acceptable.

**Low freedom** (exact script, no flags): operations are fragile, consistency critical. Use for database migrations, signing processes. Say "Run exactly this command. Do not add flags."

### Flowcharts

Use **only** for:
- Non-obvious decision points
- Process loops where the agent might stop too early
- "When to use A vs B" decisions with meaningful branches

Never use flowcharts for:
- Reference material → use tables/lists
- Code examples → use markdown blocks
- Linear instructions → use numbered lists
- Labels without semantic meaning (step1, helper2)

Use Graphviz dot format (not Mermaid). The project has render tooling: `./skills/writing-skills/render-graphs.js`.

### Code Examples

One excellent example beats many mediocre ones.

- Testing techniques → TypeScript/JavaScript
- System debugging → Shell/Python
- Data processing → Python

A good example is: complete and runnable, well-commented (explaining WHY), from a real scenario, shows the pattern clearly, ready to adapt.

Don't implement in 5 languages. Don't write fill-in-the-blank templates.

### Cross-Referencing Skills

Use skill names with explicit requirement markers. Don't use `@` syntax to link files — it force-loads the entire file immediately, burning context:

```markdown
✅ **REQUIRED SUB-SKILL:** Use superpowers:test-driven-development
✅ **REQUIRED BACKGROUND:** You MUST understand superpowers:systematic-debugging
❌ See skills/testing/test-driven-development    (unclear if required)
❌ @skills/test-driven-development/SKILL.md      (force-loads 200k+ context)
```

### MCP Tool References

When a skill uses MCP tools, always use fully qualified names to avoid "tool not found" errors:

```markdown
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
Use the GitHub:create_issue tool to create issues.
```

Format: `ServerName:tool_name`

### Bulletproofing Against Rationalization

For discipline-enforcing skills (TDD, debugging, verification), agents will find loopholes under pressure. Counter this with:

**1. Close every loophole explicitly:**
```markdown
# ❌ Weak
Write code before test? Delete it.

# ✅ Bulletproof
Write code before test? Delete it. Start over.

No exceptions:
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete
```

**2. Address "spirit vs letter" arguments early:**
```markdown
Violating the letter of the rules is violating the spirit of the rules.
```

**3. Build a rationalization table from baseline testing:**
```markdown
| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
```

**4. Create a Red Flags list** — make it easy for agents to self-check:
```markdown
## Red Flags — STOP and Start Over
- Code before test
- "I already manually tested it"
- "This is different because..."

All of these mean: Delete code. Start over.
```

**5. Use EXTREMELY-IMPORTANT and HARD-GATE XML tags** for non-negotiable requirements:
```markdown
<EXTREMELY-IMPORTANT>
You ABSOLUTELY MUST do X. This is not negotiable.
</EXTREMELY-IMPORTANT>

<HARD-GATE>
Do NOT proceed past this point until condition Y is met.
</HARD-GATE>
```

### Avoiding Time-Sensitive Content

Don't include information that will become outdated. Use "old patterns" sections for deprecated content:

```markdown
## Current method
Use v2 API: api.example.com/v2/messages

## Old patterns
<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>
The v1 API used: api.example.com/v1/messages. No longer supported.
</details>
```

---

## 7. The 14 Core Skills — Reference

### `using-superpowers`
**When:** Always — loaded at every session start via hook.
**What:** Bootstrap that establishes skill invocation discipline. Contains the Red Flags table, skill priority rules, and the mandatory "invoke before anything" rule. Subagents skip this via `<SUBAGENT-STOP>`.

### `brainstorming`
**When:** BEFORE any creative work — features, components, behavior changes.
**Hard gate:** NO code, scaffolding, or implementation until design is approved.
**9-step checklist:** explore context → offer visual companion (if visual) → clarifying questions (one at a time) → propose 2-3 approaches → present design sections → write design doc → spec self-review → user reviews spec → invoke `writing-plans`.
**Output:** `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
**Key rule:** The terminal state is invoking `writing-plans`. No other implementation skill is invoked after brainstorming.

### `writing-plans`
**When:** After brainstorming approval, before touching code.
**What:** Creates implementation plans for zero-context engineers.
**Output:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
**Iron law:** NO placeholders. Every step contains complete, runnable code.
**Task size:** 2–5 minutes each.

### `subagent-driven-development`
**When:** Executing a plan in the current session with mostly independent tasks.
**What:** Dispatches a fresh subagent per task + two-stage review (spec compliance first, code quality second).
**Critical order:** Spec compliance review MUST pass before code quality review starts.
**Red flags:**
- Dispatching multiple implementer subagents in parallel (they conflict)
- Making subagent read the plan file (provide full task text instead)
- Starting code quality review before spec compliance is ✅
- Moving to next task while either review has open issues

**Model selection:** Mechanical tasks (1-2 files, clear spec) → cheap/fast model. Integration/judgment → standard model. Architecture/design/review → most capable.

### `executing-plans`
**When:** Executing a plan in a separate parallel session.
**What:** Load and execute plans with checkpoints. Same quality gates as SDD but inline rather than via subagents.

### `test-driven-development`
**When:** Implementing any feature or bugfix, before writing implementation code.
**Iron law:** `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`
**Cycle:** RED (write failing test) → verify RED (watch it fail correctly) → GREEN (minimal code) → verify GREEN (all pass) → REFACTOR (clean up, keep green) → repeat.
**Delete rule:** Code written before test? Delete it. Start over. No keeping as "reference." No adapting. Delete means delete.

### `systematic-debugging`
**When:** Any bug, test failure, or unexpected behavior, before proposing fixes.
**Iron law:** `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`
**Four phases:**
1. Root cause investigation (read errors, reproduce, check changes, trace data flow)
2. Pattern analysis (find working examples, compare, identify differences)
3. Hypothesis and testing (form ONE hypothesis, test minimally, verify)
4. Implementation (create failing test, single fix, verify)
**3+ fixes failed?** Stop. Question the architecture. Discuss with user before another attempt.

### `verification-before-completion`
**When:** Before claiming work is complete, fixed, or passing.
**Gate function:** Identify verification command → run complete fresh command → read full output → verify output confirms claim → ONLY THEN make the claim.
**Red flags:** Using "should", "probably", "seems to." Expressing satisfaction before verification. Trusting agent success reports without independently verifying.

### `requesting-code-review`
**When:** After completing tasks, before merge or PR.
**What:** Get git SHAs → dispatch `code-reviewer` subagent → act on feedback (Critical: fix immediately; Important: fix before proceeding; Minor: note for later).

### `receiving-code-review`
**When:** Getting feedback from review.
**What:** READ → UNDERSTAND (restate in own words) → VERIFY against codebase → EVALUATE (technically sound?) → RESPOND (technical acknowledgment or reasoned pushback) → IMPLEMENT (one item at a time).
**Forbidden:** "You're absolutely right!" "Great point!" Performative gratitude without technical engagement.

### `using-git-worktrees`
**When:** Starting feature work needing isolation.
**Directory selection:** Check for `.worktrees/` or `worktrees/` → check CLAUDE.md → ask user.
**Safety:** For project-local directories, MUST verify with `git check-ignore` before creating worktree. If not ignored, add to `.gitignore` + commit before proceeding.
**Setup:** auto-run dependency install (npm/cargo/pip/go) → verify clean test baseline → report location.

### `finishing-a-development-branch`
**When:** Implementation complete, tests pass, ready to integrate.
**Process:** Verify tests pass → determine base branch → present exactly 4 options (merge locally / push+PR / keep as-is / discard) → execute → cleanup worktree (only for options 1 and 4).
**Discard requires typed confirmation:** user must type "discard" exactly.

### `dispatching-parallel-agents`
**When:** 2+ independent tasks with no shared state.
**Use when:** Multiple failures in different files, multiple independent subsystems.
**Don't use when:** Failures are related, full system state needed, agents would interfere with shared files.

### `writing-skills`
**When:** Creating new skills, editing existing skills, verifying skills before deployment.
**Core principle:** Writing skills IS TDD for process documentation. Same iron law applies.
**Testing all skill types:**
- Discipline-enforcing: academic + pressure scenarios + combined pressures
- Technique: application + variation + missing-information scenarios
- Pattern: recognition + application + counter-example scenarios
- Reference: retrieval + application + gap scenarios

---

## 8. The Development Workflow

### Full Lifecycle

```
New Feature Request
  │
  ▼
brainstorming ──────────────────────────────────────────────────┐
  • Explore project context                                       │
  • Ask clarifying questions (one at a time)                     │
  • Propose 2-3 approaches with trade-offs                       │
  • Present design, get approval                                  │
  • Write design doc → docs/superpowers/specs/                   │
  • Spec self-review + user review gate                          │
  │                                                              │
  ▼                                                              │
writing-plans                                                    │
  • Create implementation plan                                    │
  • Bite-sized tasks (2-5 min each, complete code, no placeholders)│
  • Save to docs/superpowers/plans/                              │
  │                                                              │
  ▼                                                              │
using-git-worktrees                                              │
  • Create isolated workspace                                     │
  • Auto-setup dependencies                                      │
  • Verify clean test baseline                                   │
  │                                                              │
  ├─── Same session? ──────────────────────────────────────────▶ subagent-driven-development
  │                                                                Per task:
  └─── Parallel session? ────────────────────────────────────▶  executing-plans
                                                                   1. dispatch implementer subagent
                                                                   2. implementer uses TDD
                                                                   3. spec compliance review
                                                                   4. code quality review
                                                                   5. mark task complete
                                                                  After all tasks:
                                                                   final code review
                                                                   │
                                                                   ▼
                                                            finishing-a-development-branch
                                                                   verify tests → 4 options
```

### Bug Fix Lifecycle

```
Bug Encountered
  │
  ▼
systematic-debugging
  Phase 1: root cause investigation
  Phase 2: pattern analysis
  Phase 3: hypothesis + minimal test
  Phase 4: implementation
  │
  ▼
test-driven-development
  write failing test → watch fail → minimal fix → watch pass → refactor
  │
  ▼
verification-before-completion
  run verification command → read output → THEN make claims
```

### Scope Decomposition

If a request describes multiple independent subsystems (chat + file storage + billing + analytics), brainstorming flags this immediately. Don't spend questions on details of a project that needs decomposition. Each sub-project gets its own: spec → plan → implementation cycle.

---

## 9. Standards and Best Practices

### For Skills

| Standard | Rule |
|---|---|
| Description is a triggering condition, not a summary | Never describe the workflow in the description field |
| Third-person descriptions | Injected into system prompt — POV must be consistent |
| Test before deploy | Run pressure scenarios before and after writing; document rationalizations |
| One skill per concern | Skills are not bundles; each addresses one technique/pattern/reference area |
| Flat namespace | All skills searchable at top level; no nesting by domain |
| Token efficiency | Bootstrap skills < 150 words; others < 500 words; SKILL.md < 500 lines |
| No @ force-loads | Use skill names in cross-references, not `@path/to/file` syntax |
| One level of references | SKILL.md → reference.md is fine; SKILL.md → advanced.md → details.md is not |
| Forward slashes in paths | Platform-independent; Windows backslashes cause errors on Unix |

### For the Development Workflow

| Standard | Rule |
|---|---|
| No implementation before design | brainstorming is mandatory before any code |
| No code without failing test | TDD iron law; no exceptions without explicit human partner permission |
| No fixes without root cause | systematic-debugging iron law |
| No completion claims without evidence | verification-before-completion runs before any "done" statement |
| No speculative features | YAGNI ruthlessly — remove unasked features from all designs |
| Spec compliance before code quality | Two-stage review order is not optional |
| Fresh subagent per task | No context pollution between tasks |
| Worktree before implementation | Use using-git-worktrees to isolate feature work |

### For Code

| Standard | Rule |
|---|---|
| Minimal implementation | Write simplest code to pass the test; no over-engineering |
| No bundled refactoring | One fix at a time; no "while I'm here" improvements |
| No magic numbers | Every constant must be documented with its reasoning |
| Forward slashes in scripts | Always, even on Windows |
| Solve, don't punt | Scripts handle error conditions explicitly; don't fail and let Claude figure it out |

### For PRs

| Standard | Rule |
|---|---|
| One problem per PR | No bundled unrelated changes |
| Real problems only | Must describe specific session, error, or user experience that motivated the change |
| Skill changes need evals | Before/after results across multiple sessions required |
| No third-party dependencies | Zero-dependency design is non-negotiable |
| Domain-specific skills go in plugins | Core contains only general-purpose skills |
| Search prior art | Both open AND closed PRs must be checked |
| Human review required | A human must review the complete diff before submission |

---

## 10. Gaps, Edge Cases, and Anti-Patterns

### Known Edge Cases in the Skill System

**The description-as-shortcut trap**
If a description summarizes the skill's workflow, Claude may use the description instead of reading the full skill body. Discovered empirically: a description mentioning "two-stage code review" caused Claude to do one review. Fix: descriptions are triggering conditions only.

**Subagent context contamination**
Subagents dispatched without the `<SUBAGENT-STOP>` guard may attempt to re-run the full bootstrap ceremony (`using-superpowers`) even when they're just executing a task. Skills intended for orchestrators only should include this guard.

**The 3-fixes architectural signal**
If three independent fixes all fail, this is not a failure of hypothesis — it is a signal that the architecture itself is wrong. The `systematic-debugging` skill explicitly names this: stop after 3 attempts and question the pattern, not try a 4th fix.

**Worktree not gitignored**
Creating a project-local worktree directory (`.worktrees/`) without first verifying it's in `.gitignore` causes the worktree's entire contents to appear in `git status`, potentially including secrets or large files. `using-git-worktrees` verifies this with `git check-ignore` and fixes it before proceeding.

**Test passes immediately (RED phase)**
If a test passes immediately when written, it is testing existing behavior, not the missing feature. This is a false RED — the test must be fixed, not the code. `test-driven-development` explicitly covers this.

**Stale spec compliance**
If an implementer adds a feature not in the spec ("while I'm here, I also added…"), the spec compliance reviewer catches this as an over-build. Both under-building AND over-building fail spec review.

**Model selection for subagents**
Using an over-powered model for mechanical single-file tasks wastes money and time. Using an under-powered model for multi-file integration tasks causes failures. The `subagent-driven-development` skill specifies model selection signals.

**Platform-specific hook format differences**
Cursor uses `additional_context` (snake_case), Claude Code uses `hookSpecificOutput.additionalContext` (nested camelCase). The `session-start` script detects platform via env vars. New platform integrations must determine their output format by reading the platform's hook documentation.

**Parallel agent file conflicts**
`dispatching-parallel-agents` warns explicitly: don't dispatch parallel agents when they would touch shared files. Parallel agents writing to the same file produce merge conflicts or race conditions.

**Visual companion token cost**
The brainstorming visual companion (browser-based) is token-intensive. The skill requires offering it separately (its own message, not combined with questions), getting consent, and then deciding per-question whether a visual is actually needed. Don't use the browser for conceptual/text questions.

**Large spec decomposition**
When a request describes a system too large for one spec/plan/implementation cycle, brainstorming must flag this immediately — before asking detail questions. Don't refine details of a project that needs to be decomposed first. Each sub-project gets its own full cycle.

### Anti-Patterns

**Narrative skill content**
Writing "In session 2025-10-03, we found that empty projectDir caused…" — this is too specific and not reusable. Skills are reference guides, not session logs.

**Multi-language examples**
Including `example-js.js`, `example-py.py`, `example-go.go` in one skill dilutes quality and creates maintenance burden. One excellent example in the most relevant language is better.

**Premature skill creation**
Creating a skill from a one-off solution, standard well-documented practice, or project-specific convention. Project-specific conventions belong in `CLAUDE.md`, not in a shared skill.

**Deeply nested references**
`SKILL.md → advanced.md → details.md` — Claude may partially read files with `head -100` and miss content. Keep references one level deep.

**Assuming tool/package availability**
Don't write "Use the pdf library to process the file." Write explicit install instructions and state the exact package name and command. Claude does not know what's installed.

**Using `@path/to/file` cross-references**
The `@` syntax force-loads the entire file immediately. For large reference files, this burns 200k+ context tokens before they're needed. Use skill names and let progressive disclosure load files on demand.

**Too many options**
"You can use pypdf, or pdfplumber, or PyMuPDF, or…" — this creates decision paralysis. Provide one default with an escape hatch for specific edge cases: "Use pdfplumber for text extraction. For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."

**Voodoo constants**
`TIMEOUT = 47  # Why 47?` — every constant in a script must be justified. Claude cannot determine the right value for an undocumented magic number.

**Bulk PR submission**
Opening PRs for multiple issues in a single session. Maintainers reject entire batches when they detect spray-and-pray behavior. Each PR requires genuine understanding of one specific problem.

**Fabricated problem statements**
"My review agent flagged this" or "this could theoretically cause issues." If you cannot describe the specific session, error, or user experience, do not submit the PR.

---

## 11. Testing Skills

### The Testing Methodology

Skills are tested the same way code is tested: write the test first, watch it fail, write the skill, watch it pass.

**Pressure types** (combine multiple for discipline skills):
- **Time pressure:** "I need this in 5 minutes"
- **Sunk cost:** "I've already spent 3 hours on this"
- **Authority:** "My manager wants this shipped today"
- **Exhaustion:** "I've been working on this all day"
- **Obvious answer:** "The fix is clearly just X"

### By Skill Type

**Discipline-enforcing skills** (TDD, verification, debugging):
- Academic: does the agent understand the rules?
- Pressure: does it comply under maximum stress?
- Combined pressure: time + sunk cost + exhaustion simultaneously
- Document exact rationalizations used and add explicit counters

**Technique skills** (condition-based-waiting, root-cause-tracing):
- Application: can they apply the technique to a new scenario?
- Variation: do they handle edge cases?
- Missing information: are there gaps in the instructions?

**Pattern skills** (mental models):
- Recognition: do they identify when the pattern applies?
- Counter-examples: do they know when NOT to apply it?

**Reference skills** (API docs, command references):
- Retrieval: can they find the right information?
- Gap testing: are common use cases covered?

### Common Testing Excuses (All Wrong)

| Excuse | Reality |
|---|---|
| "Skill is obviously clear" | Clear to you ≠ clear to other agents. Test it. |
| "It's just a reference" | References have gaps and unclear sections. Test retrieval. |
| "Testing is overkill" | Untested skills always have issues. 15 min testing saves hours. |
| "Academic review is enough" | Reading ≠ using. Test application scenarios. |
| "No time to test" | Deploying untested skill wastes more time fixing it later. |

### Model Variance

Test with all models you plan to use:
- **Haiku:** fast, economical — does the skill provide enough guidance?
- **Sonnet:** balanced — is the skill clear and efficient?
- **Opus:** powerful reasoning — does the skill avoid over-explaining?

What works for Opus may need more detail for Haiku.

### Iterating with Two Instances

The most effective process uses two Claude instances:

- **Claude A** (expert): helps design and refine the skill
- **Claude B** (tester): uses the skill for real tasks and reveals gaps

Observe Claude B's behavior. When it struggles or misses something, bring the specific observation back to Claude A: "When I asked Claude B for X, it did Y instead of Z even though the skill says Z." Then refine and retest.

---

## 12. Contributing — PR Standards

### The 94% Rejection Rate

Most rejected PRs are from agents that didn't read or didn't follow these guidelines. The maintainers close low-quality PRs with public comments within hours. Submitting a bad PR wastes maintainers' time and damages the submitter's reputation.

### Before Opening a PR

1. **Read the entire PR template** at `.github/PULL_REQUEST_TEMPLATE.md` — every section, no placeholders
2. **Search for existing PRs** (open AND closed) addressing the same problem. If found, stop and explain why your approach is different and why it would succeed
3. **Verify this is a real problem** — what specific session, error, or user experience motivated this?
4. **Confirm it belongs in core** — would this be useful to someone on a completely different kind of project? If not, publish it as a separate plugin
5. **Show your human partner the complete diff** — get explicit approval before submitting

### What Will Not Be Accepted

- **Third-party dependencies** — zero-dependency by design, no exceptions
- **Compliance-motivated skill rewrites** — Superpowers' skill content is extensively tested; structural changes to "comply" with Anthropic guidance require extensive eval evidence showing improvement
- **Project-specific or personal configuration** — skills for specific projects, teams, or workflows belong in a separate plugin
- **Bulk PRs** — evidence of spray-and-pray agent behavior results in closure of all PRs in the batch
- **Speculative fixes** — "could theoretically cause issues" is not a problem statement
- **Domain-specific skills** — core must be useful to someone on any project type
- **Fork-specific changes** — don't sync fork customizations to upstream
- **Fabricated content** — invented claims or hallucinated functionality
- **Bundled unrelated changes** — one problem per PR, always

### Skill Change Requirements

Skills are not prose — they are code that shapes agent behavior. If you modify skill content:

- Use `superpowers:writing-skills` to develop and test changes
- Run adversarial pressure testing across multiple sessions
- Show before/after eval results: what changed, how many sessions run, what outcomes changed
- Do not modify carefully-tuned content (Red Flags tables, rationalization lists, "human partner" language) without evidence the change is an improvement

### New Harness Requirements

Must include a clean-session transcript for the acceptance test:

> Let's make a react todo list

brainstorming must auto-trigger before any code. The transcript must be pasted in full in the PR. The following are not accepted as real integrations: manual file copying, per-session opt-in, `npx` shims, or anything where brainstorming doesn't auto-trigger.

### PR Template — Required Sections

1. **What problem are you trying to solve?** — specific session, error, or user experience
2. **What does this PR change?** — 1-3 sentences: what, not why
3. **Is this appropriate for core?** — would it help someone on any project type?
4. **What alternatives did you consider?** — why were they worse?
5. **Multiple unrelated changes?** — if yes, split it
6. **Existing PRs** — searched open AND closed; reference what was found
7. **Environment tested** — harness, harness version, model, model version
8. **New harness transcript** — if applicable
9. **Evaluation** — sessions run, before/after outcomes, not just "it works"
10. **Rigor checklist** — used `writing-skills`, adversarial tested, didn't modify tuned content without evals
11. **Human review checkbox** — MUST be checked; PRs without it are closed without review

---

## Quick Checklist — Creating a New Skill

### RED Phase (Test First)
- [ ] Create 3+ pressure scenarios (combine time + sunk cost + authority for discipline skills)
- [ ] Run scenarios WITHOUT the skill — document baseline behavior verbatim
- [ ] Identify patterns in rationalizations and failures

### GREEN Phase (Write Minimal Skill)
- [ ] Name uses only letters, numbers, hyphens — no parentheses or special characters
- [ ] YAML frontmatter: `name` and `description` required; description starts with "Use when..."
- [ ] Description is third-person triggering conditions only — no workflow summary
- [ ] Keywords throughout (errors, symptoms, tools) for discovery
- [ ] Clear overview with core principle in 1-2 sentences
- [ ] Content addresses the specific failures identified in RED phase
- [ ] Code inline OR link to separate file — not both for the same content
- [ ] One excellent example (not multi-language)
- [ ] Run same scenarios WITH skill — verify agents now comply

### REFACTOR Phase (Close Loopholes)
- [ ] Identify new rationalizations that emerged during testing
- [ ] Add explicit counters (for discipline skills)
- [ ] Build rationalization table from all test iterations
- [ ] Create Red Flags list
- [ ] Re-test until bulletproof

### Quality Checks
- [ ] Flowchart only if decision is non-obvious
- [ ] Quick reference table for scannable operations
- [ ] Common mistakes section
- [ ] No narrative storytelling or session-specific references
- [ ] Supporting files only for reusable tools or heavy reference (100+ lines)
- [ ] SKILL.md body under 500 lines

### Deployment
- [ ] Commit to git
- [ ] Consider contributing upstream (if broadly useful) — only after meeting all PR standards

---

## Appendix: Skill YAML Frontmatter Specification

Full reference: [agentskills.io/specification](https://agentskills.io/specification)

Required fields:
- `name`: 64 characters max. Letters, numbers, hyphens only.
- `description`: 1024 characters max (total frontmatter). Third-person. "Use when..." triggering conditions. No workflow summary.

Both fields together with the YAML delimiters must remain under 1024 characters.

---

## Appendix: Superpowers Skill Invocation Map

```
"Let's build X"
  → brainstorming (BEFORE everything)
    → writing-plans
      → using-git-worktrees
        → subagent-driven-development (same session)
        → executing-plans (parallel session)
          → [each task] test-driven-development
          → [each task] requesting-code-review
          → [each task] receiving-code-review
        → finishing-a-development-branch

"Fix this bug"
  → systematic-debugging
    → test-driven-development (Phase 4)
    → verification-before-completion

"I'm done"
  → verification-before-completion (BEFORE claiming done)

"Review this code"
  → requesting-code-review
  → receiving-code-review

"Work on two things at once"
  → dispatching-parallel-agents

"Create a new skill"
  → writing-skills
    → test-driven-development (applied to documentation)
```

---

## 13. Superpowers vs AI Pipelines — Architectural Comparison

This section compares Superpowers (this project) against the `AI_PIPELINES_LLM.md` reference, a complementary architecture for multi-agent pipeline orchestration. Understanding where they differ — and where they converge — is essential for building systems that use both.

### The Fundamental Difference in One Sentence

**Superpowers shapes how a single agent behaves inside a session. AI Pipelines defines how multiple agents are constructed, deployed, and connected across a system.**

They operate at different layers of the stack. Using one does not exclude the other.

---

### Side-by-Side Comparison

| Dimension | Superpowers (this project) | AI Pipelines (`AI_PIPELINES_LLM.md`) |
|---|---|---|
| **Primary unit** | Skill (markdown guide invoked by an agent) | Agent (YAML-defined worker with tools, model, effort) |
| **Agent definition** | None — agents are ad-hoc subagent dispatches | Formal schema: `.claude/agents/<name>.md` with YAML frontmatter |
| **What shapes behavior** | Skills invoked at runtime by the agent itself | Agent frontmatter (tools, model, effort, hooks, isolation) |
| **Orchestration model** | One session-level agent invokes skills and dispatches subagents | Explicit pipeline patterns (Sequential, Parallel Fan-Out, Iterative Loop, Human-Gated, Spec-Driven) |
| **Subagent spawning** | Within skills (e.g., SDD dispatches implementer + reviewers) | `SUB_AGENT_SPAWNING: FALSE` — only the parent/orchestrator spawns |
| **State management** | Git + plan files in `docs/superpowers/plans/` | `pipeline-state.json` in `tmp/` directories, structured JSON |
| **Model selection** | Agent judgment per task (cheapest capable model) | `SONNET_ONLY` — scale via `effort: low/medium/high/xhigh/max` |
| **Token management** | Skill token budgets (bootstrap < 150 words, skills < 500 lines) | Full cache discipline (STATIC_FIRST, NO_TOOL_CHURN, breakpoints, TTL ordering) |
| **Platform scope** | Cross-platform: Claude Code, Cursor, Codex, OpenCode, Copilot, Gemini | Claude Code-first (`.claude/agents/`, `settings.json`, specific model IDs) |
| **Session bootstrap** | Hook injects `using-superpowers` at session start | No bootstrap skill — agents loaded directly via `skills:` frontmatter |
| **Skill discovery** | Dynamic: agent reads description and decides at runtime | Two modes: session-level metadata-only OR `skills:` frontmatter = full content at startup |
| **Prompt caching** | Not explicitly addressed | Fully specified: STATIC_FIRST, no tool churn, no dynamic timestamps, cache breakpoints |
| **Memory** | Not explicitly controlled | `AUTO_MEMORY: DISABLED` — explicit `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` |
| **Path management** | No formal protocol | `{OUT}` and `{REF}` as absolute shell env vars; no hardcoded paths in agents |
| **Tool auditing** | Not specified | `PostToolUse` orchestrator tracks usage; auto-prunes tools unused across 3 iterations |
| **Output bounding** | Not specified | `BOUND_STDOUT: TRUE`, `SCOPE_FILE_READS: TRUE`, `PASS_PATHS_NOT_CONTENT: TRUE` |
| **Dependency policy** | Zero external dependencies (hard requirement) | No stated constraint |
| **Per-invocation processing** | The skill itself contains the workflow | 4D Processing Wrapper (Deconstruct→Diagnose→Develop→Deliver) runs internally on every agent turn |

---

### Where They Converge (Shared Standards)

Both systems independently arrive at the same conclusions on several points, which means these are reliable cross-industry standards:

**Progressive disclosure (identical spec):**
- SKILL.md / agent body ≤ 500 lines
- Reference files one level deep from the main file (never nested)
- Reference files > 100 lines must include a table-of-contents at the top
- Metadata pre-loads; body loads on invocation; reference files load on read

**Description discipline:**
- `name` ≤ 64 characters, letters + hyphens only
- `description` ≤ 1024 characters
- Third person only — first/second person breaks POV consistency in the system prompt
- Both fields load on every session start — every extra sentence costs tokens on every message

**Write/review isolation:**
- Superpowers: implementer subagent ≠ reviewer subagent (two-stage review)
- AI Pipelines: `WRITE_REVIEW_ISOLATION: TRUE` — writing agent ≠ reviewing agent
- Both systems independently enforce the same principle: the agent that creates cannot objectively verify its own work

**Fresh context per task:**
- Superpowers: fresh subagent per task in SDD to prevent context pollution
- AI Pipelines: `PIPELINE_PHASE_ISOLATION: TRUE` — Tester, Analyzer, Healer are separate instances
- Same rationale: isolated context produces cleaner, more reliable results

---

### Key Conceptual Differences Explained

#### 1. Skills as Runtime Guides vs. Agent Infrastructure

In Superpowers, a skill is a markdown document the running agent reads and follows. The agent decides at runtime whether to invoke it. Skills shape _process_ — how to do TDD, how to debug, how to brainstorm.

In AI Pipelines, a skill preloaded via `skills:` frontmatter injects the skill's _full content_ at agent startup — different from the session-level metadata-only discovery. Skills here are closer to preloaded context than to runtime guides.

**Practical consequence:** A Superpowers skill designed for session-level invocation will be over-loaded if placed in a pipeline agent's `skills:` frontmatter. Conversely, a pipeline reference skill (no SKILL.md body, only a `references/` directory) would never be discovered by the Superpowers bootstrap.

#### 2. Orchestration Explicitness

Superpowers orchestration is _implicit_ — it emerges from skill invocations. The brainstorming skill specifies a 9-step checklist; the SDD skill contains a dispatch loop; the agent follows both in sequence. There is no formal pipeline DSL.

AI Pipelines orchestration is _explicit_ — pipeline patterns (1-5) are named, formal, and reusable. The orchestrator knows it is running Pattern 3 (Iterative Loop) or Pattern 5 (Spec-Driven Development). State is tracked in a structured JSON file.

**When explicit matters:** Long-running pipelines with many phases, checkpoints, human gates, and recovery logic need the explicitness of AI Pipelines. Interactive development sessions with a human in the loop benefit from Superpowers' implicit, workflow-shaped behavior.

#### 3. The 4D Processing Wrapper Has No Superpowers Equivalent

AI Pipelines defines a per-invocation processing method: **Deconstruct → Diagnose → Develop → Deliver**. This runs internally on every agent turn (surfaced only on "show 4D"). It forces agents to extract intent, identify failure modes, match strategy, and lead with conclusion on every response.

Superpowers has no equivalent. The closest analogue is `brainstorming` (which similarly explores intent, constraints, and approaches before acting), but brainstorming is a one-time workflow step rather than a per-turn internal process.

#### 4. The ANT Swarm Principle vs. Subagent-Driven Development

AI Pipelines: `ANT_SWARM_PRINCIPLE: TRUE` — many small-context agents are preferred over single large-context agents. The goal is to minimize each agent's context to the minimum needed.

Superpowers SDD: fresh subagent per task, but the orchestrating agent holds the plan and curates exactly what each subagent needs. The emphasis is on isolation and precision of context, not necessarily minimizing it.

Both reject the "one massive agent" approach, but from different angles: AI Pipelines worries about context window limits; Superpowers worries about context pollution between tasks.

#### 5. Model Selection Philosophy

AI Pipelines: `SONNET_ONLY` — never configure Opus. Scale depth via `effort: low | medium | high | xhigh | max` on the model, not by switching models. This prevents pipeline cost explosion and ensures consistent behavior.

Superpowers: use the least powerful model that can handle each role. Mechanical single-file tasks → cheap/fast model. Integration judgment → standard model. Architecture and review → most capable. This is explicitly multi-model.

**Synthesis:** If you are building a pipeline that will run many times automatically, SONNET_ONLY + effort scaling is safer and cheaper. If you are in an interactive session making judgment calls about individual tasks, the Superpowers model-selection heuristic is more appropriate.

#### 6. Prompt Cache Discipline

AI Pipelines has an explicit, detailed cache strategy:
- `STATIC_FIRST`: system prompt, skills, tools at start; dynamic content last
- `NO_TOOL_CHURN`: never add/remove/reorder tools mid-session
- `SKILLS_LIST_STABLE`: changing skills list invalidates cache
- `NO_DYNAMIC_TIMESTAMPS`: timestamps in static content shatter prefix matching
- Up to 4 cache breakpoints; 1h TTL for long loops, 5m for short
- Thinking blocks CAN be cached in previous assistant turns

Superpowers does not address caching. This is a gap: Superpowers skills can inadvertently cause cache invalidation if the session-start hook produces variable output (e.g., different timestamps).

**Implication for plugin authors:** If you are authoring skills that will be used in high-throughput pipeline contexts, follow the AI Pipelines cache discipline even if Superpowers doesn't require it:
- Keep the `using-superpowers` output stable across identical sessions
- Don't include session-specific metadata in skill content
- Ensure the `session-start` hook output is deterministic

#### 7. Worktree Lifecycle in Pipelines

AI Pipelines adds a requirement Superpowers doesn't explicitly state: `WORKTREE_MERGE_REQUIRED: TRUE` — if `isolation: worktree` is used, the orchestrator MUST explicitly commit and merge successful changes before worktree destruction.

Superpowers' `finishing-a-development-branch` handles this for options 1 (merge locally) and 4 (discard), but the pipeline requirement makes it explicit for automated contexts where a worktree might be destroyed by infrastructure before the agent gets to option selection.

**Gap:** Superpowers does not define behavior for externally-destroyed worktrees. If a pipeline tears down a worktree container after a timeout, uncommitted work is silently lost. Pipeline users should ensure work is committed (or at minimum, stashed) before worktree destruction occurs.

---

### Decision Guide: Which to Use When

```
Building a system...
  │
  ├── with a human in the loop, single session?
  │     → Superpowers (behavior-shaping for interactive development)
  │
  ├── automated, multi-phase, runs without human intervention?
  │     → AI Pipelines (explicit orchestration, structured state, cache discipline)
  │
  ├── both (interactive development that produces pipeline artifacts)?
  │     → Superpowers for the session workflow
  │     → AI Pipelines conventions for the agents the session produces
  │
  ├── teaching an agent workflow discipline (TDD, debugging, verification)?
  │     → Superpowers skills
  │
  ├── architecting a multi-agent system (fan-out, iterative loops, gates)?
  │     → AI Pipelines patterns
  │
  └── both — a disciplined agent that also runs pipelines?
        → Use Superpowers' `using-git-worktrees`, `brainstorming`, TDD skills
          for the development phase, then AI Pipelines patterns for the
          automation the development produces
```

---

### Standards That Apply to Both Systems

These rules are safe to apply in any context — they are confirmed by both architectures independently:

1. **Description = triggering conditions only, no workflow summary** — both systems penalize descriptions that summarize process
2. **Third-person descriptions** — both explicitly require this for system prompt injection consistency
3. **≤ 500 lines for main skill/agent body** — both state this limit
4. **References one level deep, ToC if > 100 lines** — both require this
5. **Writing agent ≠ reviewing agent** — both enforce isolation
6. **Fresh context per task** — both reject shared-context multi-task agents
7. **No hardcoded paths** — both require parameterized or dynamic path resolution
8. **Metadata loads at startup; body loads on invocation; references load on read** — both implement progressive disclosure identically
9. **One excellent example, not multi-language** — both prefer depth over breadth in examples
10. **Avoid deeply nested references** — both warn against 2+ level chains causing partial reads

---

### Gaps in Each System (From the Other's Perspective)

**Superpowers gaps exposed by AI Pipelines:**

| Gap | AI Pipelines solution |
|---|---|
| No prompt cache discipline | STATIC_FIRST, NO_TOOL_CHURN, cache breakpoints, TTL ordering |
| No formal pipeline patterns | 6 named patterns (Sequential, Parallel, Loop, Human-Gated, Spec-Driven, 4D) |
| No auto-memory control | `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` — explicit token reclaim |
| No tool utilization auditing | PostToolUse hook auto-prunes unused tools after 3 iterations |
| No output bounding | BOUND_STDOUT, SCOPE_FILE_READS, PASS_PATHS_NOT_CONTENT |
| No path variable protocol | `{OUT}` and `{REF}` as absolute shell env vars |
| No per-invocation request processing | 4D method (Deconstruct→Diagnose→Develop→Deliver) |
| No formal state machine | `pipeline-state.json` with structured JSON in `tmp/` |
| Worktree destruction not guaranteed | `WORKTREE_MERGE_REQUIRED: TRUE` |
| No model ID currency guarantee | Pipeline explicitly names current model IDs and prohibits retired ones |

**AI Pipelines gaps exposed by Superpowers:**

| Gap | Superpowers solution |
|---|---|
| No session bootstrap / skill discipline | `using-superpowers` hook injection + Red Flags table |
| No TDD enforcement | `test-driven-development` iron law + rationalization table |
| No root-cause-first debugging | `systematic-debugging` 4-phase process |
| No verification-before-claims gate | `verification-before-completion` with explicit evidence requirement |
| No design-before-code gate | `brainstorming` hard gate — no code before approved spec |
| No spec compliance review | SDD two-stage review: spec compliance before code quality |
| No worktree safety verification | `using-git-worktrees` checks `.gitignore` before creating |
| Platform abstraction (Claude Code only) | Works on 6+ platforms via platform-specific hooks |
| No PR quality standards | CLAUDE.md contributor guidelines with 94% rejection rate context |
| Skills not tested before deployment | `writing-skills` TDD-for-documentation methodology |
