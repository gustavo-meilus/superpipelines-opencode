# llms.txt and llms-full.txt Specification

> Scribius's implementation of the llmstxt.org spec for generating LLM-consumption indexes from a project's documentation. Reference: llmstxt.org + AnswerDotAI/llms-txt GitHub.

## What llms.txt Is

`llms.txt` is a Markdown file placed at the root of a project or documentation site. It serves as a lightweight navigation index for AI agents and coding tools: a list of URLs pointing to the project's canonical `.md` documentation files, organized by topic. The goal is to let a model or agent retrieve exactly the relevant doc rather than scraping the entire site.

`llms-full.txt` is the inlined version: same structure, but each linked file's content is embedded under its heading. It trades file size for zero-latency retrieval (the model has everything in one context block).

## llms.txt Structure

```markdown
# Project Name

> One to three sentence project description in a blockquote. This becomes
> the model's primary context for understanding what the project is before
> it reads any individual file.

## Section Name

- [Document Title](https://example.com/docs/topic.md): One-line description of what this file covers.
- [Another Doc](https://example.com/docs/other.md): What the model will find here.

## Optional

- [Changelog](https://example.com/CHANGELOG.md): Recent changes. Omit if rarely updated.
- [Contributing](https://example.com/CONTRIBUTING.md): Contribution guidelines.
```

### Structural Rules

1. **H1 only at root.** The file contains exactly one `# Project Name` heading. No other H1.
2. **Optional blockquote.** A `>` block immediately after the H1 provides a project summary. Recommended; not required by the spec.
3. **H2 for sections.** Each topic group is an `## Section Name` heading. Common sections: Overview, API Reference, Guides, Configuration, Examples.
4. **Bullet list with Markdown links.** Each entry is `- [Title](URL): Description`. The URL MUST point to a `.md` file, not an HTML page.
5. **`## Optional` section.** Files in this section are lower-priority context. Agents may skip them when context is constrained. Place changelogs, contributing guides, and infrequently-needed files here.

## llms-full.txt Structure

```markdown
# Project Name

> Project description blockquote.

## Section Name

- [Document Title](URL): Description.

---

# Document Title

[Full content of the linked document inlined here]

---

# Another Document Title

[Full content inlined]
```

### Structural Rules for llms-full.txt

- Same header as `llms.txt` (H1 + blockquote + H2 sections + bullet links).
- After the index section, each linked document is inlined under its own `# Title` heading, separated by `---` dividers.
- The order of inlined documents matches the order they appear in the index.
- Do not include documents from `## Optional` unless the user explicitly requests full inlining.

## Tradeoffs: llms.txt vs llms-full.txt

| Dimension | llms.txt | llms-full.txt |
| :--- | :--- | :--- |
| **File size** | Small (1–3 KB typical) | Large (can exceed 100 KB) |
| **Cache stability** | High — rarely changes | Low — any doc update invalidates |
| **Retrieval latency** | Requires follow-up fetches | Zero; all content in one block |
| **Context efficiency** | Agents load only needed files | Entire corpus loaded always |
| **Best for** | Coding agents, search tools, 1M-context Opus 4.7 | Batch processing, offline analysis |

**Recommendation:** Default to `llms.txt`. Generate `llms-full.txt` only when the user explicitly needs offline inlining or the full corpus fits comfortably in the target model's context (e.g., a small project on Opus 4.7 1M context).

## Implementation Notes for LLMS-INDEX Mode

1. `Glob` the repo for `*.md` files; filter out `node_modules/`, build artifacts, and generated files.
2. Read each candidate file's H1 and first blockquote (or first paragraph) for the description.
3. Sort by topic into logical sections; do not use alphabetical order.
4. Write URLs using the project's canonical base URL, not relative paths.
5. If a canonical base URL is not known, use relative paths (e.g., `./docs/api.md`) and note this in the Scribe's Brief.
6. Flag files that exceed 500 lines as candidates for splitting before inclusion.
