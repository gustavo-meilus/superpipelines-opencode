# Universal Skill Architecture

The 6-layer architecture for building production-grade skills.

## Layer 1: Metadata (Required)

The skill's external contract -- determines discoverability and selection. This is the single most important piece of text in the entire skill.

**name**: Lowercase, hyphenated, max 64 characters. Descriptive and specific.
- Good: `pdf-text-extraction`, `conventional-commits`, `react-component-review`
- Bad: `helper`, `utils`, `my-skill`, `stuff`

**description**: Max 1024 characters. Written in third person. Must answer WHAT (specific capabilities) and WHEN (trigger scenarios/keywords).

See [description-engineering.md](description-engineering.md) for full rules, including the undertriggering countermeasure and semantic trigger coverage.

**Optional metadata**: version, author, tags, dependencies, scope, model compatibility, freedom level.

## Layer 2: Core Instructions (Required)

The essential knowledge the agent needs to execute the skill. This is the only layer guaranteed to be in context.

Rules:

- **500 lines maximum.** This is a hard ceiling, not a guideline. If approaching this limit, add a layer of hierarchy with clear pointers about where the model should look next.
- **Lead with the most critical instruction.** The agent may not read the entire skill if context is tight.
- **Assume intelligence.** Do not explain what the model already knows. Encode only the delta -- domain-specific knowledge, team conventions, non-obvious constraints.
- **Use concrete examples over abstract rules.** One good example teaches more than three paragraphs of explanation.
- **Include a "Quick Start" section** at the top for the 80% use case. Detailed guidance follows for the remaining 20%.
- **Use imperative form** for instructions. "Extract the text" not "You should extract the text" or "The text should be extracted."
- **Explain the why.** For every significant constraint, include the reasoning. "Use pdfplumber for extraction -- it handles multi-column layouts and embedded tables, which PyPDF misses" is better than "Use pdfplumber for extraction."

## Layer 3: Output Specification

Define exactly what the skill produces.

- **Format**: Template, JSON schema, Markdown structure, or natural language with explicit constraints (word count, sentence count, etc.).
- **Quality criteria**: What distinguishes good output from bad? Provide a rubric or checklist the agent can self-evaluate against.
- **Anti-examples**: Show 1-2 examples of bad output and explain why they fail. These are often more instructive than positive examples because they define the boundary of acceptable behavior.

## Layer 4: Validation & Error Handling

How to verify correctness and recover from failures.

- **Validation steps**: Checks the agent performs after generating output.
- **Common failure modes**: What typically goes wrong and how to fix it.
- **Escalation path**: When should the agent ask for human input instead of guessing?
- **Utility scripts**: Pre-built validation scripts the agent can execute rather than generating verification code on the fly. (See [design-patterns.md](design-patterns.md) for script bundling guidance.)

## Layer 5: Reference Material (Progressive Disclosure)

Detailed documentation loaded on demand, not by default.

Three-level loading system:

1. **Metadata** (name + description) -- Always in context (~100 words)
2. **SKILL.md body** -- In context whenever skill triggers (<500 lines)
3. **Bundled resources** -- Loaded as needed (unlimited size; scripts can execute without loading into context)

Rules for reference files:

- Linked from the core instructions with clear retrieval cues: "For the complete API reference, see [reference.md](reference.md)"
- **One level deep only.** Reference files must not link to other reference files. The agent may partially read nested references.
- For large reference files (>300 lines), include a table of contents at the top so the agent can navigate efficiently.
- Indexed by topic or use case for efficient lookup.
- Organized by variant when supporting multiple domains:

```
cloud-deploy/
├── SKILL.md (workflow + selection logic)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

The agent reads only the relevant reference file.

## Layer 6: Supporting Assets

Scripts, templates, and files that extend the skill's capabilities.

- **Utility scripts**: Pre-built, tested code the agent executes rather than generates. More reliable, saves tokens, ensures consistency.
- **Template files**: Starter templates the agent copies and fills.
- **Configuration files**: Default settings, schemas, validation rules.
- Each asset must have a one-line description of its purpose and clear instructions: **execute**, **read**, or **copy**.

Directory structure:

```
skill-name/
├── SKILL.md              # Required -- main instructions
├── references/           # Optional -- detailed documentation
│   ├── api-reference.md
│   └── edge-cases.md
├── scripts/              # Optional -- utility scripts
│   ├── validate.py
│   └── transform.sh
└── assets/               # Optional -- templates, icons, fonts
    └── report-template.md
```
