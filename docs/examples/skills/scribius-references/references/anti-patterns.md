# Documentation Anti-Patterns

> Concrete anti-patterns that degrade LLM readability, with fix examples. Each entry names the pattern, explains why it causes problems for Claude models, and provides a before/after correction.

## Table of contents

1. Preamble openers
2. Negative-only instructions
3. POV drift
4. Markdown-mirroring bold/emoji spam
5. Deeply-nested references
6. Windows backslash paths
7. Voodoo constants
8. Time-bound phrasing
9. Legacy model IDs
10. Ambiguous pronouns
11. Too many choices
12. Reserved words in names
13. Bare deixis without noun anchor
14. Generic H1
15. Missing language tag on fenced code
16. Synonyms for the same concept
17. Inline comments as instructions
18. Contradictory constraints
19. Missing error coverage
20. Unconstrained optionality
21. Preamble in blockquote position
22. Over-nested XML

---

## 1. Preamble Openers

**Pattern:** Document begins with "Here is the API reference for…", "This document explains…", "In this guide you will learn…"

**Why it hurts:** Wastes the first lines of the stable cache prefix on content that conveys no information. The model processes it and discards it.

**Fix:**
```markdown
<!-- Before -->
This document provides a comprehensive overview of the Payments API...

<!-- After -->
# Payments API Reference

> Covers authentication, charge creation, and refund lifecycle for the Payments v1 API.
```

---

## 2. Negative-Only Instructions

**Pattern:** "Do not call this endpoint without an idempotency key." No positive instruction follows.

**Why it hurts:** The model must infer what to do. On ambiguous inputs, inference fails.

**Fix:**
```markdown
<!-- Before -->
Do not call POST /payments without an idempotency key.

<!-- After -->
Always include an `Idempotency-Key` header on every POST /payments request.
The API rejects requests missing this header with a 400 error.
Do not reuse idempotency keys across different payment amounts.
```

---

## 3. POV Drift

**Pattern:** Doc switches between "we recommend", "you should", and "the caller must" in the same section.

**Why it hurts:** The model treats each POV differently. "We recommend" is soft; "you should" is addressee-directed; "the caller must" is a hard constraint. Inconsistent POV makes the constraint level ambiguous.

**Fix:** Use third-person impersonal throughout. "Callers must…", "The endpoint returns…", "The SDK raises…"

---

## 4. Markdown-Mirroring Bold/Emoji Spam

**Pattern:** Excessive use of `**bold**` on non-critical terms, or emoji as section markers (e.g., "🚨 Warning", "✅ Success").

**Why it hurts:** Claude models may mirror formatting from context. A doc heavy with bold and emoji trains the model to produce output with the same formatting regardless of whether the output context warrants it.

**Fix:** Reserve `**bold**` for genuinely critical terms introduced for the first time. Use XML `<error>` and `<invariant>` envelopes for warnings and constraints. Remove emoji from instructional docs unless the user explicitly requests a friendly tone.

---

## 5. Deeply-Nested References

**Pattern:** `references/api/endpoints/auth/tokens.md` — a reference file three directories deep from the doc root.

**Why it hurts:** Claude Code reads files via `Read` tool. A model reading a top-level doc may receive a path to a deep reference. On `head -100` partial reads (which the model sometimes does), the deep nesting is cut off.

**Fix:** Keep all references one level deep from the index file. Use descriptive flat names: `references/auth-tokens.md` instead of `references/api/endpoints/auth/tokens.md`.

---

## 6. Windows Backslash Paths

**Pattern:** `src\api\payments.ts`, `C:\Users\dev\project`

**Why it hurts:** Unix-targeted tools, shell commands, and Claude models trained on Unix-majority data will misread backslash paths.

**Fix:** Use forward slashes always: `src/api/payments.ts`.

---

## 7. Voodoo Constants

**Pattern:** `timeout: 30000` with no explanation of the unit or derivation.

**Why it hurts:** A model instructed to set a timeout of 30000 does not know if this is milliseconds, seconds, or ticks. It may copy the constant correctly but fail to reason about it correctly.

**Fix:**
```markdown
<!-- Before -->
Set timeout: 30000

<!-- After -->
Set `timeout: 30000` (30,000 milliseconds = 30 seconds). This value matches
the upstream service's maximum response time for large batch requests.
```

---

## 8. Time-Bound Phrasing

**Pattern:** "After August 2025, all requests must include…", "As of the June release, the behavior changed to…", "The new endpoint (added recently) supports…"

**Why it hurts:** These phrases become silently incorrect after the referenced date passes. A model reading the doc months later applies the constraint incorrectly.

**Fix:** Remove the time anchor. State the current behavior as the permanent rule. Move historical context to a `## Changelog` section at the bottom with an explicit date label.

```markdown
<!-- Before -->
After August 2025, the `v2` endpoint is required for all new integrations.

<!-- After -->
All new integrations must use the `v2` endpoint. The `v1` endpoint is deprecated.

## Changelog
- 2025-08-01: v2 endpoint became required; v1 deprecated.
```

---

## 9. Legacy Model IDs

