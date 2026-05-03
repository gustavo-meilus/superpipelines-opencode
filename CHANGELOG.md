# Changelog

## 1.0.0 — Initial release

Superpipelines is a fresh plugin built from the ground up to design and run multi-agent AI pipelines following `docs/AI_PIPELINES_LLM.md`.

### Added

- Plugin manifest (`superpipelines` namespace) and marketplace entry.
- Bootstrap skill `using-superpipelines` loaded via SessionStart on Claude Code and Cursor; per-harness bootstrap files for Codex (`AGENTS.md`), Gemini (`GEMINI.md`), and OpenCode (`.opencode/INSTALL.md`).
- Shared method skills (preloaded by orchestrator agents): `sk-4d-method`, `sk-spec-driven-development`, `sk-claude-code-conventions`, `sk-pipeline-patterns`, `sk-pipeline-state`, `sk-worktree-safety`, `sk-write-review-isolation`, `sk-rationalization-resistance`.
- User-invocable workflow skills: `creating-a-pipeline`, `running-a-pipeline`.
- Subagents: `pipeline-architect`, `pipeline-auditor`, `skill-architect`, `pipeline-task-executor`, `pipeline-spec-reviewer`, `pipeline-quality-reviewer`, `pipeline-failure-analyzer`.
- Companion reference libraries (no `SKILL.md`, read on demand): `pipeline-architect-references/`, `pipeline-auditor-references/`, `skill-architect-references/`, `pipeline-runner-references/`.
- Slash commands: `/superpipelines:new-pipeline`, `/superpipelines:run-pipeline`, `/superpipelines:audit-pipeline`, `/superpipelines:new-agent`, `/superpipelines:new-skill`.
- Settings: `autoMemoryEnabled: false`, `Bash(*)` permission, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` env.
- Curated kept legacy skills: `brainstorming`, `finishing-a-development-branch`, `test-driven-development`, `systematic-debugging`, `verification-before-completion` — rescoped for pipeline use.

### Removed

Legacy Superpowers skills and components superseded by pipeline-specific equivalents (see `docs/migration-from-superpowers.md` if present).
