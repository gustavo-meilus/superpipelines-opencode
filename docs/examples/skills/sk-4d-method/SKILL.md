---
name: sk-4d-method
description: "Reference template for embedding the 4D Method (Deconstruct→Diagnose→Develop→Deliver) into SKILL.md files. Use when authoring or iterating on a skill that needs structured request processing."
user-invocable: false
---

# 4D Method — Skill Execution Instructions

> **Purpose:** Embed these instructions inside a Claude Skill's `SKILL.md` body (after the YAML frontmatter) to force Claude to apply the **4D Method** every time it processes a user input through the skill.
>
> **The 4D Method:** Deconstruct → Diagnose → Develop → Deliver
>
> **Compatibility:** Claude 4.x models (Opus 4.6, Sonnet 4.6, Haiku 4.5), Claude Code, Claude.ai, and API — updated April 2026. Follows the Agent Skills Open Standard frontmatter format.
>
> **Related skills:** `sk-spec-driven-development` (multi-step workflow), `sk-claude-code-conventions` (Claude 4.6 feature reference). Together, these three form the shared method-reference set preloaded by orchestrator agents.

---

## How to Use This Document

Copy the block below (between the `<!-- BEGIN -->` and `<!-- END -->` markers) directly into your `SKILL.md` file's instruction body, beneath any existing skill-specific steps you already have. It works as a **processing wrapper** — it intercepts the raw user request, runs it through four structured phases, and only then produces the final output.

You can also paste it into a Project's custom instructions, a `CLAUDE.md` file, or a system prompt if you want the 4D Method applied globally rather than per-skill.

---

<!-- BEGIN: 4D METHOD INSTRUCTIONS — PASTE INTO YOUR SKILL -->

## Mandatory Processing Framework: The 4D Method

After receiving any user input that triggers this skill, you MUST process the request through all four phases below **before** generating your final response. Do not skip phases. Do not combine phases. Work through them in order, using the internal structure they provide.

Think of the 4D Method as your input UX layer: what the user feeds in shapes what comes out, and your job is to refine that input into a precise, high-quality deliverable.

---

### Phase 1: DECONSTRUCT — Strip It Down

**Goal:** Never assume you understood the request on first read. Every rough prompt hides implicit intent, unstated entities, and missing structure.

Before doing anything else, internally decompose the user's message into its component parts:

1. **Identify the core intent.** What is the user actually trying to accomplish? Separate the *goal* from the *output format* — they are not always the same thing.
2. **Extract all explicit entities.** List every noun, constraint, audience, platform, product, or proper name the user mentioned.
3. **Surface implicit assumptions.** What did the user *not* say that you'd need to know? Common gaps include: target audience, tone, length, platform/format, success criteria, and scope boundaries.
4. **Map intent to output.** Restate the request as a clear, unambiguous task definition with all blanks filled in — either from context or by flagging them for the user.

**Decision point:** If three or more critical elements are missing (audience, format, goal, constraints, scope), pause and ask the user 3–5 targeted clarification questions before proceeding. Frame these as options, not open-ended questions. If you can reasonably infer the missing elements from context, state your assumptions explicitly and proceed.

> **Example of Deconstruct in action:**
>
> *User says:* "Write me something for our next campaign"
>
> *Deconstructed:* Intent = marketing copy. Missing = platform (LinkedIn? Email? Ad?), tone (formal? conversational?), product/service being promoted, target audience, goal (awareness? signups? engagement?), length.
>
> *Refined task:* "Write a short-form LinkedIn post for a B2B AI product launch. Audience: product leads at mid-size tech firms. Goal: drive waitlist signups."

---

### Phase 2: DIAGNOSE — Break What's Vague

**Goal:** Deconstructing reveals gaps. Diagnosing reveals where those gaps would cause the output to fail, hallucinate, or miss the mark downstream.

Examine your deconstructed task definition and stress-test it:

1. **Flag subjective terms.** Words like "compelling," "better," "good," "professional," or "clean" are ambiguous. Replace each one with a concrete, measurable specification. "Compelling" → "uses a pain-point → solution → outcome arc in three paragraphs." "Professional" → "formal tone, no contractions, structured with headers."
2. **Identify overloaded requests.** Is the user asking for one thing or several things bundled together? If the request contains multiple deliverables, separate them into a numbered list of distinct sub-tasks.
3. **Check for conflicting constraints.** Does the user want something "short but comprehensive"? "Casual but authoritative"? Name the tension and resolve it — either by asking the user to prioritize, or by making a reasoned tradeoff and stating it.
4. **Anticipate failure modes.** Where is this output most likely to go wrong? Too generic? Too long? Wrong format? Missing a key section? Identify the top 2–3 risks and build guardrails into your approach.

> **Example of Diagnose in action:**
>
> *User says:* "Help me explain our new tool in a compelling way"
>
> *Diagnosed:* "Compelling" is subjective — no structure, length, or angle specified. Risk: output will be generic marketing fluff. Fix: impose a structure (pain-point → solution → outcome), set length (3 paragraphs), and specify tone (plain, confident language).

---

### Phase 3: DEVELOP — Choose the Right Tactics

**Goal:** Structure becomes craft. Stop writing outputs "generically" and start designing them based on task type + output logic + model strengths.

Select and combine the appropriate techniques based on what the task demands:

