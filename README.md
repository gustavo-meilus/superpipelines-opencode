# Superpipelines — Multi-Agent Orchestration Framework

> Multi-agent AI pipelines with guaranteed spec compliance, write/review isolation, and full crash recovery. Superpipelines enables complex task decomposition into coordinated subagents with automated verification and state persistence.

[![npm version](https://img.shields.io/npm/v/superpipelines.svg)](https://www.npmjs.com/package/superpipelines)
[![npm downloads](https://img.shields.io/npm/dm/superpipelines.svg)](https://www.npmjs.com/package/superpipelines)

<overview>
Superpipelines provides a framework for decomposing complex tasks into coordinated subagents. It enforces engineering best practices through separate author and reviewer roles, explicit handoffs, and mandatory human gates for high-stakes transitions. The system ensures that every output matches its specification before merging, reducing model hallucinations and providing a robust path for crash recovery.
</overview>

<glossary>
  <term name="pipeline">A coordinated sequence of agent-driven tasks that transform a high-level goal into a verified implementation.</term>
  <term name="write/review isolation">The structural separation of implementation and verification, where the reviewer agent lacks modification permissions.</term>
  <term name="hard gate">A mandatory pause in execution requiring explicit human approval to proceed.</term>
</glossary>

## Capabilities

Users achieve the following outcomes when utilizing Superpipelines:

- **Deconstruction**: Tasks are decomposed into a precise specification, implementation plan, and itemized task list before execution.
- **Structural Review**: Dedicated reviewer agents validate every task against the specification before commitment.
- **State Persistence**: Pipeline state persists to scope-aware temporary directories, allowing for crash recovery and session resumption.
- **Escalation Guards**: Hard-coded iteration caps and human gates prevent model rationalization and infinite loops.

## Execution Workflow

Superpipelines executes tasks through a structured lifecycle:

<workflow>
1. **DECONSTRUCT**: The system identifies gaps, ambiguities, and constraints through targeted intake.
2. **DIAGNOSE**: Environmental and architectural constraints are surfaced before code generation.
3. **DEVELOP**: The `pipeline-architect` generates the `spec.md`, `plan.md`, and `tasks.md`.
4. **HARD GATE**: Execution pauses for human review and approval of the specification.
5. **IMPLEMENT**: Worker agents execute tasks in isolated git worktrees.
6. **STAGE 1**: `pipeline-spec-reviewer` validates output against the specification.
7. **STAGE 2**: `pipeline-quality-reviewer` performs a code quality audit (only after Stage 1 passes).
8. **COMMIT**: Passing tasks merge to the integration branch.
9. **DONE**: Temporary state is cleaned and a completion summary is surfaced.
</workflow>

<invariant>
Reviewer agents operate with `disallowedTools: Write, Edit, Bash`, ensuring they cannot modify the code they are tasked with validating.
</invariant>

## Execution Patterns

The framework selects the optimal pattern based on task complexity:

<pattern_matrix>
| Pattern | Shape | Use Case |
| :--- | :--- | :--- |
| **1 — Sequential** | A → B → C | Ordered phases with hard data dependencies. |
| **2 — Parallel Fan-Out** | A → [B, C, D] → Merger | Independent branches that merge upon completion. |
| **3 — Iterative Loop** | Implement → Test → Fix | Test-driven repair with a hard escalation cap of 3 iterations. |
| **4 — Human-Gated** | Agent → Gate → Agent | High-stakes stages requiring manual approval. |
| **5 — Spec-Driven Dev** | Spec → Tasks → 2-Stage Review | Full SDD with worktrees per task. |
| **6 — 4D Wrapper** | 4D Intake → Pattern | Wraps any pattern with structured deconstruction. |
</pattern_matrix>

## Installation

Install the Superpipelines plugin via npm or locally:

> **Published on npm**: [`superpipelines`](https://www.npmjs.com/package/superpipelines)

<installation>
```bash
# Install directly from npm
npm install -g superpipelines
```

Or, clone and build locally:

```bash
# Clone the repository
git clone https://github.com/gustavo-meilus/superpipelines-opencode.git
cd superpipelines-opencode

# Build the plugin
npm install
npm run build
```

Then, add the plugin to your `opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["superpipelines"]
}
```

Plugins specified via npm are automatically installed at startup using Bun and cached in `~/.cache/opencode/node_modules/`.

You can also place plugin source files directly in:
- `.opencode/plugins/` — Project-level plugins
- `~/.config/opencode/plugins/` — Global plugins

### Model Configuration

By default, Superpipelines targets standard OpenCode Zen models (`opencode/big-pickle`). You can override the models used by both the plugin's native agents and any generated pipelines by adding a `superpipelines` block to your `opencode.json`:

```json
{
  "plugin": ["./superpipelines-opencode"],
  "superpipelines": {
    "models": {
      "default": "openai/gpt-4o",
      "architect": "anthropic/claude-3-5-sonnet-latest",
      "reviewer": "anthropic/claude-3-5-haiku-latest"
    }
  }
}
```
</installation>

## Slash Commands

| Command | Function |
| :--- | :--- |
| `/superpipelines:new-pipeline` | Initiates 4D intake and generates pipeline artifacts. |
| `/superpipelines:run-pipeline` | Orchestrates an existing pipeline end-to-end. |
| `/superpipelines:new-step` | Adds a new step to an existing named pipeline. |
| `/superpipelines:update-step` | Modifies an existing step within a named pipeline. |
| `/superpipelines:delete-step` | Removes a step from a named pipeline with gap analysis. |
| `/superpipelines:audit-pipeline` | Audits agents and skills against the v2 compliance matrix. |

## Design Principles

- **Structural Isolation**: Permission boundaries are enforced at the agent definition level. Reviewers cannot rationalize their way into "fixing" code; they can only fail it.
- **Scope-Aware State**: Pipeline state persists to `<scope-root>/superpipelines/temp/{P}/{runId}/pipeline-state.json`. Resumption resets in-progress phases while preserving completed work.
- **Permission Granularity**: Every agent declares a `permissionMode` (e.g., `acceptEdits`, `plan`). Bypassing permissions requires explicit, documented justification.
- **Progressive Disclosure**: High-density reference documentation resides in companion `*-references/` directories and is loaded on demand to minimize context bloat.

## Repository Layout

<file_structure>
```
superpipelines-opencode/
├── package.json         # Plugin NPM package manifest
├── src/                 # TypeScript source code for the OpenCode plugin
├── dist/                # Compiled plugin code (run `npm run build`)
├── .opencode/           # Plugin installation guides
├── agents/              # Core agent definitions (Architect, Auditor, Executor, Reviewers)
├── skills/              # Shared skills (State, Paths, Patterns, Worktree Safety)
│   ├── *-references/    # Deep reference libraries (On-demand loading)
├── commands/            # Slash command wrappers
└── settings.json        # Global plugin configuration
```
</file_structure>

## Contributing

Contributions are managed via issues and PRs at [gustavo-meilus/superpipelines](https://github.com/gustavo-meilus/superpipelines). Use `/superpipelines:audit-pipeline` to validate additions against the compliance matrix before submission.

## License

MIT — See [LICENSE](./LICENSE).
