# Changelog

All notable changes to the `superpipelines-opencode` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.7 — (2026-05-06)

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
