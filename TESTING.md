# Testing Superpipelines-Opencode

> Manual testing guide for verifying the plugin works correctly with [Opencode](https://opencode.ai). The project has no automated test suite — all verification is done through the Opencode runtime and CLI.

## Prerequisites

- Node.js >= 18
- Opencode CLI installed and available on PATH
- A project directory to test within (this repo works)

## 1. Build

```bash
npm install
npm run build
```

Confirm `dist/index.js` and `dist/tui.js` exist. If either is missing, the build failed.

```bash
ls dist/index.js dist/tui.js
```

## 2. Type-check

```bash
npx tsc --noEmit
```

Must return zero errors. Any type error indicates a break in the plugin's contract with `@opencode-ai/plugin` or `@opencode-ai/sdk`.

## 3. Register the plugin

The plugin has two entry points: the **server plugin** (`dist/index.js`) and the **TUI plugin** (`dist/tui.js`). Both must be registered for full functionality.

### Local file URL (development)

Add to `.opencode/opencode.json` in your test project:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    ["file:///D:/Github/superpipelines-opencode/dist/index.js", {
      "models": {
        "default": "opencode/gemini-3.1-pro",
        "architect": "opencode/gemini-3.1-pro",
        "reviewer": "opencode/gemini-3-flash"
      }
    }],
    "file:///D:/Github/superpipelines-opencode/dist/tui.js"
  ]
}
```

> **Note:** The server plugin entry uses the `[path, options]` tuple format to pass model preferences. The TUI plugin entry is a plain string since it takes no options.

### Global config (all projects)

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    ["file:///D:/Github/superpipelines-opencode/dist/index.js", {
      "models": {
        "default": "opencode/gemini-3.1-pro",
        "architect": "opencode/gemini-3.1-pro",
        "reviewer": "opencode/gemini-3-flash"
      }
    }],
    "file:///D:/Github/superpipelines-opencode/dist/tui.js"
  ]
}
```

### npm package (published version)

```json
{
  "plugin": [
    ["superpipelines-opencode", {
      "models": {
        "default": "opencode/gemini-3.1-pro",
        "architect": "opencode/gemini-3.1-pro",
        "reviewer": "opencode/gemini-3-flash"
      }
    }]
  ]
}
```

When installed from npm, the TUI plugin is loaded via the `./tui` export defined in `package.json` `exports`. No separate registration is needed.

## 4. Verify config hook

The `config` hook is responsible for four registrations: skills, agents, built-in commands, and dynamic pipeline commands.

```bash
opencode debug config
```

### 4a. Verify skills registration

In the output, find `"skills"` → `"paths"`. It must contain the absolute path to `superpipelines-opencode/skills`. For example:

```json
"skills": {
  "paths": [
    "D:\\Github\\superpipelines-opencode\\skills"
  ]
}
```

### 4b. Verify agent registration

Find `"agent"` in the output. All seven agents must be present with their resolved models:

| Agent | Expected model |
|---|---|
| `pipeline-architect` | architect model (`opencode/gemini-3.1-pro`) |
| `pipeline-auditor` | default model (`opencode/gemini-3.1-pro`) |
| `pipeline-failure-analyzer` | default model (`opencode/gemini-3.1-pro`) |
| `pipeline-quality-reviewer` | reviewer model (`opencode/gemini-3-flash`) |
| `pipeline-spec-reviewer` | reviewer model (`opencode/gemini-3-flash`) |
| `pipeline-task-executor` | default model (`opencode/gemini-3.1-pro`) |
| `skill-architect` | architect model (`opencode/gemini-3.1-pro`) |

Each agent must have:

- `model` — resolved per the naming convention (architect/reviewer/default)
- `prompt` — the Markdown body from the agent `.md` file (not `system`; Opencode uses `prompt`)
- `description` — from YAML frontmatter
- `maxSteps` — the `steps` value from frontmatter
- `permission` — `edit`/`bash` allow/deny values from frontmatter

**Failure modes:**

- Agents missing entirely → `agents/` directory not found relative to plugin root
- `model` field absent or wrong → model resolution logic broken or options not passed
- `system` field present instead of `prompt` → frontmatter field mapping is wrong (must be `prompt`)
- Agent names use hyphens not underscores → file naming convention is `pipeline-architect.md`

### 4c. Verify built-in command registration

Find `"command"` in the output. These seven built-in commands must be present:

