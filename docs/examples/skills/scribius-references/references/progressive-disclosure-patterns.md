# Progressive Disclosure Patterns

> Structural recipes for organizing AI-ready docs at the right granularity. The goal is just-in-time retrieval: an agent loads only the content it needs, when it needs it.

## Table of contents

1. Monolith vs index+refs decision
2. ToC-at-top rule
3. One-level nesting limit
4. llms-full.txt vs linked Markdown
5. Just-in-time retrieval via lightweight identifiers

---

## 1. Monolith vs Index+Refs Decision

### Use a monolith (single file) when:
- Total content is ≤500 lines
- The entire doc is needed in most reads (e.g., a short runbook read end-to-end)
- The doc has no reusable subcomponents

### Use index+refs when:
- Total content exceeds 500 lines
- Readers typically need only a subset of sections
- Multiple files reference the same subsection (extract it to a shared ref)
- The doc is an API reference with many independent endpoints

### Index+refs topology:

```
docs/
├── api-reference.md          # Index: H1 + blockquote + H2 sections + links
└── references/
    ├── auth.md               # Auth endpoints (≤500 lines, ToC if >100)
    ├── payments.md           # Payments endpoints
    ├── webhooks.md           # Webhook events
    └── shared-glossary.md    # Cross-file canonical terms
```

The index file (`api-reference.md`) contains:
- H1 + blockquote summary
- One `<overview>` block
- H2 sections listing what each reference file covers
- Links to reference files with one-line descriptions

Reference files contain the deep content. Each is self-contained: it has its own H1 and blockquote.

---

## 2. ToC-at-Top Rule

Any file exceeding 100 lines MUST include a `## Table of contents` section immediately after the H1 + blockquote. The ToC lists all H2 headings with anchor links.

**Why:** Claude Code may issue `head -100` partial reads on large files. Without a ToC in the first 100 lines, the model cannot determine whether the section it needs exists in the file. The ToC makes the file's structure queryable from a partial read.

```markdown
# Auth Reference

> Authentication endpoints for the Payments v1 API. Covers token issuance,
> refresh, and revocation.

## Table of contents

1. [Token issuance](#token-issuance)
2. [Token refresh](#token-refresh)
3. [Token revocation](#token-revocation)
4. [Error codes](#error-codes)
```

---

## 3. One-Level Nesting Limit

Reference files must be one level deep from the index file. A reference file must not link to another reference file.

```
docs/api-reference.md        ← index
docs/references/auth.md      ← ref (one level deep, OK)
docs/references/tokens.md    ← ref (one level deep, OK)
```

A reference file linking to `references/auth/tokens.md` violates the one-level limit. The model following that link may receive a truncated partial read.

**Fix for deep content:** Flatten the hierarchy. Use descriptive file names instead of directory nesting: `references/auth-token-issuance.md`, `references/auth-token-refresh.md`.

---

## 4. llms-full.txt vs Linked Markdown

| Use case | Recommendation |
| :--- | :--- |
| Coding agent reading docs interactively | `llms.txt` — agent fetches only needed files |
| Offline analysis of full codebase | `llms-full.txt` — everything in one block |
| Opus 4.7 1M context with small codebase | `llms-full.txt` — fits comfortably, zero latency |
| Large codebase on Sonnet 4.6 (200K) | `llms.txt` — full inline would overflow context |
| Nightly batch jobs | `llms-full.txt` — deterministic, no fetch failures |

When generating both files, note in the Scribe's Brief that `llms-full.txt` will invalidate its cache entry whenever any linked doc changes, while `llms.txt` remains stable as long as the index structure is unchanged.

---

## 5. Just-in-Time Retrieval via Lightweight Identifiers

The most context-efficient pattern: the index file provides only enough information for the agent to decide which reference to read. The reference is fetched only when needed.

**Lightweight identifier:** a file path or URL plus a one-line description.

```markdown
## API Reference

- [auth.md](references/auth.md): Token issuance, refresh, and revocation endpoints.
- [payments.md](references/payments.md): Charge creation, capture, and refund endpoints.
- [webhooks.md](references/webhooks.md): Webhook event types and delivery guarantees.
```

The agent reads the index, identifies the relevant reference by its one-line description, then reads only that file. This approach uses 20–50 tokens for the index entry vs 500–2000 tokens for the full reference content.

**Anti-pattern:** Pasting the full content of every reference into the index file. This is the monolith trap with extra steps: the index grows to several thousand lines, defeating progressive disclosure.
