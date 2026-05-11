---
name: change-models
description: Use when the user wants to quickly and interactively change the LLM models assigned to pipeline step agents, built-in core agents, or all agents at once. Discovers models from OpenCode Zen, Go, and custom providers, then applies changes to agent frontmatter. Invoke via /superpipelines:change-models.
user-invocable: true
---

# Change Models — Interactive Model Reassignment

> Enables quick, interactive model reassignment across pipeline agents and built-in core agents. Discovers available models from OpenCode Zen, OpenCode Go, and custom providers configured in opencode.json, then applies changes to agent YAML frontmatter files.

<overview>
The Change Models workflow provides a streamlined interface for swapping LLM models across a pipeline's agents or all superpipelines agents at once. It supports three interaction modes — bulk application, individual selection, and natural language instruction — and enforces a confirm-before-write protocol to prevent unintended changes.
</overview>

<glossary>
  <term name="Model Catalog">A unified list of available LLM models sourced from OpenCode Zen, OpenCode Go, custom providers in opencode.json, and a static fallback.</term>
  <term name="Agent Frontmatter">YAML header in agent `.md` files containing metadata like `name`, `model`, `mode`, `steps`, etc.</term>
  <term name="Fuzzy Match">A name-matching algorithm that normalizes and compares model names to resolve natural language references like "Qwen 3.6 Plus" to `opencode/qwen3.6-plus` or `opencode-go/qwen3.6-plus`.</term>
</glossary>

## Workflow Phases

<protocol>
### PHASE 0: MODEL DISCOVERY

- **Network Fetch**: Attempt to fetch live model lists from:
  - OpenCode Zen: `https://opencode.ai/zen/v1/models`
  - OpenCode Go: `https://opencode.ai/zen/go/v1/models`
- **Static Fallback**: If either fetch fails, fall back to the curated catalog in `references/model-catalog.md`.
- **Custom Provider Discovery**: Read provider configurations from all three config scopes:
  - Project: `<workspace>/.opencode/opencode.json`
  - User: `~/.config/opencode/opencode/opencode.json`
  - Custom: `OPENCODE_CONFIG` environment variable path (if set)
- Parse `provider` entries and extract `<provider-id>/<model-id>` pairs from `provider.<id>.models` objects. Include the `name` field if available for display.
- **Catalog Assembly**: Merge all sources into a unified catalog grouped by provider prefix:
  - `opencode/` — Zen models
  - `opencode-go/` — Go models
  - Built-in provider prefixes (`anthropic/`, `openai/`, `google/`, `deepseek/`, etc.)
  - Custom provider prefixes (e.g., `ollama/`, `lmstudio/`, user-defined IDs)
- Present the catalog to the user as a numbered, grouped menu.

### PHASE 1: PIPELINE & AGENT SELECTION

- Resolve all scope registries via `sk-pipeline-paths`:
  - Local: `<workspace>/.opencode/superpipelines/registry.json`
  - User: `~/.opencode/superpipelines/registry.json`
- **Agent Scan**: Scan both locations for agent files:
  - Plugin agents: `<plugin-root>/agents/*.md`
  - Project pipeline agents: `<workspace>/.opencode/agents/superpipelines/**/*.md`
  - User pipeline agents: `~/.opencode/agents/superpipelines/**/*.md`
- Read each agent file's YAML frontmatter to extract the current `model` field (if any).
- For agents without an explicit `model` frontmatter field, display the resolved default based on the plugin config (default → `opencode/big-pickle`, architect role → `opencode/big-pickle`, reviewer role → `opencode/big-pickle`).
- **Display Table**: Present a numbered table:
  ```
  #   Agent                              Current Model              Source
  1   pipeline-architect                  opencode/big-pickle        plugin-default
  2   pipeline-auditor                    opencode/big-pickle        frontmatter
  3   pipeline-spec-reviewer              opencode/big-pickle        plugin-default
  4   my-pipeline/generator               opencode/qwen3.6-plus     frontmatter
  5   my-pipeline/reviewer                opencode/big-pickle        frontmatter
  ```
  Where "Source" is `frontmatter` (explicit `model` in YAML) or `plugin-default` (inherits from plugin config).
- **Selection Options**:
  - Select individual agents by number (e.g., `1,3,5`)
  - Select a range (e.g., `1-3`)
  - Select all agents (`all`)
  - Select only built-in core agents (`core`)
  - Select only pipeline-scoped agents (`pipelines`)
  - Select a specific pipeline's agents by name (e.g., `my-pipeline`)

### PHASE 2: CHANGE MODE

Present three interaction modes:

#### Mode A — Apply to All
- Select a single model from the catalog.
- That model will be assigned to all agents selected in Phase 1.

#### Mode B — Select Individually
- For each selected agent, present the model catalog and let the user pick individually.
- Allow the user to press Enter to skip an agent (keep current model).

#### Mode C — Natural Language Instruction
- The `$ARGUMENTS` from the command (or a free-text input) are parsed as a model change instruction.
- **Instruction Format**: `<target> to <model-name>` where `<target>` can be:
  - Step numbers: `steps 1-3`
  - Agent names: `pipeline-architect`
  - `all` — all selected agents
- **Multiple assignments**: Separate with `,` or `and`:
  - `steps 1 to 3 to opencode Qwen 3.6 Plus, and 4 to 6 to opencode DeepSeek V4 Pro`
  - `pipeline-architect to opencode/claude-opus-4-7, pipeline-auditor to opencode/big-pickle`
