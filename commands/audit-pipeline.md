---
description: Audit pipeline definitions, agent files, or skills against AI_PIPELINES_LLM.md conventions (severity-classified report)
argument-hint: [path | glob]
---

# /superpipelines:audit-pipeline

Dispatch the `pipeline-auditor` subagent (Claude Code) or role-play it (Tier 2/3) on the target.

Target: $ARGUMENTS (defaults to `agents/*.md` and `skills/**/SKILL.md` if empty)

The auditor will:

1. Locate and classify each target file (subagent / skill / reference / orchestration).
2. Apply the 20-criterion compliance matrix (frontmatter / body / pipeline conformance / cache).
3. Classify findings by severity (SEV-0 / SEV-1 / SEV-2 / SEV-3) per `pipeline-auditor-references/severity-classification.md`.
4. Emit a structured audit report per `audit-report-template.md` with cited file:line evidence and proposed fixes.

Read-only by default. To apply fixes, ask explicitly after reviewing the report — the auditor will hand off to `pipeline-architect`.
