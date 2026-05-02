# Skill Anti-Patterns

## 1. The Encyclopedia

Cramming exhaustive documentation into the core skill file. This wastes context on information the agent rarely needs. Instead: progressive disclosure with linked reference files.

## 2. The Obvious Instructor

Explaining things the model already knows. "Python is a programming language..." or "To read a file, you open it first..." wastes tokens teaching the teacher. Encode only the delta.

## 3. The Vague Guide

Using qualifiers like "briefly", "appropriately", "as needed", "follow best practices". These are noise. Replace with concrete criteria: word counts, specific rules, measurable thresholds.

## 4. The Swiss Army Knife

Skills that cover multiple unrelated capabilities. "Helps with PDFs, Excel files, and email formatting" is three skills masquerading as one. Each skill has a Single Capability.

## 5. The Ghost Description

A vague or generic description that fails to differentiate the skill. "Helps with documents" will never be selected over a skill that says "Extracts text and tables from PDF files using pdfplumber."

## 6. The Shouting Instructor

Piling on ALWAYS, NEVER, MUST, CRITICAL in all caps without explaining the reasoning. This creates rigid, brittle behavior. The model follows the letter of the rule but misses edge cases the rule doesn't cover. Instead: explain the why, and the model will apply the principle correctly even in novel situations.

## 7. The Overfit Fix

Adding narrow, specific patches that fix one test case but don't generalize. "If the input is a CSV with a column named 'Revenue', always put it in column C" -- this fixes one example and breaks the general case. Every change must improve the skill across its full range of inputs.

## 8. The Time Bomb

Encoding time-sensitive information ("If before August 2025, use the old API"). Instead: document the current method as primary, and place deprecated approaches in a clearly labeled legacy section.

## 9. The Terminology Shuffle

Using "endpoint", "route", "URL", and "path" interchangeably within one skill. Pick one term per concept and enforce it. Inconsistency breeds agent confusion.

## 10. The Nested Maze

Reference files that link to other reference files that link to more files. Agents may partially read or lose track. Keep references one level deep from the core skill file.

## 11. The Option Overload

Presenting too many alternatives without a clear default. "You can use pypdf, or pdfplumber, or PyMuPDF, or camelot, or tabula..." paralyzes the agent. Provide one default with escape hatches for specific scenarios.