- **Fuzzy Matching**: Normalize the model name input (lowercase, strip spaces and special characters) and compare against:
  1. Exact model IDs in the catalog
  2. Display names in the catalog
  3. Fuzzy partial matches (Levenshtein distance ≤ 3)
- **Ambiguity Resolution**: If a fuzzy match is ambiguous (multiple candidates), present the candidates and ask the user to clarify.
- **Provider Prefix Inference**: If the user omits the provider prefix (e.g., "Qwen 3.6 Plus"), search across all providers and present matches grouped by provider:
  ```
  Multiple matches for "Qwen 3.6 Plus":
  1. opencode/qwen3.6-plus (OpenCode Zen)
  2. opencode-go/qwen3.6-plus (OpenCode Go)
  ```
- Present a **confirmation table** before applying:
  ```
  Agent                        Previous Model              New Model
  pipeline-architect            opencode/big-pickle         opencode/qwen3.6-plus
  my-pipeline/generator         opencode/qwen3.6-plus      opencode/deepseek-v4-pro
  ```

### PHASE 3: APPLICATION

- For each agent in the confirmation table:
  1. Read the agent `.md` file.
  2. Parse the YAML frontmatter.
  3. If `model` field exists: update its value.
  4. If `model` field does not exist: add `model: <new-value>` after the `name` field (or as the second line of frontmatter if no `name`).
  5. Write the updated file using the Edit tool.
- **Atomicity**: Stage all changes mentally; apply them one by one. If any write fails, report the failure and continue with the remaining agents.
- **Invariant**: Only the `model` field in the frontmatter is modified. No other frontmatter fields or body content is altered.

### PHASE 4: VERIFICATION & SUMMARY

- Re-read all modified agent files.
- Parse the frontmatter and confirm the `model` field matches the assigned value.
- Present a final summary table:
  ```
  Agent                        Previous Model              New Model              Status
  pipeline-architect            opencode/big-pickle         opencode/qwen3.6-plus  ✅ Applied
  my-pipeline/generator         opencode/qwen3.6-plus      opencode/deepseek-v4-pro ✅ Applied
  ```
- If any agent file failed to update, mark it as ❌ Failed and suggest manual correction.
- **Runtime Note**: Inform the user that changes take effect on the next OpenCode session restart or pipeline run. The plugin reads agent frontmatter at startup to resolve models.
</protocol>

<invariants>
- NEVER modify an agent file without user confirmation of the change table.
- NEVER remove existing frontmatter fields; only add or update the `model` field.
- ALWAYS fall back to the static catalog (`references/model-catalog.md`) on network failures.
- NEVER modify the plugin's `opencode.json` configuration; agent frontmatter `model` fields are the canonical mechanism for per-agent model assignment.
- ALWAYS preserve the exact format and ordering of existing frontmatter fields when editing.
- NEVER modify the `plugin_version` field during model changes; it must only be updated by creation or mutation workflows (creating, adding, updating, or deleting pipeline steps) to reflect the version that last touched the pipeline.
</invariants>

## Fuzzy Matching Algorithm

<matching_protocol>
### Step 1: Normalize
- Lowercase the input.
- Remove all spaces, hyphens, underscores, dots, and special characters.
- Example: "Qwen 3.6 Plus" → "qwen36plus"

### Step 2: Exact Match
- Compare normalized input against normalized model IDs and display names in the catalog.
- If exact match found, return it immediately.

### Step 3: Prefix Match
- Check if the normalized input is a prefix of any catalog entry.
- Return all prefix matches.

### Step 4: Levenshtein Distance
- Compute Levenshtein distance between normalized input and all catalog entries.
- Return all entries with distance ≤ 3, sorted by distance.

### Step 5: Disambiguation
- If multiple candidates remain, present them grouped by provider and ask the user to select.
</matching_protocol>

## Red Flags — STOP

- "I'll just modify the opencode.json plugin config directly." → **STOP**. Per-agent frontmatter is the correct granularity. Plugin config affects all agents without distinction.
- "The network fetch failed, I can't proceed." → **STOP**. Fall back to `references/model-catalog.md` and proceed. Network failures do not block the workflow.
- "I'll skip the confirmation table." → **STOP**. All model changes must be confirmed by the user before writing.
- "The user said 'use Claude', I'll just pick claude-sonnet-4-6." → **STOP**. Ambiguous references must surface all matching candidates for the user to choose.

## Rationalization Table

<rationalization_table>
| Excuse | Reality |
| :--- | :--- |
| "The confirmation step is slow." | One unintended model swap can silently degrade an entire pipeline's output quality. |
| "I'll update the plugin config instead." | Plugin config is a global default, not per-agent. Frontmatter `model` is the correct per-agent override that the plugin already reads. |
| "The static catalog might be outdated." | It's a fallback, not the primary source. Live fetch is always attempted first. |
| "I'll guess which model the user means." | Fuzzy matching with disambiguation prevents silent misconfigurations that are hard to diagnose at runtime. |
</rationalization_table>

## Reference Files
- `references/model-catalog.md` — Static fallback model catalog for offline use.
- `sk-pipeline-paths/SKILL.md` — Scope and path resolution for registries and agents.
- `sk-4d-method/SKILL.md` — Brief deconstruction for natural language instructions.