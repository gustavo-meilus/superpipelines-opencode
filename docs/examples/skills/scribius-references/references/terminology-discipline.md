# Terminology Discipline

> How to build and enforce a consistent glossary in AI-ready documentation. Terminology drift is the single most common cause of ambiguous docs.

## The Core Rule

Pick one canonical term per concept. Define that term in the glossary at the top of the document. Use that exact term throughout the document. Never substitute a synonym in instructional prose after the glossary defines the canonical form.

## Why Terminology Drift Happens

Documentation grows incrementally. One author writes "field"; another writes "property"; a third writes "attribute". All three mean the same JSON key. The model reading the doc must build a synonym map dynamically, burning tokens and introducing resolution errors. On sufficiently complex docs, the synonym map breaks and the model applies wrong constraints to wrong concepts.

## Glossary Construction Pattern

Place the glossary immediately after the H1 + blockquote summary. Use the `<glossary>` XML envelope.

```markdown
# Payments API Reference

> Covers charge creation, refunds, and webhook lifecycle for Payments v1.

<glossary>
  <term name="payment">A charge authorization and capture request. The canonical unit
  of the Payments API. Never called "charge", "transaction", or "order".</term>

  <term name="idempotency_key">A caller-supplied UUID that deduplicates POST requests.
  The API ignores duplicate requests with the same key within 24 hours.</term>

  <term name="settlement">The transfer of cleared funds to the merchant account.
  Distinct from "capture" (the authorization hold) and "payout" (the disbursement).</term>
</glossary>
```

## Synonym Audit Process

Before finalizing a doc, run a synonym audit:

1. List all canonical terms from the glossary.
2. For each canonical term, list its common synonyms (e.g., "payment" → charge, transaction, order).
3. `Grep` the document body for each synonym.
4. Replace every synonym with its canonical form, except where the synonym appears in a `<term>` definition or in a quoted external source.

## Consistent Deixis Anchors

Deixis (demonstrative pronouns like "this", "that", "the above") creates implicit term references. When a doc is well-terminated, every deixis token must have an explicit noun anchor in the same sentence.

**Drift example:**

> "The field must be a UUID. This is validated server-side."

"This" refers to the field's UUID constraint, but the model must infer that. If three constraints appear in the same paragraph, the referent of "this" is ambiguous.

**Fixed:**

> "The `idempotency_key` field must be a UUID. The UUID format is validated server-side on every POST request."

## The "Field vs Element vs Control" Drift Example

A common drift pattern in API docs:

| What the author means | Terms used interchangeably (bad) | Canonical term (good) |
| :--- | :--- | :--- |
| A JSON key in a request body | field, property, attribute, key, parameter | `field` |
| An HTML form input | input, control, element, widget, field | `input` |
| An XML node | element, node, tag, item | `element` |

When a doc covers both an API and a UI, the collision between "field" (JSON key) and "field" (form input) requires disambiguation in the glossary:

```markdown
<glossary>
  <term name="request_field">A key-value pair in the JSON request body.</term>
  <term name="form_input">An interactive control in the checkout UI form.</term>
</glossary>
```

## Cross-File Terminology Consistency

When a document links to other files (e.g., in an index+refs topology), canonical terms must be consistent across all files. Create a shared glossary file (e.g., `references/shared-glossary.md`) and reference it in the Scribe's Brief as the cross-file authority.
