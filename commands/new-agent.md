---
description: Design a single new subagent for use within a pipeline (capability contract, frontmatter schema, ≤150-line body)
argument-hint: [agent name and goal]
---

# /superpipelines:new-agent

Dispatch the `pipeline-architect` subagent in AGENT mode (single-agent design).

Brief: $ARGUMENTS

The architect will:

1. Run the 4D Method on the brief (GATE if ≥3 critical slots missing).
2. Identify the agent's single goal, minimal tool allowlist, and effort tier.
3. Write `agents/<name>.md` with frontmatter per `pipeline-architect-references/agent-frontmatter-schema.md`.
4. Body declares capability contract (Inputs / Output schema) within the first 10 lines, ≤150 lines total.
5. Deliver Architect's Brief + 3–5 test prompts to validate routing.

Apply the Subagent Design Checklist before writing. State assumptions explicitly when filling gaps.
