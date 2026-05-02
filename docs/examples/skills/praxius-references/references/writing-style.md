# Skill Writing Style Guide

## The 6 Writing Rules

### Rule 1: Imperative Form

Use direct imperatives: "Extract the text", "Validate the output", "Run the script". Not "You should extract" or "The text is extracted."

### Rule 2: Explain the Why

For every significant instruction, include the reasoning. The model will apply a well-understood principle more reliably and flexibly than a rigid command it follows by rote.

Instead of: "ALWAYS use pdfplumber."
Write: "Use pdfplumber for text extraction -- it handles multi-column layouts and embedded tables that PyPDF frequently misses."

Instead of: "NEVER skip the validation step."
Write: "Run validation after every transformation. Skipping it risks propagating corrupted data into downstream steps, which is much harder to debug after the fact."

### Rule 3: Theory of Mind

Write the skill from the perspective of understanding what the model needs to succeed, not just what you want it to do. Anticipate where it might go wrong, and preemptively address those points with reasoning rather than prohibitions.

### Rule 4: Default with Escape Hatch

When multiple tools or approaches exist, choose one as the default and mention alternatives only for specific circumstances.

Instead of: "You can use pypdf, or pdfplumber, or PyMuPDF, or..."
Write: "Use pdfplumber for text extraction. For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."

### Rule 5: Concrete Over Abstract

One input/output example teaches more than three paragraphs of explanation. When choosing between explaining a rule and showing it, show it. When you need both, show first, explain briefly after.

### Rule 6: Draft Then Revise

Write the first draft of the skill, then read it with fresh eyes. Ask: Is every section earning its token cost? Are the instructions clear to someone encountering this for the first time? Is the "why" present for every significant constraint? Revise before delivering.

---

## Communication Calibration

Skills are increasingly created by users across a wide range of technical familiarity. Pay attention to context cues -- vocabulary, question phrasing, domain references -- to calibrate communication.

### Default register

Use clear, jargon-light language by default. Terms like "evaluation" and "benchmark" are acceptable. Terms like "JSON schema", "assertion", "frontmatter", and "progressive disclosure" should be briefly explained on first use unless the user has demonstrated familiarity.

### Technical users

If the user demonstrates technical fluency (uses precise terminology, references specific tools, discusses implementation details), match their register. Skip explanations of concepts they clearly understand.

### Non-technical users

If the user is less technical, use analogies and plain language. Frame skill creation in terms of "teaching the AI a recipe" rather than "engineering a context module." Guide them through file structure and metadata with concrete examples rather than abstract rules.
