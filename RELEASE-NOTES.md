# Release Notes

## v1.0.12 — (2026-05-07)

Patch release fixing **agent `hidden` and `mode` frontmatter properties not being forwarded** to the OpenCode agent configuration.

### What Changed

#### Bug Fix — Frontmatter Forwarding
The `loadAgentFile` function in `src/index.ts` was destructuring `mode` and `hidden` into a discard variable (`...rest`) instead of passing them through to the `agentConfig` object. This meant that `hidden: true` in agent frontmatter had no effect — subagents continued to appear in `@` autocomplete.

The fix adds `mode` and `hidden` to the destructured properties and conditionally forwards them to the agent configuration, making `hidden: true` work correctly.

## v1.0.11 — (2026-05-07)

Maintenance release adding **`mode` and `hidden` frontmatter properties** to all pipeline subagent definitions.

### What Changed

#### Subagent Configuration Properties
Added `mode: subagent` and `hidden: true` to the YAML frontmatter of all seven pipeline subagents. The `mode: subagent` property is required for `hidden` to take effect, and `hidden: true` removes these internal agents from the `@` autocomplete menu since they are only invoked programmatically via the Task tool.

#### Documentation
- Updated `skills/pipeline-architect-references/references/agent-frontmatter-schema.md` to document the new `mode` and `hidden` fields in the canonical frontmatter schema.
- Updated `skills/sk-opencode-code-conventions/SKILL.md` to include `mode` and `hidden` in the frontmatter template example.

## v1.0.10 — (2026-05-06)

Maintenance release with **enhanced agent loading** and **default model standardization**.

### What Changed

#### Enhanced Agent Loading with Scope Root Support
Improved agent loading and configuration management in `src/index.ts` to properly support scope root detection and agent file resolution across local, project, and user scopes. This ensures agents are correctly discovered and loaded regardless of where the pipeline is installed.

#### Default Model Update
Updated default models to use `opencode/big-pickle` across configuration files:
- `.opencode/opencode.json` — Plugin configuration
- `README.md` — Documentation examples
- `TESTING.md` — Manual testing guide
- `src/index.ts` — Source code defaults

This standardizes all agent model references to use the `opencode/big-pickle` model by default.

## v1.0.9 — (2026-05-06)

Feature release introducing **built-in command registration**, **dynamic pipeline discovery**, and a **comprehensive manual testing guide**.

### What Changed

#### Server Plugin — `config.command` Registration
The `config` lifecycle hook now auto-registers two categories of commands:

1. **Built-in commands** — All seven `commands/*.md` files are parsed and registered as `superpipelines:new-pipeline`, `superpipelines:run-pipeline`, `superpipelines:new-step`, `superpipelines:update-step`, `superpipelines:delete-step`, `superpipelines:audit-pipeline`, and `superpipelines:init-deep`.
2. **Dynamic pipeline commands** — Any user-created pipeline at `.opencode/superpipelines/{P}/{P}.md` or `~/.opencode/superpipelines/{P}/{P}.md` is automatically discovered and registered as `superpipelines:{P}`.

This means pipelines can now be executed directly via `/superpipelines:{P}` without going through the pipeline selection flow.

#### TUI Plugin — Dynamic Command Discovery
The TUI plugin now scans both project-level and user-level scope roots for pipeline directories and dynamically generates "Run: {P}" slash commands. Built-in commands have been standardized to use full `superpipelines:*` names (removing the `/sp:*` short aliases).

#### `creating-a-pipeline` Skill — Run Command Generation
Pipeline creation now produces a per-pipeline run command file at `<scope-root>/superpipelines/{P}/{P}.md`, enabling the direct execution pattern described above.

#### Documentation
Added `TESTING.md` — a 372-line manual testing guide covering build verification, type-checking, config hook validation, TUI testing, bootstrap injection, CRLF regression, and end-to-end scenarios.

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
