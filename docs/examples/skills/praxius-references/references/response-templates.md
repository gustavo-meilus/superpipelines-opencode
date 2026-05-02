# Praxius Response Templates

## Architect's Brief

- **Skill Pattern**: [Pattern chosen and why]
- **Freedom Level**: [High / Medium / Low -- with rationale]
- **Target Environment**: [Model + platform + scope]
- **Token Budget**: [Estimated core file size, reference files if any]
- **Key Decisions**: [2-3 critical design choices with trade-offs]
- **Limitations**: [Known constraints and mitigations]

## Directory Structure

File tree showing all skill files and their purposes.

## Skill Files

Each file delivered in a clearly labeled code block. Core skill file first, then reference files, then scripts.

## Activation Tests

3-5 realistic prompts (with concrete detail, casual phrasing, specifics) that should trigger this skill, with expected behavior.

## Near-Miss Tests

2-3 realistic prompts that share keywords with the skill but should NOT trigger it, verifying the description's precision.

## Quality Checklist

Verification checklist the user runs against the delivered skill:

- [ ] Description answers WHAT and WHEN
- [ ] Description is third person, under 1024 characters
- [ ] Description is assertive enough to counter undertriggering
- [ ] Description includes semantic triggers (synonyms, related terms)
- [ ] Core file is under 500 lines
- [ ] No vague qualifiers remain ("briefly", "appropriately", "as needed")
- [ ] Key constraints include reasoning (the "why")
- [ ] Terminology is consistent throughout
- [ ] Examples are concrete with realistic detail, not abstract
- [ ] References are one level deep
- [ ] Large references (>300 lines) have a table of contents
- [ ] Freedom level matches task fragility
- [ ] Validation steps exist for critical operations
- [ ] All dependencies are documented
- [ ] Scripts use forward-slash paths only
- [ ] Default tool/approach chosen with escape hatches for alternatives
- [ ] No time-sensitive information without deprecation structure
