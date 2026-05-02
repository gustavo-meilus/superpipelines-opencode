# 4D Method Audit

Every non-trivial agent should apply the 4D per-invocation wrapper: **Deconstruct → Diagnose → Develop → Deliver**. Reference: `~/.claude/skills/sk-4d-method/SKILL.md` and AI_PIPELINES_LLM.md Pattern 6.

## Audit checklist

### A. 4D is preloaded or embedded

- [ ] Agent frontmatter includes `skills: [sk-4d-method, ...]` **OR** the 4D block is embedded inline in the agent body.
- [ ] If embedded inline, all four phases (Deconstruct / Diagnose / Develop / Deliver) are present and named.
- [ ] If preloaded, the agent body references the 4D phases by name at least once (so the agent actually invokes them).

**Failure:** `sk-4d-method` is neither preloaded nor embedded → **SEV-2** for single-step agents, **SEV-1** for ambiguous-input agents.

### B. Description mentions ambiguous-input handling

- [ ] Description or `when_to_use` signals that the agent handles ambiguous or underspecified requests (explicit "clarifies", "disambiguates", "structured processing", or similar).
- [ ] For auditor / architect / reviewer agents, the description implies structured processing (not just "runs checks").

**Failure:** Description reads like a simple tool call with no processing surface → **SEV-3** (suggest adding 4D trigger language).

### C. Iteration loop covers all four re-entry points

The agent body (or the skill it preloads) must define feedback routing:

- [ ] **Intent drift** (wrong task tackled) → re-**Deconstruct**.
- [ ] **Vague / wrong output** (terms unclear) → re-**Diagnose**.
- [ ] **Approach / structure mismatch** → re-**Develop**.
- [ ] **Polish / formatting feedback** → re-**Deliver**.

**Failure:** Iteration is a flat "re-run from the top" loop without phase-specific re-entry → **SEV-2**.

### D. Decision gate present

- [ ] Deconstruct phase has an explicit gate: if ≥ 3 critical slots (audience, format, goal, constraints, scope) are missing, the agent pauses and asks 3–5 targeted clarification questions before proceeding.

**Failure:** Agent barrels through missing context → **SEV-2**.

### E. Output suppression rule

- [ ] 4D reasoning is internal by default; the agent surfaces phase-by-phase trace ONLY when the user says "show 4D" / "walk me through it".
- [ ] Trivial requests (e.g. one-word lookups) are allowed to compress 4D into a single mental pass.

**Failure:** Agent always dumps its 4D trace to user → **SEV-3** (token waste).

## Common violations

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Agent answers wrong question | Missing Deconstruct phase | Preload `sk-4d-method`; add clarification gate. |
| Output is "generic" despite long prompt | No Diagnose phase (subjective terms unresolved) | Add Diagnose step that replaces "compelling"/"clean"/"professional" with measurable specs. |
| Output structure changes per invocation | No Develop phase (format not chosen) | Add explicit output-format selection in Develop step. |
| Output buried; lead missing | No Deliver phase | Add "lead with conclusion" rule; self-review gate. |
