# Scribius Core Philosophy

> Canonical design stance: docs are prompts the model never negotiates with.

## 1. Docs Are Prompts the Model Never Negotiates With

When a Claude model reads a technical document, the document is an instruction. The model cannot push back, ask for clarification, or reinterpret ambiguity in the author's favor. Every gap in the doc becomes a hallucination opportunity. Every ambiguous sentence becomes a coin flip. The Scribius design stance treats every documentation decision as a prompt-engineering decision.

> **Heuristic:** A doc read without prior system context exposes every inference gap. Wherever a reader must pause to infer, a model will hallucinate.

## 2. Cache-Stability > Cleverness

Docs read by agentic systems are cached. A doc that changes its opening paragraphs between reads, includes timestamps in stable sections, or reorders sections based on audience invalidates the cache prefix. Stable docs reduce API cost and latency for every caller.

> **Rule:** Static sections (overview, glossary, invariants) always precede volatile sections (examples with request IDs, changelogs, version-specific notes).

## 3. Positive Scoping

Negative-only instructions ("Do not call this endpoint without a token") require the model to infer what to do instead. Positive instructions ("Always include a bearer token in the `Authorization` header before calling this endpoint") remove inference from the reading path.

> **Heuristic:** For every "do not" instruction, write the positive equivalent alongside it. The negative form is the enforcement; the positive form is the guide.

## 4. One Canonical Term Per Concept

Terminology drift — using "field", "property", "attribute", and "key" interchangeably across a doc — forces the model to build a synonym map during parsing. This burns tokens and introduces subtle disambiguation errors. Pick one term per concept and use it throughout.

> **Rule:** Define the canonical term in the glossary at the top. Use that exact term everywhere in the doc. Redirect synonyms in parentheses once, then drop them.

## 5. Progressive Disclosure Over Monolithic Coverage

A 2,000-line reference doc is not more helpful than a 400-line index pointing to focused 150-line files. Long docs force the model to scan irrelevant sections; short focused files let it retrieve exactly what it needs. Structure for just-in-time retrieval, not encyclopedic completeness in one block.

> **Heuristic:** If a file would exceed 500 lines, decompose it into an index plus `references/` entries before writing the first line.

## 6. XML Envelopes as Semantic Anchors

Plain Markdown headings tell the model a block is important. XML envelopes tell it what kind of thing the block is. `<api_endpoint>`, `<invariant>`, `<error>`, and `<example>` are semantically richer than `###`. Use them for structured blocks; use Markdown headings for navigation.

> **Rule:** Wrap every API endpoint, code example, error description, and invariant in a named XML envelope. Reserve Markdown H2/H3 for section navigation only.

## 7. Reliability > Completeness

A partial doc that is accurate, unambiguous, and up to date is more valuable than a complete doc that contains stale model IDs, broken paths, or contradictory instructions. Ship the reliable subset; mark gaps explicitly rather than filling them with uncertain copy.

> **Heuristic:** Prefer `[TODO: add error codes for 429]` over a list of error codes you are not certain about.
