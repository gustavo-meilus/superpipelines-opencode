# Response Templates

> Output skeletons for each Scribius mode. Use as starting points; customize to the specific doc's domain and surface area.

## Table of contents

1. API Reference template
2. Architecture Explainer template
3. Runbook template
4. llms.txt skeleton
5. llms-full.txt skeleton
6. Reference-Pack skeleton
7. Scribe's Brief template

---

## 1. API Reference Template

```markdown
# [API Name] — [Resource] Reference

> [One to three sentences: what this API does, which version it covers, who calls it.]

<glossary>
  <term name="[canonical_term]">[Definition. Note synonyms to avoid.]</term>
</glossary>

<overview>
[Two to four sentences on the resource lifecycle, authentication requirements,
and any global invariants that apply to all endpoints in this file.]
</overview>

## [Endpoint Group Name]

<api_endpoint method="[METHOD]" path="[/path]">
[One sentence: what this endpoint does and what it returns.]
</api_endpoint>

### Request

<request>
```[language]
// [path/to/example-file.ext]
{
  "[field]": "[type and constraint]"
}
```
</request>

### Response

<response status="200">
```[language]
{
  "[field]": "[type]"
}
```
</response>

### Errors

<error code="[HTTP status]" name="[machine_readable_name]">
[Cause and recovery instruction.]
</error>

### Invariants

<invariant>
[Rule that holds for all calls to this endpoint, regardless of input.]
</invariant>

## Changelog

- [YYYY-MM-DD]: [Change description. Keep this section at the bottom — it is volatile.]
```

---

## 2. Architecture Explainer Template

```markdown
# [System Name] — Architecture Reference

> [Two to three sentences: what the system does, what its primary components are,
> and what architectural constraint the reader should understand before proceeding.]

<glossary>
  <term name="[component]">[Definition.]</term>
</glossary>

<overview>
[Three to six sentences describing the system's purpose, its boundaries,
and the primary data flow at a high level.]
</overview>

## Components

### [Component Name]

**Responsibility:** [One sentence.]

**Inputs:** [What data or events this component receives.]

**Outputs:** [What data or events this component produces.]

<invariant>
[A rule about this component that is always true.]
</invariant>

## Data Flow

[Mermaid diagram or numbered step-by-step description of the primary flow.]

## Failure Modes

<error name="[failure_type]">
[What causes it, how it manifests, and the recovery path.]
</error>

## Cross-References

- [related-system.md](references/related-system.md): [What the reader finds there.]
```

---

## 3. Runbook Template

```markdown
# [System Name] — [Operation] Runbook

> [One to two sentences: what operation this runbook covers and under what
> conditions a responder executes it.]

## Prerequisites

- [Prerequisite 1: access, tool, or state required before starting.]
- [Prerequisite 2.]

## Steps

### Step 1 — [Action Name]

```[language]
[Command or configuration block.]
```

**Success condition:** [Observable state that confirms this step completed correctly.]

**Failure path:** [If this step fails, do X. Do not proceed until this step succeeds.]

### Step 2 — [Action Name]

[Repeat structure.]

## Verification

[Command or check that confirms the full operation succeeded end-to-end.]

## Rollback

[Steps to undo the operation if the verification fails.]

## Escalation

[Who to contact if rollback fails or the issue persists after rollback.]
```

---

## 4. llms.txt Skeleton

```markdown
# [Project Name]

> [One to three sentences describing the project: what it does, who uses it,
> and what an agent reading this file can do with the docs.]

## Overview

- [Getting Started](docs/getting-started.md): Installation, first request, and authentication.
- [Configuration Reference](docs/configuration.md): All configuration options with defaults.

## API Reference

- [Authentication](docs/api/auth.md): Token issuance, refresh, and revocation.
- [Payments](docs/api/payments.md): Charge creation, capture, and refund endpoints.

## Guides

- [Webhooks Guide](docs/guides/webhooks.md): Setting up and validating webhook delivery.
- [Idempotency Guide](docs/guides/idempotency.md): Using idempotency keys for safe retries.

## Optional

- [Changelog](CHANGELOG.md): Release notes by version.
- [Contributing](CONTRIBUTING.md): Development setup and contribution guidelines.
- [Migration Guide](docs/migration.md): Upgrading from v1 to v2.
```

---

## 5. llms-full.txt Skeleton

```markdown
# [Project Name]

> [Same blockquote as llms.txt.]

## Overview

- [Getting Started](docs/getting-started.md): [Description.]

## API Reference

- [Authentication](docs/api/auth.md): [Description.]

---

# Getting Started

[Full content of getting-started.md inlined here.]

---

# Authentication

[Full content of auth.md inlined here.]

---
```

---

## 6. Reference-Pack Skeleton

```markdown
# [Agent/Skill Name] Reference Index

> Reference files for [agent/skill name]. Loaded on demand by the parent agent
> via Read tool. Do not preload these files in the agent's skills: frontmatter.

## Files

| File | Purpose | Load when |
| :--- | :--- | :--- |
| `references/[topic-a].md` | [What it covers.] | [Which phase or mode needs it.] |
| `references/[topic-b].md` | [What it covers.] | [Which phase or mode needs it.] |
```

Each individual reference file in the pack follows the standard template: H1, blockquote summary, ToC if >100 lines, then content.

---

## 7. Scribe's Brief Template

```
## Scribe's Brief

**Structural rationale:** [Why this topology was chosen: monolith or index+refs,
section ordering, XML envelope selection.]

**Cache breakpoint recommendation:** [Where to place the cache_control breakpoint
in the doc, and which sections are in the stable vs volatile prefix.]

**Model-compatibility notes:** [Any features or syntax in the doc that are
model-specific, e.g., 1M context required for llms-full.txt, Opus 4.7 literalism
requires explicit defaults.]

**Token budget:**
- Doc body: ~[N] lines, ~[N] tokens estimated
- Reference files (if any): [N] files, ~[N] lines each
- llms.txt index: ~[N] lines
- llms-full.txt (if generated): ~[N] lines, ~[N] tokens

**VALIDATE results:**
| Rule | Status | Notes |
| :--- | :--- | :--- |
| 1. H1 present and unique | PASS/FAIL | |
| 2. Blockquote summary | PASS/FAIL | |
| ... | | |
| 14. Cache-stable prefix | PASS/FAIL | |

**Open items:** [Any gaps left as [TODO] markers with justification.]
```