1. **Match task type to strategy.**
   - **Creative tasks** → need tone cues, style references, audience empathy, and exemplar patterns.
   - **Technical tasks** → need constraint logic, schema definitions, validation rules, and precision language.
   - **Analytical tasks** → need structured reasoning, evidence requirements, and explicit chain-of-thought.
   - **Multi-step tasks** → need decomposition into stages, with clear handoffs and intermediate checkpoints.

2. **Assign a role if it sharpens output.** When domain expertise matters, adopt a specific persona (e.g., "You are a senior UX researcher reviewing an onboarding flow"). The role should influence your vocabulary, evaluation criteria, and depth — not just your greeting.

3. **Define output format precisely.** Specify headings, bullet count, paragraph count, code block language, table structure, or whatever format best serves the task. Output format is not decoration — it's architecture.

4. **Layer constraints strategically.** Stack the most important constraints first. Claude processes instructions with a recency and primacy bias — put critical rules at the beginning and end, not buried in the middle.

> **Example of Develop in action:**
>
> *Task:* Review an AI onboarding flow for usability risks.
>
> *Developed:* Role = UX lead. Strategy = heuristic evaluation against Nielsen's 10 usability heuristics. Format = 3 identified risks, each with heading, description, severity rating, and recommended fix. Constraint = use plain language accessible to non-designers.

---

### Phase 4: DELIVER — Format the Ask, Guide the Output

**Goal:** A well-designed response can still fail if it's messy, unstructured, or ignores the user's actual environment. Delivery is the final quality gate.

Before generating your final output:

1. **Organize for scannability.** Lead with the most important information. Use the inverted pyramid: conclusion first, supporting detail second, context third.
2. **Match the user's context.** Are they in a quick Slack exchange? Keep it tight. Writing a formal report? Use full structure. Coding? Provide runnable snippets, not pseudocode. Adapt your delivery to the medium.
3. **Include actionable next steps.** Don't end with a summary — end with what the user should *do next*. Every deliverable should point forward.
4. **Self-review before sending.** Mentally check: Does this answer the actual question (not a related one)? Is everything accurate? Is anything unnecessary? Would the user need to ask a follow-up to use this?

> **Example of Deliver in action:**
>
> *Final output structure for a growth marketing task:*
>
> "You are a Growth Marketing AI assistant. Summarize the following product brief in 5 bullets, then suggest 2 retention-focused ideas for increasing recurring users. Use proper Markdown. End with a recommended A/B test for the top idea."

---

## Behavioral Rules

When applying the 4D Method inside this skill:

- **Always run all four phases internally.** You do not need to show the user your Deconstruct/Diagnose/Develop reasoning unless they ask you to "show your work" or "explain your thinking." By default, only deliver the Phase 4 output.
- **If the user says "show 4D" or "walk me through it,"** then present each phase's output as a labeled section before the final deliverable.
- **If the task is trivially simple** (e.g., "What time is it in Tokyo?"), you may compress the 4D process into a single mental pass. Do not over-engineer simple requests. The 4D Method exists to improve complex, ambiguous, or high-stakes outputs.
- **Iterate when prompted.** If the user gives feedback, re-enter the 4D loop at the appropriate phase. Feedback about *what they wanted* → re-Deconstruct. Feedback about *vague/wrong parts* → re-Diagnose. Feedback about *approach or structure* → re-Develop. Feedback about *formatting or polish* → re-Deliver.

---

## Quick Reference Card

| Phase | Question It Answers | Key Action |
|-------|-------------------|------------|
| **Deconstruct** | "What is actually being asked?" | Separate intent from output; surface missing info |
| **Diagnose** | "Where will this break?" | Replace vague terms; resolve conflicts; anticipate failures |
| **Develop** | "What's the best approach?" | Match task type to strategy; assign role; define format |
| **Deliver** | "Is this ready for the user?" | Organize for scannability; match context; add next steps |

<!-- END: 4D METHOD INSTRUCTIONS -->

---

## Example: Embedding in a SKILL.md

Here is a minimal example showing how the 4D instructions integrate into a complete skill file:

```markdown
---
name: campaign-writer
description: >
  Write marketing campaign copy across platforms. Use when user asks to
  draft campaign content, ad copy, social posts, email sequences, or
  any marketing-related writing. Triggers on "campaign", "ad copy",
  "marketing copy", "social post", "email blast".
---

# Campaign Writer Skill

## Mandatory Processing Framework: The 4D Method

[... paste the full 4D instructions from above here ...]

## Skill-Specific Instructions

After completing the 4D processing loop, apply these additional rules:

- Always confirm the target platform before writing (LinkedIn, Instagram, Email, etc.)
- Default to a conversational-professional tone unless told otherwise
- Include a suggested CTA (call-to-action) in every piece of copy
- For email sequences, number each email and note the send timing
```

---

## Version & Compatibility Notes

| Detail | Value |
|--------|-------|
| **Created** | March 2026 |
| **Target models** | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 |
| **Skill format** | Agent Skills Open Standard (SKILL.md with YAML frontmatter) |
| **Works in** | Claude.ai, Claude Code, Claude API, Claude Desktop |
| **Skill upload** | Settings → Capabilities → Skills (shipped Dec 2025) |
| **Org deployment** | Admin workspace-wide skill deployment (shipped Dec 18, 2025) |

> **Note on token budget:** The full 4D instruction block is approximately 1,200 words. Claude Code allocates ~2% of the context window (fallback 16,000 chars) for skill metadata. The 4D block fits comfortably within this budget, but if your skill has extensive additional instructions, consider moving reference material to a `references/` subdirectory to keep `SKILL.md` lean.