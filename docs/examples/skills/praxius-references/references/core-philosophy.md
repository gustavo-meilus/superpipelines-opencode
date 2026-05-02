# Praxius Core Philosophy

## 1. Skills are Cognitive Tools

A skill is a reusable, self-contained instruction module that an agent can discover, load, and execute on demand. Each skill encodes domain expertise the model does not inherently possess, packaged for reliable retrieval and application. A skill that works only for one specific example is worthless -- skills must generalize across the full range of prompts they will encounter.

## 2. Every Token Must Earn Its Place

Skills compete for context window space with conversation history, other skills, tool definitions, and retrieved documents. Verbosity is not thoroughness -- it is waste. The default assumption is that the agent is already intelligent. Only encode what it cannot infer. Periodically audit the skill and remove anything that is not pulling its weight.

## 3. Discoverability > Encyclopedic Coverage

A skill that is never triggered is worthless regardless of its quality. The skill's description -- its external contract -- is the most critical piece of text. It determines whether the skill is selected at all. Design the description first, then build the body to deliver on it. Current LLMs tend to **undertrigger** skills -- to not use them even when they would help. Descriptions must actively advocate for the skill's relevance.

## 4. Explain the Why, Not Just the What

Modern LLMs are smart. They have good theory of mind and, given proper reasoning, can go beyond rote instructions. Instead of heavy-handed MUSTs and NEVERs in all caps, explain *why* something matters. A model that understands the reasoning behind a constraint will apply it more flexibly and correctly than one following a rigid rule it does not comprehend. If you find yourself writing ALWAYS or NEVER in caps, treat it as a yellow flag -- reframe with reasoning first, and reserve hard constraints only for genuinely non-negotiable rules.

## 5. Progressive Disclosure > Monolithic Instructions

Front-load essential instructions. Defer reference material, edge cases, and deep documentation to linked resources the agent reads only when needed. Respect the context window by designing in layers.

## 6. Calibrated Precision > Vague Guidance

Match the specificity of instructions to the fragility of the task. Fragile operations (database migrations, form filling, compliance checks) demand exact scripts. Flexible tasks (code review, brainstorming, analysis) benefit from principles with examples. Never use vague qualifiers -- replace "briefly" with a word count, "appropriately" with a concrete rule.

## 7. Generalize, Don't Overfit

When iterating on a skill using test cases, resist the temptation to add fiddly, overly specific fixes that only address the test examples. Every change should make the skill better across the full universe of prompts it will encounter. If a stubborn issue persists, try different metaphors, alternative patterns, or restructured reasoning rather than piling on constraints. Think of test cases as a lens for observing behavior -- not as the behavior itself.

## 8. Iterate With Evidence, Not Intuition

Draft -> Test -> Review -> Improve -> Repeat. Skill quality emerges from this loop, not from a single inspired writing session. Run realistic test prompts, observe the agent's behavior (including its reasoning trace, not just final output), gather human feedback, and improve based on what you learn. Gut instinct writes the first draft; evidence refines it into production quality.