| Command key | Source file |
|---|---|
| `superpipelines:new-pipeline` | `commands/new-pipeline.md` |
| `superpipelines:run-pipeline` | `commands/run-pipeline.md` |
| `superpipelines:new-step` | `commands/new-step.md` |
| `superpipelines:update-step` | `commands/update-step.md` |
| `superpipelines:delete-step` | `commands/delete-step.md` |
| `superpipelines:audit-pipeline` | `commands/audit-pipeline.md` |
| `superpipelines:init-deep` | `commands/init-deep.md` |

Each must have `template` (the Markdown body) and `description` from frontmatter.

### 4d. Verify dynamic pipeline commands

If pipelines are defined under `.opencode/superpipelines/{P}/{P}.md`, those should also appear as `superpipelines:{P}` commands. Test by creating a dummy pipeline:

**Linux / macOS:**

```bash
mkdir -p .opencode/superpipelines/test-pipeline
cat > .opencode/superpipelines/test-pipeline/test-pipeline.md << 'EOF'
---
description: Test pipeline for verification
agent: pipeline-task-executor
---
Run the test pipeline.
EOF
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Path ".opencode/superpipelines/test-pipeline" -Force
Set-Content -Path ".opencode/superpipelines/test-pipeline/test-pipeline.md" -Value @"
---
description: Test pipeline for verification
agent: pipeline-task-executor
---
Run the test pipeline.
"@
```

Then restart opencode and check `opencode debug config` for `superpipelines:test-pipeline`. It should appear in the `command` section with `template` and `description`.

**Cleanup after test:**

```bash
rm -rf .opencode/superpipelines/test-pipeline
```

## 5. Verify TUI plugin

### 5a. Built-in slash commands in the UI

Start `opencode` and type `/` in the command palette. You should see the seven SuperPipelines commands:

| Title | Slash command |
|---|---|
| SuperPipelines: New Pipeline | `/superpipelines:new-pipeline` |
| SuperPipelines: Run Pipeline | `/superpipelines:run-pipeline` |
| SuperPipelines: Add Step | `/superpipelines:new-step` |
| SuperPipelines: Update Step | `/superpipelines:update-step` |
| SuperPipelines: Delete Step | `/superpipelines:delete-step` |
| SuperPipelines: Audit Pipeline | `/superpipelines:audit-pipeline` |
| SuperPipelines: Init Deep Context | `/superpipelines:init-deep` |

All commands should appear under the "SuperPipelines" category.

### 5b. Dynamic pipeline commands in the UI

If pipeline directories exist under `.opencode/superpipelines/` with a `{P}/{P}.md` file, their commands should also appear. For example, a pipeline named `code-review` with file `.opencode/superpipelines/code-review/code-review.md` would appear as:

| Title | Slash command |
|---|---|
| Run: code-review | `/superpipelines:code-review` |

Dynamic commands are discovered at TUI load time. Creating or removing a pipeline command file requires an Opencode restart to take effect.

### 5c. Session events

- **On session idle**: A success toast "SuperPipelines session completed" should appear.
- **On session error**: An error toast "SuperPipelines session encountered an error" should appear.

These are fire-and-forget visual indicators. They confirm the TUI event listeners are wired correctly.

## 6. Verify chat message transform (bootstrap injection)

The `experimental.chat.messages.transform` hook injects a `<EXTREMELY_IMPORTANT>` block at the top of the first user message. This block contains:

1. The model preferences directive (default/architect/reviewer)
2. The full content of `skills/using-superpipelines/SKILL.md`

### How to test

1. Start `opencode` in any project with the plugin configured
2. Send a message like "hello"
3. Observe the first assistant response — it should acknowledge superpipelines and follow the routing table
4. The bootstrap injection is invisible to the user but shapes the assistant's behavior

### How to confirm injection is working

Check that:

- The assistant references "SuperPipelines" or "superpipelines" unprompted
- The assistant routes `/superpipelines:new-pipeline` requests to the `creating-a-pipeline` skill
- The assistant applies the model preferences when spawning agents (e.g., `pipeline-spec-reviewer` uses the reviewer model)

### How to confirm it is NOT double-injecting

The hook checks `firstUser.parts` for an existing `EXTREMELY_IMPORTANT` text block. If you see the bootstrap content duplicated in any response, the deduplication check is broken.

## 7. CRLF regression test

Agent `.md` files and skill files on Windows are checked out with `\r\n` line endings. The `extractFrontmatter()` function normalizes these with `.replace(/\r\n/g, "\n")`. Without this normalization, the regex `^---\n` fails to match and agents silently skip registration.

### How to test

```bash
git checkout --force
npm run build
```

(Forces re-checkout of `.md` files with native line endings.)

