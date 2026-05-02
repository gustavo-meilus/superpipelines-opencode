# The 6-Phase Praxis Protocol

The 6-phase skill engineering process applied to every request.

## Phase 1: DISCOVER

**Understand the skill's mission, audience, and constraints.**

1. Identify the skill's **Single Capability** -- the one specific task or workflow it teaches. A skill that does two things should be two skills.
2. Map the **knowledge gap**: What does the agent need to know that it doesn't already? Challenge every piece of information -- if the model can reliably infer it, omit it.
3. Define **trigger scenarios**: When should this skill activate? What keywords, file types, task descriptions, or user intents signal its relevance? Think about both obvious triggers and edge-case near-misses where the skill should or should not fire.
4. Identify the **target environment**: What model(s) will consume this skill? What platform (IDE, API, chat interface, agent framework)? What scope (personal, project, team, organization)?
5. Determine the **freedom level**: Does this task demand exact reproduction (low freedom), guided patterns (medium), or principled flexibility (high)?
6. Inventory **dependencies**: What tools, scripts, APIs, libraries, or external files does this skill require?
7. **Extract from context**: If the conversation already contains a workflow the user wants to capture, extract answers from the history -- tools used, sequence of steps, corrections made, input/output formats observed. Confirm with the user before proceeding.

## Phase 2: DIAGNOSE

**Audit for structural weaknesses before writing.**

1. **Scope Creep Check**: Does the skill attempt more than one capability? Split if necessary.
2. **Ambiguity Audit**: Eliminate vague qualifiers. Replace "short summary" with "2-3 sentences". Replace "follow best practices" with the specific practices. Replace "appropriately" with a concrete rule.
3. **Token Budget Estimation**: Estimate the skill's token footprint. Core instructions should fit within 500 lines. If exceeding, apply progressive disclosure -- move reference material to linked files.
4. **Discoverability Test**: Read the description in isolation. Can you determine exactly WHAT the skill does and WHEN to use it without reading the body? Would a model that tends to undertrigger still select this skill? If not, rewrite the description to be more assertive.
5. **Terminology Consistency Check**: Identify all domain terms. Choose one canonical term for each concept and enforce it throughout.
6. **Failure Mode Mapping**: For each critical step, define what happens on error. Include validation checkpoints for fragile operations.
7. **"Why" Audit**: For every instruction that uses imperative language (do X, never Y), check: is the reasoning behind it clear? If the model does not understand why, it will follow the letter but miss the spirit. Add reasoning where missing.

## Phase 3: DESIGN

**Select the right structural pattern before writing instructions.**

See [design-patterns.md](design-patterns.md) for the 7 available patterns (Template, Workflow, Conditional Workflow, Examples-Driven, Reference + Lookup, Validation Loop, Guardrails).

## Phase 4: DEVELOP

**Build the skill using the Universal Skill Architecture.**

See [skill-architecture.md](skill-architecture.md) for the 6-layer architecture (Metadata, Core Instructions, Output Specification, Validation & Error Handling, Reference Material, Supporting Assets).

## Phase 5: EVALUATE

**Test the skill with realistic prompts and iterate based on evidence.**

### Step 5.1: Draft Test Prompts

Create 2-5 realistic test prompts -- the kind of thing a real user would actually type. Not abstract requests, but concrete and specific with detail: file paths, personal context, column names, company names, casual speech, abbreviations, typos. A mix of lengths and complexity.

Present them to the user for approval: "Here are the test cases I'd like to try. Do these look right, or would you like to add more?"

### Step 5.2: Run Test Cases

Execute each test prompt with the skill active. If the environment supports parallel execution (subagents), run all test cases simultaneously. If not, run them sequentially.

Where possible, also run a **baseline** -- the same prompt without the skill -- to measure the skill's impact. If improving an existing skill, the baseline is the previous version.

### Step 5.3: Review Results

Present results to the user for qualitative review. For each test case, show the prompt and the output. Ask for specific feedback.

Read the agent's reasoning traces (not just final outputs) to identify where the skill caused the agent to waste time, take wrong paths, or ignore useful instructions. This reveals which parts of the skill are helping and which are noise.

### Step 5.4: Improve Based on Evidence

Apply improvements guided by these principles:

- **Generalize from feedback.** The user is iterating on a few examples because it is fast. But the skill will be used across thousands of different prompts. Every change must improve the general case, not just fix the test case. Resist fiddly, overfit patches.
- **Keep the skill lean.** If the reasoning traces show the agent wasting time on unproductive steps caused by the skill, remove or rewrite those sections. Less is often more.
- **Bundle repeated work.** If multiple test runs independently generated similar helper scripts or took the same multi-step approach, that is a strong signal the skill should bundle that script. Write it once, put it in `scripts/`, and instruct the skill to use it.
- **Explain the why.** Even if user feedback is terse, understand the underlying need and transmit that understanding into the instructions. A model that understands reasoning will handle novel cases better than one following rigid rules.
- **Try different approaches.** If a stubborn issue persists despite instruction changes, try restructuring the skill -- different metaphors, alternative patterns, reordered steps. The cost of experimentation is low; the cost of a stuck iteration loop is high.
- **Draft, then revise.** Write the improved version, then read it with fresh eyes and improve it again before presenting to the user.

### Step 5.5: Repeat or Converge

Rerun test cases with the improved skill. Continue iterating until:

- The user is satisfied with the outputs
- Feedback is consistently empty (no complaints)
- Improvements have plateaued

After convergence, consider expanding the test set to stress-test the skill against a wider range of inputs before finalizing.

## Phase 6: DELIVER

**Package, explain, and prepare for deployment.**

1. Deliver the complete skill with all files inside clearly labeled code blocks.
2. Provide an **Architect's Brief** covering:
   - Skill pattern chosen and why
   - Token budget breakdown (estimated)
   - Freedom level rationale
   - Key design decisions and trade-offs
   - Known limitations and suggested mitigations
3. If the skill includes multiple files, provide a **directory tree** showing the complete structure.
4. Suggest 3-5 **activation test scenarios** -- realistic prompts (with concrete detail) that should trigger the skill and verify correct behavior.
5. Suggest 2-3 **near-miss scenarios** -- prompts that share keywords with the skill but should NOT trigger it, to verify the description's precision.
6. Provide a **quality checklist** the user can run against the delivered skill.
7. Offer to run the **description optimization** process and/or the **evaluation loop** if the user wants to validate before deploying.
