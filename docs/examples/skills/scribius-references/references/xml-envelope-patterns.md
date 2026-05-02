# XML Envelope Patterns

> Canonical XML tag vocabulary for AI-ready technical documentation. Anthropic's prompt-engineering guidance states: "XML tags help Claude parse complex prompts unambiguously." The same principle applies to documentation Claude models read as context.

## Table of contents

1. [Why XML Envelopes](#why-xml-envelopes)
2. [Canonical Tag Vocabulary](#canonical-tag-vocabulary)
3. [Usage Guidelines](#usage-guidelines)
4. [Anti-Patterns](#anti-patterns)

## Why XML Envelopes

Markdown headings convey hierarchy. XML envelopes convey semantics. A model reading `### Error 429` knows only that a heading exists. A model reading `<error code="429">` knows it is reading an error definition with a specific code. Semantic tags reduce the disambiguation work the model must perform and improve the accuracy of reasoning over the doc.

## Canonical Tag Vocabulary

### Document-Level Wrappers

```xml
<!-- Single document with a source reference -->
<document>
  <source>path/to/file.md</source>
  <document_content>
    [full document content here]
  </document_content>
</document>

<!-- Multi-document wrapper (pass several docs to a model in one block) -->
<documents>
  <document index="1">
    <source>api-reference.md</source>
    <document_content>[content]</document_content>
  </document>
  <document index="2">
    <source>auth-guide.md</source>
    <document_content>[content]</document_content>
  </document>
</documents>
```

### Content-Level Envelopes

```xml
<!-- High-level summary of what the document or section covers -->
<overview>
  The Payments API processes card, ACH, and wire transfers. All requests require
  bearer token authentication. Idempotency keys are mandatory for POST operations.
</overview>

<!-- Glossary of canonical terms; place near the top of the doc -->
<glossary>
  <term name="idempotency_key">A caller-supplied UUID that deduplicates POST requests.
  The API ignores duplicate requests with the same key within 24 hours.</term>
  <term name="settlement">The transfer of funds from the acquirer to the merchant account,
  typically T+1 for card transactions.</term>
</glossary>

<!-- A single API endpoint definition -->
<api_endpoint method="POST" path="/v1/payments">
  Creates a new payment intent. Returns a payment object with status "pending".
  Requires idempotency_key header.
</api_endpoint>

<!-- Request schema or example request -->
<request>
```json
{
  "amount": 1000,
  "currency": "usd",
  "idempotency_key": "order_abc123"
}
```
</request>

<!-- Response schema or example response -->
<response status="200">
```json
{
  "id": "pay_xyz",
  "status": "pending",
  "amount": 1000,
  "currency": "usd"
}
```
</response>

<!-- A single usage example -->
<example title="Create a payment in USD">
  [example content]
</example>

<!-- A group of related examples -->
<examples>
  <example title="Successful charge">
    [content]
  </example>
  <example title="Declined card">
    [content]
  </example>
</examples>

<!-- A system invariant: a rule that is always true regardless of input -->
<invariant>
  The `amount` field is always expressed in the smallest currency unit
  (cents for USD, yen for JPY). The API never performs currency conversion.
</invariant>

<!-- An error definition -->
<error code="422" name="invalid_currency">
  The `currency` field is not a supported ISO 4217 code.
  Supported currencies: usd, eur, gbp, jpy.
</error>

<!-- Extended reasoning block (for agent system prompts, not user-facing docs) -->
<thinking>
  [model's extended reasoning; not rendered to end users]
</thinking>

<!-- Final answer block (for agent system prompts) -->
<answer>
  [the response the model surfaces to the caller]
</answer>
```

## Usage Guidelines

- Use `<overview>` once per document and once per major H2 section when the section covers a non-obvious subsystem.
- Use `<glossary>` once per document, placed after the H1 + blockquote summary.
- Use `<invariant>` for any rule that holds regardless of caller behavior or input shape. Invariants are never conditional.
- Use `<error>` for every distinct error the API or system can produce. Include the HTTP status code and machine-readable name.
- Use `<api_endpoint>` for each endpoint definition. Pair with `<request>` and `<response>` within the same section.
- Limit XML envelope nesting to two levels deep. The two-level pattern `<examples><example><request>...</request></example></examples>` is acceptable; nesting beyond two levels fragments context and degrades model disambiguation accuracy.

## Anti-Patterns

- Use a plain Markdown paragraph for plain prose. Wrapping plain prose in an XML envelope adds no semantic signal and trains the model to treat structural markers as decoration.
  - Anti-pattern: using XML envelopes as decorative wrappers around prose with no structural content.
- Use only tag names from the canonical vocabulary defined in this file. Canonical tags carry established semantic meaning; ad-hoc tag names still parse but lose semantic benefit because no consuming model has been trained to interpret them.
  - Anti-pattern: inventing ad-hoc tag names not in this vocabulary.
- Use `<document>` only when passing multiple documents to a model in a single block (the `<documents>` multi-doc bundle pattern). Standalone readable files require no document wrapper.
  - Anti-pattern: wrapping an entire standalone file in `<document>` when the file is not part of a multi-doc bundle.
