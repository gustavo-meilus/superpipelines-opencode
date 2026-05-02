# Topology Patterns (AI_PIPELINES_LLM.md, Patterns 1–6)

## Pattern 1 — Sequential Chain

**Shape:** `A -> writes(f_a) -> B(reads f_a) -> writes(f_b) -> C(reads f_b)`

**Use when:** phases strictly depend on upstream output; data transforms in series; each phase needs a clean context.

**Constraint:** disk-based handoffs. Orchestrator passes file paths; agents never receive pasted content.

**Anti-patterns:** merging phases into one agent "for efficiency"; passing file contents in spawn prompt; reusing a session across phases.

## Pattern 2 — Parallel Fan-Out / Merge

**Shape:** `[A, B, C] PARALLEL -> writes([f_a, f_b, f_c])` then `D(reads all) -> merged`.

**Use when:** independent analyses/reviews; multi-source enrichment; report assembly from parallel contributors.

**Constraint:** all parallel agents dispatched in a SINGLE message block. Merger has a distinct role and fresh context.

**Anti-patterns:** sequential dispatch pretending to be parallel; merger that also re-analyzes; shared mutable state between workers.

## Pattern 2b — Parallel with QA

**Shape:** `Phase 1: [QA(Phase_0), Worker_A, Worker_B] PARALLEL`; `Phase N: [QA(Out_A), QA(Out_B)] PARALLEL`.

**Use when:** quality gates must fan out over worker outputs; each output needs isolated verification.

**Constraint:** QA instance != writer instance. QA has read-only tools.

**Anti-patterns:** single QA serially purifying each output; writer self-reviewing; QA that can also edit.

## Pattern 3 — Iterative Loop

**Shape:** `Loop(MAX=N): Tester -> Analyzer -> Fixer -> RESTART`.

**Use when:** heal cycles, flaky test triage, convergent refactors where each pass reduces failures.

**Constraint:** MAX_ITERATIONS is mandatory. Bounded loops only. Tester, Analyzer, Fixer are distinct instances (phase isolation).

**Anti-patterns:** unbounded loops; same agent tests and fixes; no progress metric across iterations.

## Pattern 4 — Human-Gated

**Shape:** `Agent -> writes(output) -> GATE(AskUserQuestion) -> [APPROVE | REJECT | REVISE] -> (REVISE triggers re-invocation with feedback + original path)`.

**Use when:** destructive or irreversible actions (migrations, deletes, deploys); ambiguous user inputs needing triage; high-stakes outputs.

**Constraint:** gate appears BEFORE the mutation, not after. REVISE re-invokes with `prompt: "REVISION: {feedback} + read {original_files}"`.

**Anti-patterns:** gating after the destructive action; gate that accepts free-form text without structured options; swallowing REVISE feedback in a new context without the original artifact path.

## Pattern 5 — Spec-Driven Development

**Shape:** `/specify -> spec.md` → `/clarify` + `/plan -> plan.md` → `/tasks -> tasks.md` → `/analyze` → `/implement -> [RPI(T-1), RPI(T-2)] PARALLEL` → reconcile.

**Use when:** multi-step features, ambiguous user input, multi-stakeholder work, whenever a contract must precede execution.

**Constraint:** `/implement` BLOCKS if any acceptance criterion lacks a task. See `spec-driven-development.md`.

**Anti-patterns:** skipping `/clarify` on ambiguous specs; oversized tasks (>30 min of work); implement without acceptance criteria.

## Pattern 6 — 4D Processing Wrapper

**Shape:** per-invocation processing that runs INSIDE Patterns 1–5 on every agent turn. `DECONSTRUCT -> DIAGNOSE -> DEVELOP -> DELIVER`.

**Use when:** every non-trivial agent turn, especially creative/technical craft, ambiguous inputs, multi-stakeholder outputs.

**Constraint:** runs internally by default; surface only on explicit "show 4D" / "walk me through it". See `sk-4d-method`.

**Anti-patterns:** exposing 4D output by default; skipping phases for "simple" requests that are actually ambiguous; using 4D as a workflow instead of a wrapper.

## Cross-references

- `ai-pipelines-integration.md` — canonical rules.
- `verification-patterns.md` — quality gates inside each pattern.
- `spec-driven-development.md` — Pattern 5 deep-dive.
- `4d-method-integration.md` — Pattern 6 embedding.
