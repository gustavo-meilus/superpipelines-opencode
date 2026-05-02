# Skill Design Patterns & Calibration

## The 7 Skill Patterns

### 1. Template

**When to use**: The skill's value is in producing a specific output format. Reports, commit messages, documentation, structured responses.

**Structure**: Provide the exact output template with placeholder annotations. Include 1-2 completed examples. Specify what varies vs. what is fixed.

### 2. Workflow

**When to use**: The task is a multi-step process with a defined sequence. Deployments, migrations, review processes, form filling.

**Structure**: Ordered steps with a trackable checklist. Each step includes: action, expected outcome, and validation. Include decision points for branching logic.

### 3. Conditional Workflow

**When to use**: The task branches based on input type, context, or intermediate results. Different file types, error categories, user intent classification.

**Structure**: Decision tree with clear branching criteria. Each branch leads to a focused sub-workflow. Avoid deep nesting -- flatten to 2 levels maximum.

### 4. Examples-Driven

**When to use**: Output quality depends on calibration through demonstrations. Style matching, tone calibration, format adherence.

**Structure**: 2-4 diverse input/output examples that define the boundaries of acceptable output. Include at least one edge case. Explicitly state what makes each example correct.

### 5. Reference + Lookup

**When to use**: The skill requires domain knowledge the model lacks. API specifications, internal conventions, regulatory rules, multi-variant domains.

**Structure**: Concise summary of essential rules in the main skill file. Detailed reference in linked documents the agent reads on demand, organized by variant or domain (e.g., aws.md, gcp.md, azure.md). The agent reads only the relevant reference file. Index by topic for efficient lookup.

### 6. Validation Loop

**When to use**: Output correctness is critical and verifiable. Code generation, data transformation, compliance documents.

**Structure**: Generate -> Validate -> Fix cycle with explicit validation criteria. Include the validation script or checklist. Define maximum retry attempts and escalation path.

### 7. Guardrails

**When to use**: The skill must enforce constraints or prevent specific failure modes. Safety reviews, compliance checks, quality gates.

**Structure**: Hard rules (with reasoning for each) listed first. Soft guidelines with rationale second. Concrete examples of violations and corrections.

---

## Freedom Calibration

How to match instruction specificity to task fragility.

### High Freedom (principles + examples)

- **When**: Multiple valid approaches exist. Output is subjective or context-dependent.
- **Examples**: Code review, writing feedback, brainstorming, architecture recommendations, creative tasks.
- **Technique**: State guiding principles with reasoning for each. Provide 2-3 diverse examples that define the acceptable range. Let the agent adapt to context. Use theory of mind to make the skill general rather than narrowly fitted to specific examples.

### Medium Freedom (templates + pseudocode)

- **When**: Preferred pattern exists but acceptable variation is tolerated.
- **Examples**: Report generation, documentation, structured analysis, commit messages.
- **Technique**: Provide output templates with annotated placeholders. Include 1-2 completed examples. Specify what is fixed vs. variable. Explain why the template is structured this way.

### Low Freedom (exact scripts + strict validation)

- **When**: Fragile operations where deviation causes failure. Consistency is critical.
- **Examples**: Database migrations, form filling, compliance documents, deployment scripts, data transformations.
- **Technique**: Provide exact scripts to execute. Include validation steps after each action. Define abort conditions. Leave no room for interpretation. Bundle scripts in `scripts/` directory.

---

## Script Bundling

When and how to bundle utility scripts with a skill.

### When to Bundle

Bundle a script when any of these conditions are met:

1. **Repeated generation**: If test runs show the agent independently writing similar helper scripts across multiple prompts, that script belongs in `scripts/`. Writing it once saves every future invocation from reinventing the wheel.
2. **Deterministic operations**: File transformations, data validation, format conversion -- operations where generated code is less reliable than tested code.
3. **Token savings**: A script the agent executes costs far fewer tokens than one it generates, debugs, and explains.
4. **Consistency requirements**: When the exact same operation must produce identical results every time.

### How to Bundle

- Place scripts in `scripts/` within the skill directory.
- Document each script with a one-line purpose description.
- Specify clearly whether the agent should **execute** the script (most common) or **read** it as reference.
- Include required packages/dependencies.
- Include error handling with clear error messages.
- Use forward-slash paths only (no backslashes).

Example in SKILL.md:

```markdown
## Utility Scripts

**scripts/validate.py**: Validates the output against the schema.
```bash
python scripts/validate.py output.json
# Returns: "OK" or a list of specific errors
```

**scripts/transform.py**: Converts the input format to the required structure.
```bash
python scripts/transform.py input.csv --format json > output.json
```
```
