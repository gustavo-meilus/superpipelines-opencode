# Prompt Cache Discipline for Documentation Authors

> Cache discipline is not just an API optimization — it determines whether the docs Scribius writes are economical for the agents that consume them. Low cache-hit rate on frequently-read docs is a cost and latency problem.

## Table of contents

1. Prefix order rules
2. Cache breakpoints
3. TTL economics
4. Byte-stability requirements
5. Anti-patterns

---

## 1. Prefix Order Rules

The prompt cache works on the shared prefix between consecutive API calls. To maximize cache hits, structure content from most-stable to least-stable:

```text
[Most stable]
  Tools / function definitions
  System prompt
  Preloaded skills (injected at startup)
  Static doc content (overview, glossary, invariants, schema)
[Least stable]
  Dynamic content (user query, request examples with live IDs)
  Conversation history / messages
[Most volatile]
```

Apply this order within documents as well: static sections (overview, glossary, invariants) first; dynamic or example sections last.

## 2. Cache Breakpoints

Up to 4 `cache_control` breakpoints can be placed in a prompt. Each breakpoint tells the cache system "everything before this point is stable; cache it."

**Placement rule:** Put the last breakpoint on the last block that remains identical across all requests. Everything after the breakpoint is treated as dynamic and not cached.

**20-block lookback:** The cache system inspects the last 20 blocks to find a matching prefix. Deeply buried breakpoints may miss the window.

**Practical application for doc authors:** When a doc is used as context in an agentic loop, the static sections (placed first) will hit cache after the first request. The example sections (placed last, after the breakpoint) are re-read fresh each call. This is the intended behavior.

## 3. TTL Economics

| TTL | Discount | Break-even |
| :--- | :--- | :--- |
| 5 minutes | 1.25× input token discount | 1 cache read recoups write cost |
| 1 hour | 2× input token discount | 2 cache reads recoup write cost |

**Use 5-minute TTL** for interactive sessions where calls are frequent.
**Use 1-hour TTL** for agentic loops where gaps between API calls can exceed 5 minutes.

**Ordering rule for mixed TTL:** 1-hour cache entries MUST appear before 5-minute entries in a single request. Reversing this order breaks both caches.

## 4. Byte-Stability Requirements

The cache prefix matches on exact bytes. Any change to the stable prefix invalidates all downstream cache entries.

Triggers that break the cache prefix:
- Adding, removing, or reordering tools in the tools array
- Changing the skills list between calls
- Modifying any text in the static prefix sections
- Inserting a timestamp, session ID, or run ID into the stable prefix
- Changing whitespace or formatting in the cached section

**Docs must not include** in their stable prefix:
- ISO date strings (e.g., `2026-04-17`)
- UUIDs or request IDs
- "Last updated" notices
- Version numbers that change on every release (use a separate changelog section instead)

## 5. Anti-Patterns

**Dynamic timestamps in stable sections.** A doc that begins with "Last updated: 2026-04-17" invalidates the cache prefix every day. Move version notes to a `## Changelog` section at the bottom.

**Volatile examples in the prefix.** Place request/response examples containing live UUIDs or timestamps in a late section, after the last cache breakpoint. Request/response examples that contain real UUIDs or timestamps must not appear early in the doc.

**Random ordering of sections.** A doc that reorders H2 sections between versions (e.g., "Getting Started" moves from position 2 to position 4) invalidates the entire prefix. Treat section order as a stable contract.

**Inconsistent whitespace.** Trailing spaces, mixed line endings (CRLF vs LF), and inconsistent blank-line counts between sections can break cache matching. Use a consistent formatter.
