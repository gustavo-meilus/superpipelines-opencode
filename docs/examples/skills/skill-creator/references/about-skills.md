# About Claude Code Skills

## What Skills Provide

Skills are modular packages that extend Claude's capabilities with specialized workflows, domain knowledge, tool integrations, and bundled resources. They transform Claude into a domain-specific agent.

1. **Specialized workflows** — Multi-step procedures for specific domains
2. **Tool integrations** — Instructions for working with specific file formats or APIs
3. **Domain expertise** — Company-specific knowledge, schemas, business logic
4. **Bundled resources** — Scripts, references, and assets for complex and repetitive tasks

## Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description, allowed-tools, etc.)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/      - Executable code (Python/Bash/etc.)
    ├── references/   - Docs loaded into context as needed
    └── assets/       - Files used in output (templates, icons, etc.)
```

## Resource Types

| Type | When to include | Examples |
|------|----------------|---------|
| `scripts/` | Same code rewritten repeatedly; deterministic reliability needed | `scripts/rotate_pdf.py`, `scripts/migrate.sh` |
| `references/` | Docs Claude needs while working | API schemas, company policies, workflow guides |
| `assets/` | Files used in the output, not loaded into context | Templates, logos, boilerplate code |

## Progressive Disclosure

| Level | What loads | Target size |
|-------|-----------|-------------|
| description | Always (every session) | 1-2 sentences |
| SKILL.md body | On invocation | < 200 lines |
| references/ | As needed by Claude | Unlimited |

## SKILL.md Metadata

All YAML frontmatter fields are optional, but `description` is strongly recommended — it determines when Claude loads the skill. Use third-person phrasing: "This skill traces..." not "Use this skill to...".

Writing style: Use imperative/infinitive form throughout ("To accomplish X, do Y" not "You should do X").
