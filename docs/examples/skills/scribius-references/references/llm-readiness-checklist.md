# LLM-Readiness Checklist

> The 14-rule self-audit Scribius runs in VALIDATE before delivering any doc. Each rule maps to a structural or linguistic property that directly affects how Claude models parse and reason over documentation.

## Table of contents

1. H1 present and unique
2. Blockquote summary present
3. Third-person impersonal voice
4. XML envelopes on structured blocks
5. File within 500-line limit
6. Long inputs placed first
7. Positive scoping applied
8. No preamble opener
9. No bare deixis
10. Canonical terminology consistent
11. Current model IDs only
12. No time-bound copy
13. Unix paths and language-tagged fences
14. Cache-stable prefix

---

## Rule 1 — H1 Present and Unique

The document opens with exactly one `# Title`. The title names the doc unambiguously (not "Overview" but "Payments API — Request Reference").

**Pass:** First non-whitespace, non-frontmatter line is `# [Specific Title]`.
**Fail:** No H1, multiple H1s, or H1 is a generic placeholder like `# README`.

---

## Rule 2 — Blockquote Summary Present

A blockquote (`>`) immediately following the H1 provides a one- to three-sentence summary of what the document covers and who should read it. Claude models use this to calibrate reading depth before scanning the rest of the file.

**Pass:** `>` block is present within the first 10 lines after H1.
**Fail:** No summary block; summary is a plain paragraph instead of a blockquote.

---

## Rule 3 — Third-Person Impersonal Voice

All prose uses third-person impersonal ("The endpoint returns…", "Callers must include…"). No first-person ("We recommend…") and no second-person direct address ("You should call…") unless the doc is explicitly a tutorial aimed at a human reader.

**Pass:** Grep for `\bI\b`, `\bwe\b`, `\byou\b` (case-insensitive) finds zero matches in instructional prose.
**Fail:** Any first- or second-person pronoun in non-tutorial instructional text.

---

## Rule 4 — XML Envelopes on Structured Blocks

Every API endpoint, code example, invariant, and error description is wrapped in a named XML envelope. Plain Markdown headings alone are insufficient for semantic parsing.

**Pass:** `<api_endpoint>`, `<example>`, `<invariant>`, `<error>` tags present wherever the corresponding block type appears.
**Fail:** Endpoint descriptions, examples, or error tables using only H3 or plain prose.

---

## Rule 5 — File Within 500-Line Limit

The doc file is ≤500 lines. Files exceeding this limit are split into an index plus `references/` entries, one level deep.

**Pass:** `wc -l` ≤ 500.
**Fail:** File exceeds 500 lines without a corresponding split into `references/`.

---

## Rule 6 — Long Inputs Placed First

In any section that provides both context and instructions, the longest stable context block (schema, background, constraints) appears before the instructional or dynamic content. Claude models apply instructions more accurately when context precedes them.

**Pass:** Background/schema sections precede action/instruction sections in every major heading.
**Fail:** Instructions appear before their prerequisite context in a section.

---

## Rule 7 — Positive Scoping Applied

Every "do not" instruction has a corresponding positive instruction telling the model what to do instead. The positive form is the primary instruction; the negative form is the constraint guard.

**Pass:** Every `do not` / `never` / `avoid` sentence is accompanied by a positive equivalent.
**Fail:** A negative-only instruction with no positive counterpart.

---

## Rule 8 — No Preamble Opener

The document does not open with "Here is…", "Based on the…", "This document…", "In this guide…", or any similar throat-clearing phrase. The H1 and blockquote are the only permitted openers.

**Pass:** Lines 1–5 contain only H1 and optional blockquote.
**Fail:** Any preamble phrase before or after the H1.

---

## Rule 9 — No Bare Deixis

Pronouns "this", "it", "the above", and "the following" never appear without an explicit noun anchor in the same sentence or the immediately preceding sentence.

**Pass:** Grep for `\bthis\b`, `\bit\b`, `\bthe above\b`, `\bthe following\b` and manually confirm each has a noun anchor.
**Fail:** Any instance where the referent requires reading back more than one sentence to resolve.

---

## Rule 10 — Canonical Terminology Consistent

The glossary at the top of the file defines one canonical term per concept. That exact term is used throughout the file. No synonyms for the same concept appear in instructional prose after the glossary.

**Pass:** All key terms in the body match their glossary definitions exactly.
**Fail:** Multiple terms for the same concept used interchangeably in the body.

---

## Rule 11 — Current Model IDs Only

Any model ID in the doc is one of: `claude-opus-4-7`, `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5`. No `claude-3-*`, `claude-3-5-*`, or `claude-4-0` IDs appear.

**Pass:** Grep for `claude-3`, `claude-3-5`, `claude-4-0` returns zero matches.
**Fail:** Any legacy model ID present.

---

## Rule 12 — No Time-Bound Copy

The doc contains no phrases like "As of August 2025…", "After the June release…", "Currently…", "Recently added…", or "Upcoming…". These phrases become stale silently and cause the model to apply outdated constraints.

**Pass:** Grep for `as of`, `after the`, `currently`, `recently`, `upcoming` returns zero matches in stable sections.
**Fail:** Any time-anchored phrase in a section not explicitly marked as a changelog.

---

## Rule 13 — Unix Paths and Language-Tagged Fences

All file paths use forward slashes. Every fenced code block carries a language tag. File-specific blocks include a comment with the file path on the first line.

**Pass:** No backslash path separators; every ` ``` ` block has a language identifier; file blocks have path comments.
**Fail:** Windows-style paths; bare ` ``` ` fences without language tag; file blocks without path context.

---

## Rule 14 — Cache-Stable Prefix

Static sections (overview, glossary, schema definitions, invariants) appear before dynamic or volatile sections (request examples with live IDs, changelogs). No timestamps, session IDs, or run IDs appear in the static prefix.

**Pass:** Static content precedes dynamic content; grep for ISO date patterns and UUID patterns in the first 100 lines returns zero matches.
**Fail:** Dynamic content intermixed with static prefix; timestamps or run IDs in non-changelog sections.
