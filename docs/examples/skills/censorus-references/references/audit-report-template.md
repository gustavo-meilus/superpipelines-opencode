# Audit Report Template

Every censorus audit emits exactly this structure. Keep findings dense, cite line numbers, propose concrete fixes.

## Output format

```
# Audit Report: {agent-name}

**Classification:** {standalone API / Claude Code sub-agent / orchestrator}
**Target model:** {sonnet | opus | haiku + ID}
**Line count:** {n} (cap: 150) — {PASS / FAIL}
**Estimated tokens:** {n} (budget: sub-agent <5K, API <2K, orchestrator <8K)
**Date:** {YYYY-MM-DD}

---

## Compliance matrix summary
| Result | Count |
|--------|-------|
| PASS | {n}/20 |
| PARTIAL | {n}/20 |
| FAIL | {n}/20 |
| N/A | {n}/20 |

See full matrix in `compliance-matrix.md` audit output.

---

## Critical findings (SEV-0) — BLOCK MERGE
1. **{Finding title}** — {location: file:line}.
   - Evidence: `{snippet}`
   - Violation: {which AI_PIPELINES rule / anti-pattern}
   - Fix: {concrete remediation + reference to fix-templates.md section}

## High (SEV-1) — Fix before merge
1. **{Title}** — {location}. {Fix.}

## Medium (SEV-2) — Should fix
1. **{Title}** — {location}. {Fix.}

## Low (SEV-3) — Nits
1. **{Title}** — {location}. {Fix.}

---

## Anti-patterns detected
| # | Pattern | Location | Fix |
|---|---------|----------|-----|
| 14 | Leaky Sub-Agent Context | L42 | Remove CLAUDE.md reference; inline context. |
| 18 | Token Waste | L88, L103 | Delete blank duplicate sections. |

---

## Top 3 strengths
1. {Strength with evidence + line ref}
2. {…}
3. {…}

---

## Recommended actions (ordered)
1. {Highest-impact fix first — cite fix-templates.md section}
2. {…}
3. {…}

---

## Apply fixes?
If the user asks to apply fixes: use `Edit` for targeted changes (1–3 issues), `Write`
for a full rewrite (>50% of prompt changes). Explain each change before editing.
```

## Rules for filling the template

- **Every finding cites a location.** Line number, line range, or quoted snippet. No vague "the prompt is too long".
- **Every finding names its severity.** Use `severity-classification.md` heuristics.
- **Every SEV-0/1 finding proposes a concrete fix.** Reference `fix-templates.md` by section number.
- **SEV-0 findings are listed first** and clearly marked BLOCK MERGE.
- **Strengths come after findings** — lead with problems, end with what to preserve.
- **Recommended actions are ordered by impact**, not severity — sometimes a SEV-2 structural fix unlocks multiple SEV-1 issues.
- **Do not apply fixes without being asked.** Present report first.
