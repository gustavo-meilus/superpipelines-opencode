# Embedding the 4D Method in Authored Skills

When and how to wire the Deconstruct -> Diagnose -> Develop -> Deliver processing framework into a skill you are authoring. Reference: `sk-4d-method` skill.

## When to Embed

Embed 4D when the authored skill will encounter:

- **Ambiguous user input** — rough prompts, missing slots (audience, format, goal, scope).
- **Creative craft** — copywriting, design review, naming, narrative output where tone and structure are negotiated.
- **Multi-stakeholder requests** — competing constraints, multiple deliverables bundled in one prompt.
- **High-stakes one-shots** — the skill runs once and the output is final (reports, specs, campaigns).

Skip 4D for deterministic pipelines, single-line transforms, and fixed-format output (see Anti-pattern below).

## Two Embedding Strategies

### Strategy A: Inline 4D block in SKILL.md body

Copy the `<!-- BEGIN: 4D METHOD INSTRUCTIONS -->` ... `<!-- END -->` block from `~/.claude/skills/sk-4d-method/SKILL.md` directly under the skill's frontmatter. Use when:

- The skill is user-invocable and stands alone (no orchestrator to preload).
- 4D is integral to the skill's contract (not optional).
- Token budget permits (~1,200 words).

### Strategy B: Cross-reference + agent preload

Leave a one-line pointer in SKILL.md (`Apply the 4D processing loop from sk-4d-method before generating output.`) and preload `sk-4d-method` via the parent agent's `skills:` frontmatter. Use when:

- Multiple skills share the 4D loop (avoid duplication).
- The agent already preloads shared method skills.
- SKILL.md body budget is tight.

## Embedding-in-SKILL.md Checklist

When embedding inline, the SKILL.md body MUST contain:

- [ ] **Mandatory DECONSTRUCT gate** — pause-and-ask rule when >=3 critical slots are missing (audience, format, goal, scope, constraints).
- [ ] **DIAGNOSE failure-mode list** — skill-specific top 2-3 risks (e.g., "generic output", "wrong tone", "missing CTA").
- [ ] **DEVELOP tactic table** — task-type -> strategy rows calibrated to this skill's domain.
- [ ] **DELIVER format spec** — exact output structure (headings, bullet count, length, next-step block).
- [ ] **Quick Reference Card** — the four-row table mapping phase -> question -> key action.

## Iteration Routing Map

Include this routing rule so feedback re-enters the loop at the right phase:

| User feedback signals... | Re-enter at |
| :--- | :--- |
| "Not what I meant" / intent drift | re-**Deconstruct** |
| "Too vague" / "wrong angle" | re-**Diagnose** |
| "Change the approach / structure" | re-**Develop** |
| "Fix the formatting / polish" | re-**Deliver** |

## Anti-pattern: 4D in Trivial Skills

Do NOT embed 4D when the skill is:

- **Single-line ops** — commit message generator, timezone converter, regex escaper.
- **Fixed-format output** — schema validators, linters, strict template fillers.
- **Deterministic transforms** — CSV->JSON, markdown->HTML, file renamers.

For these, the 4D loop is pure overhead. The skill's contract already pins intent, format, and success criteria — there is nothing to deconstruct. Embedding it yields verbose mental-passes for no quality gain and bloats the SKILL.md body past the 500-line ceiling.

Signal: if the skill's output is fully determined by the input (no subjective calibration), skip 4D.
