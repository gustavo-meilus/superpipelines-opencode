# Axiomius Anti-Patterns

## 1. Sub-agents spawning sub-agents

**Why:** `SUB_AGENT_SPAWNING: FALSE`. Only the parent session, a skill, or a lead agent orchestrates. Nested spawning breaks isolation and explodes token cost.
**Fix:** orchestrate from a skill (`/pipeline-name`) or a lead agent (`claude --agent`). Subagents are leaves.

## 2. `memory: project` / `memory: local`

**Why:** disallowed by the canonical rules. State should live in structured artifacts the pipeline can reason about.
**Fix:** use `tmp/pipeline-state.json` bounded to a tmp directory. Machine-readable, diffable, explicit.

## 3. Hardcoded paths in agent bodies

**Why:** agents become non-portable and break when moved. Breaks `PATH_VARIABLE_PROTOCOL`.
**Fix:** orchestrator defines `{OUT}` and `{REF}` as absolute env vars; agents receive them via spawn prompt substitution.

## 4. Tool churn mid-session

**Why:** adding/removing tools invalidates the entire cache prefix. Low cache-hit rate is a SEV.
**Fix:** stable tool list for the session. Use mode-switching tools (`EnterPlanMode`) or `defer_loading`, not tool set mutation.

## 5. Dynamic timestamps in static prompts

**Why:** shatters prefix matching; cache never hits.
**Fix:** keep timestamps dynamic-only (dynamic-last block). Use version tags, not "as of today".

## 6. Regenerating instead of editing

**Why:** `Write` on an existing agent file wipes history, invalidates caches downstream, and rewrites text the model could patch.
**Fix:** prefer `Edit` for targeted changes. Read the file, identify the minimal diff, apply.

## 7. Monolithic agents >150 lines

**Why:** bodies that long cannot be reasoned about efficiently and usually bundle multiple responsibilities.
**Fix:** split by responsibility; extract deep reference material to a companion `{agent}-references/` skill.

## 8. Deep-nested references

**Why:** refs that link to refs that link to more files → partial reads, lost track.
**Fix:** keep refs one level deep from SKILL.md. If structure is genuinely hierarchical, flatten with prefixes.

## 9. Vague descriptions ("helps with code")

**Why:** routing contracts that cannot be matched. The skill/agent is never invoked.
**Fix:** `<what it does>. <when to use it>.` Pattern. Include trigger nouns/verbs users would naturally say.

## 10. First/second person in descriptions

**Why:** Anthropic Open Standard is third person only. Mixed POV breaks discovery.
**Fix:** "Processes X…" not "I can process…" or "You can use…".

## 11. Skills list mutation

**Why:** changing `skills:` mid-session invalidates cache exactly like tool churn.
**Fix:** fix the skills list at agent creation time. If content differs per scenario, split into distinct agents.

## 12. Parallel tool calls skipped

**Why:** independent tool calls issued sequentially waste turns and latency.
**Fix:** batch all independent calls into one message. Tools with data dependencies stay sequential.

## 13. Forgetting `effort:` field

**Why:** default effort may not match the agent's role; architect agents underperform at default.
**Fix:** set explicitly — `high` for architect/auditor, `medium` for worker, `low` for triage.

## 14. Stacking operations in a single model call

**Why:** asking one turn to plan + implement + verify yields worst-of-all-worlds: shallow plan, sloppy implementation, skipped verification.
**Fix:** one operation per turn. RPI across turns, not within one.

## 15. Writer self-reviews

**Why:** the writer rationalizes its own output; it cannot see what it normalized away.
**Fix:** distinct reviewer instance with read-only tools and its own description.

## 16. Silent failures

**Why:** an agent reports success without verifying. Downstream agents inherit broken assumptions.
**Fix:** embed a verification step before any final output; fail loudly with diagnostic info.

## 17. Tool sprawl

**Why:** too many overlapping tools; the model cannot pick reliably.
**Fix:** minimal allowlist. Read-only agents: no `Write`/`Edit`. Research agents: no `Bash`.

## 18. Leaky context

**Why:** an agent body referencing `CLAUDE.md` or parent conversation couples it to a specific environment; it breaks when reused.
**Fix:** agent body is self-contained. Inputs come via the spawn prompt and declared tools; nothing implicit.

## 19. Preloading a companion-references skill

**Why:** bloats startup; reference material is consulted occasionally, not always.
**Fix:** companion `{agent}-references` skill is read on demand via `Read`. NEVER preload in `skills:`.

## 20. Unbounded iterative loops

**Why:** Pattern 3 without `MAX_ITERATIONS` can consume unlimited turns on a non-convergent bug.
**Fix:** every loop is bounded. Track progress metric (failures remaining, diffs shrinking); abort if metric plateaus.

## 21. Destructive action before the human gate

**Why:** gating AFTER the mutation defeats the gate.
**Fix:** gate BEFORE. Pattern: `Analyze -> GATE -> Mutate`.

## 22. Hardcoded retired model IDs

**Why:** model IDs retire; hardcoded IDs break silently.
**Fix:** use `model: sonnet` in pipelines. Scale via `effort`, not model swap. Current IDs live in `sk-claude-code-conventions`.

## Cross-references

- `verification-patterns.md` — the positive version of items 15/16.
- `claude-4-6-features.md` — the cache rules behind items 4/5/11.
- `ai-pipelines-integration.md` — canonical strict conventions.