**Pattern:** `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-4-0`

**Why it hurts:** Retired IDs return errors at the API. Docs with retired IDs cause immediate integration failures.

**Fix:** Use only current IDs: `claude-opus-4-7`, `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5`.

---

## 10. Ambiguous Pronouns

**Pattern:** "The function calls the API, then it processes the response, and this is returned to the caller."

**Why it hurts:** "it" and "this" each require the model to resolve a referent. In long sentences with multiple nouns, resolution is error-prone.

**Fix:** Replace every pronoun with its explicit noun. "The function calls the API, then the function processes the response, and the response object is returned to the caller."

---

## 11. Too Many Choices Without a Default

**Pattern:** "You can use `mode: fast`, `mode: balanced`, or `mode: thorough`. Choose based on your requirements."

**Why it hurts:** When no default is stated, an agent building a config must either guess or query the user. Neither is reliable.

**Fix:** State the recommended default and describe the escape hatch.

```markdown
Use `mode: balanced` for most workloads. Switch to `mode: fast` only when
latency is the primary constraint and accuracy can be reduced. Use
`mode: thorough` for compliance or audit contexts where accuracy is critical.
```

---

## 12. Reserved Words in Names

**Pattern:** A skill named `anthropic-helper` or `claude-wrapper`; a tool named `anthropic_search`.

**Why it hurts:** Anthropic and Claude are reserved words in the Agent Skills Open Standard. Names containing these words are rejected by the validator and may cause routing confusion.

**Fix:** Use domain-specific names: `ai-ready-docs`, `llm-doc-author`, `doc-search`.

---

## 13. Bare Deixis Without Noun Anchor

**Pattern:** "The following describes the process. This must be completed before the next step."

**Why it hurts:** "This" with no noun anchor requires the model to look back and infer the referent. In docs with multiple concurrent topics, inference fails.

**Fix:** "The authentication process described below must complete before the SDK initializes the connection pool."

---

## 14. Generic H1

**Pattern:** `# Overview`, `# README`, `# Documentation`, `# Guide`

**Why it hurts:** When a model loads multiple documents into context, generic H1s create title collisions. The model cannot distinguish "Overview" (Auth) from "Overview" (Payments).

**Fix:** `# Payments API — Authentication Overview`, `# SDK Quick-Start Guide — Python`

---

## 15. Missing Language Tag on Fenced Code

**Pattern:**
````
```
const client = new PaymentsClient();
```
````

**Why it hurts:** Syntax highlighting fails; more importantly, the model cannot apply language-specific reasoning (e.g., TypeScript null safety rules vs Python duck typing).

**Fix:**
````markdown
```typescript
const client = new PaymentsClient();
```
````

---

## 16. Synonyms for the Same Concept

**Pattern:** Using "field", "property", "attribute", "key", and "parameter" interchangeably for the same JSON object member.

**Fix:** Pick one term, define it in the glossary, use it exclusively.

---

## 17. Inline Comments as Instructions

**Pattern:** `timeout: 30000 // change this if needed`

**Why it hurts:** Inline code comments are instruction-like but appear inside a code block. Models may not surface them as actionable instructions.

**Fix:** Extract the instruction to prose outside the code block. Keep the code block clean.

---

## 18. Contradictory Constraints

**Pattern:** Section A: "The `amount` field is optional." Section B: "All POST /payments requests must include `amount`."

**Why it hurts:** The model picks one interpretation. Which one depends on recency bias and context window position — unpredictable.

**Fix:** Audit all constraints for contradiction before delivery. Use the VALIDATE phase to grep for the same field name across sections.

---

## 19. Missing Error Coverage

**Pattern:** API reference documents the happy path but does not document any error responses.

**Why it hurts:** Agents building integrations will not handle errors correctly. The model cannot advise on retry logic, backoff, or error routing without error definitions.

**Fix:** Include an `<error>` envelope for every distinct error the API can return, with its HTTP status, machine-readable code, and recovery instruction.

---

## 20. Unconstrained Optionality

**Pattern:** "The `metadata` field can contain any key-value pairs."

**Why it hurts:** The model cannot validate or reason about unconstrained fields. When generating a request, it may produce keys that violate undocumented limits.

**Fix:** State the actual constraints: "The `metadata` field accepts up to 16 key-value pairs. Keys must be strings ≤64 characters. Values must be strings ≤512 characters."

---

## 21. Preamble in Blockquote Position

**Pattern:**
```markdown
# Payments API

> This document was written by the Platform team and covers the Payments v1 API.
```

**Why it hurts:** The blockquote is read by models as the doc's summary. A preamble about authorship wastes that summary slot.

**Fix:** Use the blockquote for the functional summary: `> Covers charge creation, refunds, and webhook event handling for the Payments v1 API.`

---

## 22. Over-Nested XML

**Pattern:** `<api><endpoint><request><example><code>...</code></example></request></endpoint></api>`

**Why it hurts:** More than two levels of nesting makes the block difficult to parse and violates the progressive-disclosure principle.

**Fix:** Limit XML nesting to two levels. Use flat sibling tags rather than deep hierarchies.
