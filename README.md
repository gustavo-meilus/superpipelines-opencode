# Superpipelines

> **Multi-agent AI pipelines with guaranteed spec compliance, write/review isolation, and full crash recovery — across Claude Code, Cursor, Codex, OpenCode, Copilot CLI, and Gemini CLI.**

---

Stop asking Claude to "build the whole thing." Start running pipelines.

Superpipelines gives Claude a complete framework for decomposing complex tasks into coordinated subagents, reviewing every output against the spec before it merges, and resuming where it left off when things go sideways. It works the way real engineering teams work: separate authors, separate reviewers, explicit handoffs, and a human gate before anything irreversible happens.

---

## What changes when you use this

**Without Superpipelines:**
- You describe a big task, Claude writes one giant response, and you hope it's right.
- The same agent that wrote the code reviews it (and finds nothing wrong with its own work).
- If the session dies mid-task, you start over.
- "Let me just try one more iteration" leads to three hours of thrashing.

**With Superpipelines:**
- Claude deconstructs your task into a precise spec, a plan, and an itemized task list — then asks for your approval before writing a single line of code.
- A dedicated reviewer agent (that never touches the implementation) validates every task against the spec before it's committed.
- Pipeline state persists to `tmp/pipeline-state.json`. Crash, resume, continue.
- Escalation triggers are hard-coded. When iteration caps hit, Claude stops and hands back to you — it cannot rationalize its way past the gates.

---

## How a pipeline runs

```
You: "Build a CSV ingestion pipeline that validates rows and posts results to Slack."
```

```
1. DECONSTRUCT  — Claude asks the 5 clarifying questions that actually matter
2. DIAGNOSE     — Gaps, ambiguities, and constraints are surfaced before any code
3. DEVELOP      — pipeline-architect writes spec.md + plan.md + tasks.md
4. HARD GATE    — You review the spec. Approve, revise, or reject.

   ✅ Approved? Running-a-pipeline takes over.

5. IMPLEMENT    — Workers execute each task in isolated git worktrees (parallel where safe)
6. STAGE 1      — pipeline-spec-reviewer checks: Does it match the spec? Under-built = FAIL.
7. STAGE 2      — pipeline-quality-reviewer checks: Is the code solid? (Only runs after Stage 1 passes.)
8. COMMIT       — Passing tasks merge to the integration branch.
9. DONE         — State marked completed. Worktrees cleaned. Summary surfaced.
```

The reviewer agents have `disallowedTools: Write, Edit, Bash`. They cannot modify what they review. This is enforced at the agent definition level, not by asking nicely.

---

## Patterns

Superpipelines selects the right execution pattern for your task automatically:

| Pattern | Shape | When |
|---------|-------|------|
| **1 — Sequential** | A → B → C | Ordered phases with hard data dependencies |
| **2 — Parallel Fan-Out** | A → [B, C, D] → Merger | Independent branches that merge |
| **3 — Iterative Loop** | Implement → Test → Diagnose → Fix (max 3×) | Test-driven repair with escalation cap |
| **4 — Human-Gated** | Agent → Gate → Agent | High-stakes stages requiring approval |
| **5 — Spec-Driven Dev** | Spec → Parallel tasks → 2-stage review | Full SDD with worktrees per task |
| **6 — 4D Wrapper** | Deconstruct → Diagnose → Develop → Deliver | Wraps any pattern with structured intake |

---

## Installation

### Claude Code

```bash
claude plugin install github:gustavo-meilus/superpipelines
```

### Cursor

```
/add-plugin superpipelines
```

### OpenCode

Tell the agent:
```
Fetch and follow instructions from https://raw.githubusercontent.com/gustavo-meilus/superpipelines/refs/heads/main/.opencode/INSTALL.md
```

### Codex CLI / App

```
/plugins → search superpipelines
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add gustavo-meilus/superpipelines
copilot plugin install superpipelines@superpipelines-marketplace
```

### Gemini CLI

```bash
gemini extensions install https://github.com/gustavo-meilus/superpipelines
```

---

## Slash commands

| Command | What happens |
|---------|--------------|
| `/superpipelines:new-pipeline` | 4D intake → architect → spec/plan/tasks → human gate |
| `/superpipelines:run-pipeline` | Orchestrate an existing `tasks.md` end-to-end |
| `/superpipelines:audit-pipeline` | Audit agents/skills against `AI_PIPELINES_LLM.md` conventions |
| `/superpipelines:new-agent` | Design a single subagent with `pipeline-architect` in AGENT mode |
| `/superpipelines:new-skill` | Design a single `SKILL.md` with `skill-architect` |

Natural-language equivalents work on all harnesses that don't support slash commands.

---

## Compatibility

