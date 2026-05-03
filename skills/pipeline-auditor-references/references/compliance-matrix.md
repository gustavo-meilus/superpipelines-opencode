# Compliance Matrix — Auditor Reference

20-criterion checklist `pipeline-auditor` applies to every agent or pipeline file. Each criterion: PASS / FAIL / PARTIAL / N/A with cited evidence.

## Table of contents

1. Frontmatter criteria (1–6)
2. Body structure criteria (7–12)
3. Pipeline conformance criteria (13–17)
4. Cache & performance criteria (18–20)

---

## 1. Frontmatter criteria

| # | Criterion | PASS condition |
|---|-----------|----------------|
| 1 | `name` valid | Lowercase + hyphens only, ≤64 chars, matches filename |
| 2 | `description` triggering-only | Third person, ≤1024 chars, NO workflow summary, NO first/second person |
| 3 | `model` Sonnet-only | `model: sonnet` for all pipeline agents |
| 4 | `effort` set | One of `low / medium / high / xhigh / max` |
| 5 | `maxTurns` bounded | Integer; reasonable for agent role |
| 6 | `version` declared | `version: "X.Y"` present, semver-style |

## 2. Body structure criteria

| # | Criterion | PASS condition |
|---|-----------|----------------|
| 7 | Body ≤150 lines (agent) or ≤500 lines (skill) | Counted from end of frontmatter `---` to EOF |
| 8 | Capability contract present (agents) | "# Inputs required" + "# Output schema" near top |
| 9 | Single goal stated | First 3 lines declare one clear purpose |
| 10 | Output format defined | Explicit schema or structured-output instruction |
| 11 | Self-verification step | Self-check before reporting `DONE` |
| 12 | Long sections in references | Body delegates depth to companion `<agent>-references/` |

## 3. Pipeline conformance criteria

| # | Criterion | PASS condition |
|---|-----------|----------------|
| 13 | No `permissionMode` | Field absent from frontmatter |
| 14 | No `memory: project` / `memory: local` | Field absent |
| 15 | `skills:` preloads only `sk-*` | No workflow skills, no companion-references skills |
| 16 | Status protocol declared | Body emits one of `DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED` |
| 17 | Write/review isolation honored (reviewer agents) | `disallowedTools: Write, Edit` on reviewers |

## 4. Cache & performance criteria

| # | Criterion | PASS condition |
|---|-----------|----------------|
| 18 | No dynamic timestamps in static prefix | Body doesn't inject `date`, run IDs, or session-specific data |
| 19 | Tools minimal allowlist | No tool listed that the agent never invokes |
| 20 | Path variables used | `${CLAUDE_PLUGIN_ROOT}` for plugin paths; never `~/.claude/...` or absolute |

---

## How to use

For each file under audit:

1. Read the file with `Read`.
2. Walk the matrix top to bottom. Mark each criterion PASS / FAIL / PARTIAL / N/A.
3. For FAIL/PARTIAL, cite specific line number and evidence.
4. Compute severity per `severity-classification.md`.
5. Emit audit report per `audit-report-template.md`.

Mark PARTIAL when a criterion is half-met (e.g., description has triggering conditions AND a workflow summary). Do not guess.
