# Changelog

All notable changes to the `superpipelines-opencode` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.12 — (2026-05-07)

### Fixed
- **Agent `hidden` and `mode` Frontmatter Forwarding**: The plugin now reads and forwards `mode` and `hidden` properties from agent YAML frontmatter to the OpenCode agent config. Previously these fields were silently discarded by destructuring into `...rest`, causing subagents with `hidden: true` to still appear in `@` autocomplete.

## 1.0.11 — (2026-05-07)

### Added
- **Subagent Configuration Properties**: Added `mode: subagent` and `hidden: true` frontmatter to all seven pipeline subagents (`pipeline-architect`, `pipeline-auditor`, `pipeline-failure-analyzer`, `pipeline-quality-reviewer`, `pipeline-spec-reviewer`, `pipeline-task-executor`, `skill-architect`) to mark them as internal subagents hidden from `@` autocomplete.
- **Agent Frontmatter Schema**: Documented `mode` and `hidden` fields in the agent frontmatter schema reference and opencode conventions skill.

## 1.0.10 — (2026-05-06)

### Added
- **Enhanced Agent Loading with Scope Root Support**: Improved agent loading and configuration management to properly support scope root detection and agent file resolution across local, project, and user scopes.

### Changed
- **Default Model Update**: Updated default models to use `opencode/big-pickle` across all configuration files, including `.opencode/opencode.json`, `README.md`, `TESTING.md`, and source files.

## 1.0.9 — (2026-05-06)

### Added
- **Built-in Command Registration (`config.command`)**: The server plugin now auto-registers all built-in SuperPipelines commands (`superpipelines:new-pipeline`, `superpipelines:run-pipeline`, `superpipelines:new-step`, `superpipelines:update-step`, `superpipelines:delete-step`, `superpipelines:audit-pipeline`, `superpipelines:init-deep`) from `commands/*.md` files during the `config` lifecycle hook.
- **Dynamic Pipeline Command Discovery**: User-created pipelines under `.opencode/superpipelines/{P}/{P}.md` are automatically discovered and registered as `superpipelines:{P}` commands at config time, enabling direct execution via `/superpipelines:{P}`.
- **TUI Pipeline Command Discovery**: The TUI plugin now dynamically discovers pipeline commands from both project-level (`.opencode/superpipelines/`) and user-level (`~/.opencode/superpipelines/`) scope roots, displaying them as "Run: {P}" entries in the slash command palette.
- **Manual Testing Guide (`TESTING.md`)**: Comprehensive 372-line manual testing document covering build verification, type-checking, config hook validation, TUI plugin testing, bootstrap injection verification, CRLF regression testing, and end-to-end scenario tests.

### Changed
- **TUI Slash Command Format**: Standardized all built-in TUI slash commands to use full `superpipelines:*` names (e.g., `/superpipelines:new-pipeline`) instead of short aliases (`/sp:new`), improving consistency with the command registration system.
- **`creating-a-pipeline` Skill**: Updated Phase 5 to generate a per-pipeline run command file at `<scope-root>/superpipelines/{P}/{P}.md`, enabling direct pipeline execution. Updated user confirmation message to reference the new `/superpipelines:{P}` command.
- **`sk-pipeline-paths` Skill**: Added "Run Command" path template (`superpipelines/{P}/{P}.md`) to the canonical path reference table.

## 1.0.8 — (2026-05-06)

### Added
- **TUI Plugin Module (`src/tui.ts`)**: Added the `./tui` export required by OpenCode's plugin loader, resolving the "Package has no TUI target to load in this app" error. The TUI module registers slash commands (`/sp:new`, `/sp:run`, `/sp:add`, `/sp:update`, `/sp:delete`) and shows toast notifications on session idle/error events.
- **PluginModule Export Format**: Changed `src/index.ts` to export a `PluginModule` object (`{ id, server }`) instead of a raw `Plugin` function, matching the official `@opencode-ai/plugin` spec.

### Changed
- Updated `package.json` exports to include `"./tui"` subpath.
- Updated build script to compile both `src/index.ts` and `src/tui.ts`.

## 1.0.0 — Initial Release (2026-05-05)

### Added
- **Forked Release**: Officially forked from [superpipelines v1.0.4](https://github.com/gustavo-meilus/superpipelines), which was originally designed for Claude Code.
- **Native OpenCode TS Plugin**: Implemented a native TypeScript architecture (`src/index.ts`) utilizing the `@opencode-ai/plugin` SDK, replacing legacy bash hooks and static manifests.
- **Dynamic Context Injection**: Utilizes `experimental.chat.messages.transform` to safely inject the `using-superpipelines` skill context into the first user message, eliminating redundant token bloat.
- **Zero-Copy Config Registration**: Hooks into the OpenCode `config` lifecycle to dynamically register the bundled `skills/` and `agents/` directories without requiring the user to manually copy them into their workspace.
- **TUI Command Interception**: Native TUI interception for `/superpipelines:*` slash commands, seamlessly redirecting the user to natural language orchestration within OpenCode.
- **OpenCode Model Compatibility**: Fully migrated agent models to OpenCode ecosystem standards (e.g., `anthropic/claude-3-5-sonnet-20241022`).

### Changed
- Refactored `CLAUDE.md` to `OPENCODE.md` and comprehensively purged all Claude Code specific nomenclature.
- Migrated legacy `isolation: worktree` agent parameters to prompt-enforced isolation via the `sk-worktree-safety` skill.
- Replaced the `.claudeignore` with `.opencodeignore`.

### Removed
- Removed the `hooks/` directory and `.claude-plugin/` legacy infrastructure.
- Removed legacy `plugin.json` and `marketplace.json` manifests in favor of `package.json` driven OpenCode configuration.
