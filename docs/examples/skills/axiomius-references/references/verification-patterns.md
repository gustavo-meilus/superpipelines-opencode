# Verification Patterns

> **Core axiom:** Code generation is commoditized. Verification is the differentiator. Every agent must verify its own output; every task must ship with an executable success criterion.

## 1. Write/Review isolation

The agent that writes an artifact NEVER reviews it. Writer and reviewer are distinct instances with:
- Different names, different descriptions (different routing contracts).
- Different tools: writer has `Write`/`Edit`; reviewer is read-only (`Read`, `Grep`, `Glob`, possibly `Bash`).
- Different system prompts and effort levels.
- Reviewer receives the artifact path, not the writer's context.

Rationale: a writer rationalizes its own output; a fresh reviewer catches what the writer normalized away.

## 2. Phase isolation in iterative loops

Pattern 3 (`Tester -> Analyzer -> Healer -> RESTART`) requires three distinct instances. Never collapse phases into one agent:

| Phase | Role | Tools |
| :--- | :--- | :--- |
| Tester | Run tests, capture failure output. | `Bash`, `Read` |
| Analyzer | Diagnose root cause from test output. | `Read`, `Grep`, `Glob` (no Write) |
| Healer | Apply targeted fix based on diagnosis. | `Write`, `Edit`, `Read` |

Each phase gets a pristine context; loops are bounded by `MAX_ITERATIONS`.

## 3. Automated success criteria per task

Every task in `tasks.md` carries an acceptance criterion expressed as an executable command whose exit code or output matches a pass/fail predicate. Examples:

| Task | Acceptance criterion |
| :--- | :--- |
| Add TypeScript strictness | `npx tsc --noEmit` exits 0 |
| Fix lint violations | `npm run lint` exits 0 with zero warnings |
| Unit test for new function | `npx jest path/to/test.ts` passes |
| Schema migration safe | `npm run db:check` reports no destructive ops |
| No TODO left | `grep -rn "TODO(me)" src/ | wc -l` returns 0 |

If a criterion cannot be expressed as a command, rewrite the task until it can.

## 4. Self-verification in every agent

Every agent's workflow ends with a verification step BEFORE the final deliverable. Examples:

- Code-generating agent: run `tsc`, `lint`, `test` on the modified files; abort or revise on failure.
- Spec-writing agent: grep its own `spec.md` for placeholder tokens (`TBD`, `TODO`, `?`) and fail the turn if found.
- Reviewer: confirm it read every referenced file (record paths in its output).

## 5. Feedback loops

When verification fails, route feedback to the correct phase, not to the last-touched agent:

- Vague spec → re-enter DECONSTRUCT / DIAGNOSE.
- Wrong approach → re-enter DEVELOP / re-plan.
- Bad code → Healer in Pattern 3.
- Format/polish → Deliver phase only.

## 6. Quality gates by pattern

| Pattern | Gate |
| :--- | :--- |
| Sequential | Each agent verifies its own artifact before handoff. |
| Parallel Fan-Out | Merger validates all expected artifacts exist before merging. |
| Parallel with QA | QA instance runs in parallel with writers; blocks merge on any fail. |
| Iterative Loop | Tester is the gate; bounded by MAX_ITERATIONS. |
| Human-Gated | `AskUserQuestion` gate before the destructive step. |
| SDD | `/analyze` BLOCKS `/implement` on missing acceptance criteria. |

## Cross-references

- `topology-patterns.md` — where gates slot into each pattern.
- `anti-patterns.md` — "silent failures", "writer self-reviews".
- `spec-driven-development.md` — `/analyze` block semantics.