| Feature | Claude Code | Cursor | Codex | OpenCode | Copilot CLI | Gemini CLI |
|---------|:-----------:|:------:|:-----:|:--------:|:-----------:|:----------:|
| Skills (all 6 patterns) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subagents (true parallel) | ✅ | — | — | — | — | — |
| 2-stage review isolation | ✅ | role-play | role-play | role-play | role-play | role-play |
| Slash commands | ✅ | NL fallback | NL fallback | NL fallback | NL fallback | NL fallback |
| SessionStart hook | ✅ | ✅ | — | bootstrap | — | extension |
| Worktree isolation | ✅ | — | — | — | — | — |

**Tier 1 (Claude Code):** Full subagent dispatch, true parallelism, worktree isolation, 2-stage review.  
**Tier 2 (Cursor):** Skills + hooks, no native agents — role-play fallback preserves the full status protocol.  
**Tier 3 (Codex, OpenCode, Copilot, Gemini):** Skills only — in-session role-play runs every pattern; state file still works.

---

## Design principles

**Write/review isolation is structural, not advisory.** The agent that writes code has `Write, Edit, Bash` available. The reviewer does not. This isn't a guideline; it's enforced by `disallowedTools` in the agent definition.

**Escalation gates cannot be rationalized away.** `<HARD-GATE>` markers stop the workflow dead. The pattern 3 iteration cap is hard-coded at 3. "One more iteration should fix it" is explicitly listed as a Red Flag — STOP in the orchestration skill.

**State is always writable.** If the session dies, `tmp/pipeline-state.json` preserves exactly where you were. On resume, in-progress phases reset to `pending` and re-run cleanly. Completed phases are not re-executed.

**Model selection is intentional.** Every agent runs on `claude-sonnet-4-6`. Scale comes from `effort: low | medium | high | xhigh | max` — not from switching to a larger model mid-pipeline.

**Progressive disclosure keeps context lean.** Skills inject their bodies at session start. Reference docs (the long ones) are only loaded when invoked by name. Agent bodies stay ≤150 lines. The heavy content lives in `*-references/references/` and is read on demand.

---

## Repository layout

```
superpipelines/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── marketplace.json      # Marketplace listing
├── agents/
│   ├── pipeline-architect    # Spec/plan/tasks generation (4 modes)
│   ├── pipeline-auditor      # Convention compliance audit (read-only)
│   ├── pipeline-task-executor     # Single-task implementation
│   ├── pipeline-spec-reviewer     # Stage 1: spec compliance (no write tools)
│   ├── pipeline-quality-reviewer  # Stage 2: code quality (no write tools)
│   ├── pipeline-failure-analyzer  # Pattern 3 diagnosis + escalation
│   └── skill-architect       # SKILL.md design (6 modes)
├── skills/
│   ├── using-superpipelines/       # Bootstrap: routing rules, capability tiers
│   ├── creating-a-pipeline/        # Workflow: 4D intake → architect → human gate
│   ├── running-a-pipeline/         # Workflow: orchestrate tasks.md end-to-end
│   ├── sk-pipeline-patterns/       # Pattern selection matrix (preloaded)
│   ├── sk-pipeline-state/          # State schema + recovery rules (preloaded)
│   ├── sk-worktree-safety/         # 4-step worktree protocol (preloaded)
│   ├── sk-write-review-isolation/  # Stage 1/2 schemas + Red Flags (preloaded)
│   ├── sk-rationalization-resistance/  # HARD-GATE conventions (preloaded)
│   ├── sk-4d-method/               # 4D processing wrapper
│   ├── sk-spec-driven-development/ # SDD 6-phase workflow
│   ├── sk-claude-code-conventions/ # Model IDs, frontmatter, pairing patterns
│   ├── *-references/               # Deep reference libraries (on-demand, no SKILL.md)
│   └── brainstorming/              # Legacy: kept for open-ended exploration
├── commands/                 # Slash command wrappers
├── hooks/
│   └── session-start         # Byte-identical multi-harness payload
├── docs/
│   └── AI_PIPELINES_LLM.md   # Canonical pipeline conventions (full)
└── settings.json             # autoMemoryEnabled: false, Bash(*) allow
```

---

## Contributing

Issues and PRs welcome at [gustavo-meilus/superpipelines](https://github.com/gustavo-meilus/superpipelines).

To add a new pattern or agent, run `/superpipelines:new-agent` or `/superpipelines:audit-pipeline` to validate your additions against the conventions before opening a PR.

---

## License

MIT — see [`LICENSE`](./LICENSE).

Built on pipeline conventions and skill-design patterns distilled from Anthropic's Skills Open Standard and the Superpowers project by Jesse Vincent.
