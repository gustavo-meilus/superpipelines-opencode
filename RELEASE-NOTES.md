# Release Notes

## v1.0.8 — (2026-05-06)

Patch release fixing the **"Package has no TUI target to load in this app"** error.

OpenCode plugins require two entry points: a **server** module (`.`) and a **TUI** module (`./tui`). The initial v1.0.0 release only exported the server module, causing the TUI loader to fail silently and the plugin to not activate.

### What Changed

- Added `src/tui.ts` — the TUI plugin entry point that registers slash commands and toast notifications.
- Restructured `src/index.ts` — now exports a `PluginModule` (`{ id: "superpipelines", server }`) instead of a bare `Plugin` function.
- Updated `package.json` — added `"./tui"` subpath export and updated build to compile both entry points.

## v1.0.0 — OpenCode Migration (2026-05-05)

Welcome to the initial release of **Superpipelines OpenCode** (`superpipelines-opencode` v1.0.0).

This repository is a dedicated, fully autonomous fork of the original [Superpipelines](https://github.com/gustavo-meilus/superpipelines) framework (v1.0.4), completely re-architected to run natively as an OpenCode plugin.

### Key Architectural Shifts

#### 1. Native TypeScript Plugin
Superpipelines is no longer a collection of static markdown files distributed via symlinks. It is now a compiled TypeScript module utilizing the official `@opencode-ai/plugin` SDK. It exports a compliant `PluginModule` structure, matching top-tier OpenCode plugins (e.g., `oh-my-openagent`).

#### 2. Dynamic Tool Registration
Users no longer need to manually copy `agents/` and `skills/` directories into their workspace. By simply adding the plugin URL or local path to `opencode.json`, the plugin automatically intercepts OpenCode's configuration lifecycle to dynamically register the bundled skills and agents.

#### 3. Optimized Context Injection
Following best practices, the plugin safely injects the core `using-superpipelines` orchestration documentation directly into the first user message using the `experimental.chat.messages.transform` hook. This guarantees strict compliance without suffering from system-prompt token bloat on every subsequent execution turn.

#### 4. Environment Standardization
All agents, scripts, and skills have been rigorously audited. Legacy references, paths (`.claude/`), ignore files (`.claudeignore`), and incompatible model aliases have been replaced with their OpenCode equivalents.

---
*For a complete list of historical features carried over from the original framework (including Spec-Driven Development, Write/Review Isolation, and the 4D Intake method), please reference the [README.md](./README.md).*
