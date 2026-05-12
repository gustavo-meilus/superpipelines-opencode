---
description: Interactively change the LLM models assigned to pipeline step agents — discover available models from Zen, Go, and custom providers, select a change mode, apply and verify
argument-hint: "[optional: natural language instruction, e.g. 'steps 1-3 to opencode Qwen 3.6 Plus, and 4 to 6 to opencode DeepSeek V4 Pro']"
agent: pipeline-architect
---

# Change Models — Command Reference

> Enables quick, interactive model reassignment across pipeline agents and built-in core agents. Discovers models from OpenCode Zen, Go, and custom providers, then applies changes to agent frontmatter.

<args>
- **$ARGUMENTS**: Optional natural language instruction for model changes. If provided, skips Mode selection and parses as a Mode C instruction. Supports formats like:
  - `all to opencode/big-pickle`
  - `steps 1-3 to opencode Qwen 3.6 Plus`
  - `pipeline-architect to opencode/claude-opus-4-7, pipeline-auditor to opencode/big-pickle`
  - `steps 1 to 3 to opencode-go Qwen3.6 Plus, and 4 to 6 to opencode-go DeepSeek V4 Pro`
</args>

<protocol>
### 1. DISCOVERY
- Fetch model catalogs from OpenCode Zen (`https://opencode.ai/zen/v1/models`) and Go (`https://opencode.ai/zen/go/v1/models`) API endpoints.
- On network failure, fall back to the static model catalog in `skills/change-models/references/model-catalog.md`.
- Parse custom providers from all config scopes (project `.opencode/opencode.json`, user `~/.config/opencode/opencode/opencode.json`, and `OPENCODE_CONFIG` environment variable).
- Build and present a unified model catalog grouped by provider.

### 2. SELECTION
- Read all registries and scan agent directories for both built-in core agents and pipeline-scoped agents.
- Display current model assignments as a numbered table with sources (frontmatter vs plugin-default).
- Let the user select which agents to modify: individual numbers, ranges, `all`, `core`, `pipelines`, or a pipeline name.

### 3. CHANGE
- If `$ARGUMENTS` is provided, parse as Mode C (natural language instruction) with fuzzy model name matching.
- If `$ARGUMENTS` is empty, present three modes:
  - **Mode A**: Apply one model to all selected agents.
  - **Mode B**: Pick a model for each agent individually.
  - **Mode C**: Enter a natural language instruction.
- For Mode C, parse step ranges and agent names, fuzzy-match model names against the catalog, and resolve ambiguities by presenting candidates.
- Present a confirmation table showing previous model → new model for every affected agent.
- Require explicit user approval before proceeding.

### 4. APPLY & VERIFY
- Edit the `model` field in each selected agent's YAML frontmatter.
- If no `model` field exists, add it after the `name` field.
- Only modify the `model` field; preserve all other frontmatter fields and body content.
- Re-read all modified files to confirm the `model` field matches the assigned value.
- Present a final summary table with status indicators (applied/failed).
- Inform the user that changes take effect on next session restart or pipeline run.
</protocol>

<invariants>
- NEVER modify agent files without user confirmation of the change table.
- NEVER remove existing frontmatter fields; only add or update `model`.
- ALWAYS fall back to the static catalog on network failures; network issues must not block the workflow.
- NEVER modify the plugin's `opencode.json` configuration for model defaults; agent frontmatter is the canonical per-agent override.
</invariants>