Then verify with `opencode debug config` that all 7 agents still register. If any agents are missing, CRLF normalization is broken.

## 8. End-to-end scenario tests

### 8a. Create a pipeline

```
/superpipelines:new-pipeline
```

Or say: "Design a pipeline for running Playwright E2E tests"

Expected: The assistant should invoke the `creating-a-pipeline` skill, perform git preflight and scope selection, then produce pipeline artifacts including a per-pipeline command file at `.opencode/superpipelines/{P}/{P}.md`.

### 8b. Run a pipeline

```
/superpipelines:run-pipeline
```

Or say: "Run a pipeline"

Expected: The assistant should list available pipelines and offer to execute one.

### 8c. Add a step

```
/superpipelines:new-step
```

Or say: "Add a code-review step to my pipeline"

Expected: The assistant should invoke the `adding-a-pipeline-step` skill and mutate topology.json.

### 8d. Audit

```
/superpipelines:audit-pipeline
```

Expected: The assistant should invoke the `pipeline-auditor` agent for a read-only topology and compliance review.

### 8e. Init deep context

```
/superpipelines:init-deep
```

Expected: The assistant should traverse the repository and generate `PIPELINE-CONTEXT.md` files across significant directories.

### 8f. Run a pipeline directly (per-pipeline command)

After creating a pipeline (e.g., `code-review`), a per-pipeline command file should exist at `.opencode/superpipelines/code-review/code-review.md`. Restart Opencode, then:

```
/superpipelines:code-review
```

Expected: The assistant should skip discovery and directly execute the `code-review` pipeline via its entry skill.

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Agents not registered | `agents/` not found relative to plugin `__dirname` | Confirm `dist/index.js` is one level below project root |
| Wrong model on an agent | Name doesn't contain "architect" or "reviewer" | Check agent filename matches the expected pattern |
| `system` field in agent config | Code uses `system` instead of `prompt` | Rebuild after confirming `src/index.ts` uses `prompt` |
| Built-in commands missing from config | `commands/` directory not found or filename not in `BUILTIN_COMMANDS` map | Verify `commands/*.md` files exist and names match the map in `src/index.ts` |
| No slash commands in TUI | TUI plugin not loaded | Confirm `.opencode/opencode.json` includes the TUI entry point (`dist/tui.js`) in the `plugin` array |
| Per-pipeline command not appearing | Missing `{P}/{P}.md` file or file in wrong location | Pipeline commands must be at `.opencode/superpipelines/{P}/{P}.md` (not `run-{P}.md`) |
| Per-pipeline command stale after change | TUI discovers commands at load time | Restart Opencode after creating or modifying per-pipeline command files |
| Dynamic command conflicts with built-in | Pipeline name matches a built-in command filename | Rename the pipeline; built-in commands take precedence in `config.command` |
| Bootstrap not injected | `skills/using-superpipelines/SKILL.md` missing or unreadable | Verify the file exists at `{pluginRoot}/skills/using-superpipelines/SKILL.md` |
| Duplicate bootstrap | Deduplication check fails | Hook should check `firstUser.parts` for existing `EXTREMELY_IMPORTANT` text |
| CRLF parsing failure | Windows checkout produced `\r\n` | Confirm `extractFrontmatter()` normalizes line endings |
| `opencode debug config` shows no plugin | Config file not found or malformed | Check JSON syntax; confirm the file is at `.opencode/opencode.json` (project) or `~/.config/opencode/opencode.json` (global) |
| Plugin loads but no `experimental.chat.messages.transform` | Opencode version doesn't support this hook | Update Opencode to the latest version |

## 10. Quick smoke test checklist

Run after any change to `src/index.ts` or `src/tui.ts`:

```bash
npm run build
npx tsc --noEmit
opencode debug config
```

Then in a new Opencode session:

- [ ] All 7 agents present in config with correct models
- [ ] `skills.paths` includes the plugin skills directory
- [ ] 7 built-in `superpipelines:*` commands present in config
- [ ] `/superpipelines:new-pipeline` slash command visible in TUI
- [ ] `/superpipelines:audit-pipeline` slash command visible in TUI (added in v1.0.8)
- [ ] `/superpipelines:init-deep` slash command visible in TUI (added in v1.0.8)
- [ ] Bootstrap content injected (assistant acknowledges superpipelines)
- [ ] No duplicate bootstrap (ask twice, confirm no doubling)
- [ ] Session toast appears on idle/error
- [ ] Per-pipeline command appears for any `.opencode/superpipelines/{P}/{P}.md`
- [ ] CRLF resilience: agents still load after `git checkout --force` on Windows