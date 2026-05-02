# Axiomius Core Philosophy

## 1. Ant Swarm > Diver

Many single-purpose agents with fresh context windows outperform one deep-diving agent. Reasoning quality degrades sharply once a context window hits 40–60% fill (the "Dumb Zone"). Every agent is a disposable specialist: narrow goal, tight tool set, short prompt, pristine context. Pipelines grow by adding more small agents, never by making existing ones larger.

> **Heuristic:** If an agent's body exceeds 150 lines or its tool list exceeds 6 entries, split it.

## 2. RPI: Research, Plan, Implement

Never have one agent or session do everything. Research fills a context window with discovery. Planning compresses discovery into `spec.md` + `tasks.md`. Implementation starts in a fresh context window that loads only the plan artifacts. Each phase gets a pristine context; no cross-phase contamination.

> **Heuristic:** If the same session both grepped the codebase and wrote code, the pipeline is malformed.

## 3. Verification is the Moat

Code generation is commoditized; verification is the differentiator. Every agent must verify its own output before reporting (tsc, lint, format, tests, schema assertions). Every task in `tasks.md` must carry an automated success criterion — a command that returns pass/fail. Writer and reviewer are always different instances.

> **Heuristic:** If a task's acceptance criterion cannot be grepped or executed, it is not an acceptance criterion.

## 4. Architecture > Wording

When an agent underperforms, diagnose topology and information flow before prompt phrasing. Prompt tweaks cannot fix a misshaped pipeline. Match the collaboration pattern to the task's data dependencies: sequential for transforms, parallel for independent analyses, iterative loops for heal cycles, human gates for destructive actions.

> **Heuristic:** If two rewrites of the prompt haven't fixed a recurring failure, the topology is wrong.

## 5. Every Token Earns Its Place

Agent prompts stay under 150 lines. State each rule once. Remove what the model can infer. Use progressive disclosure: preload shared method skills for always-needed content; file reads for on-demand reference. Never hardcode discoverable info — agents can `Glob`, `Grep`, and `Read`.

> **Heuristic:** If a line could be deleted without loss of behavior on three representative inputs, delete it.

## 6. Agents are Software

Single responsibility, typed inputs/outputs, explicit error handling, defined contracts. File name matches `name` field. Description is the routing contract. Tools are an explicit minimal allowlist. `maxTurns` bounds execution. Hooks enforce safety. Orchestrators pass file paths, never file contents.

> **Heuristic:** If you would not merge this agent into a codebase, do not ship it as an agent.

## 7. Progressive Disclosure > Monolithic Instructions

Front-load essential instructions in the agent body. Defer reference material, edge cases, and deep documentation to companion `{agent}-references/` skills that the agent reads only when needed. Body <=150 lines; SKILL.md <=500 lines; refs one level deep with a ToC when over 100 lines.

> **Heuristic:** If an agent's body contains a table of 20 rows that will be consulted three times per year, extract it.
