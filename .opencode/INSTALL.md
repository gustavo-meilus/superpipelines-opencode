# Installing Superpipelines for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed.

## Installation

Add `superpipelines` to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["superpipelines@git+https://github.com/gustavo-meilus/superpipelines.git"]
}
```

Restart OpenCode. The plugin auto-installs and registers all skills.

Verify by asking: "Design a pipeline that ingests a CSV and posts a summary to Slack."

## Usage

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load superpipelines/using-superpipelines
use skill tool to load superpipelines/creating-a-pipeline
```

## Updating

Restart OpenCode to pull the latest version. Pin a specific tag if needed:

```json
{
  "plugin": ["superpipelines@git+https://github.com/gustavo-meilus/superpipelines.git#v1.0.0"]
}
```

## Tool mapping

OpenCode is Tier 3 — skills work, subagents do not. When a workflow says "dispatch subagent X," role-play X in the current session: read `agents/<name>.md`, follow its rules under a fresh mental context, emit the agent's terminal status (`DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED`), and return.

Detailed mapping in `skills/using-superpipelines/references/opencode-tools.md`.

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i superpipelines`.
2. Verify the plugin line in your `opencode.json`.
3. Make sure you're running a recent version of OpenCode.

### Skills not found

1. Use `skill` tool to list what's discovered.
2. Check that the plugin is loading (see above).

## Getting Help

- Report issues: https://github.com/gustavo-meilus/superpipelines/issues
- Full documentation: https://github.com/gustavo-meilus/superpipelines/blob/main/docs/README.opencode.md
