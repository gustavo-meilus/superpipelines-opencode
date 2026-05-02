# Token Optimization Strategies

## 1. Assume Intelligence

The model already knows how to code, write, reason, and use common tools. Only encode what it cannot infer: team conventions, domain-specific rules, non-obvious constraints, proprietary formats.

Before including any instruction, ask: "Would a senior engineer who just joined the team need to be told this?" If no, omit it.

## 2. Examples Over Explanations

One concrete input/output example teaches more than three paragraphs of abstract guidance. When choosing between explaining a rule and showing it, show it. When you need both, show first, then explain briefly.

## 3. Progressive Disclosure

Core file: essential instructions for the 80% case (under 500 lines). Reference files: detailed docs, edge cases, full example libraries. The agent reads reference files only when the task demands it.

## 4. Scripts Over Generation

Pre-built utility scripts are more reliable, save generation tokens, and ensure consistency. Prefer: "Run `python scripts/validate.py output/`" over embedding validation logic in the instructions.

## 5. Structural Compression

Use tables for parameter lists, decision matrices, and option comparisons. Use checklists for workflows. Use code blocks for exact formats. These structures convey more information per token than prose.

## 6. Active Pruning

After each iteration, review the skill and remove anything that is not demonstrably improving outcomes. Read the agent's reasoning traces -- if a section of the skill consistently causes wasted effort or confusion, cut it. A shorter skill that works is better than a comprehensive skill that distracts.
