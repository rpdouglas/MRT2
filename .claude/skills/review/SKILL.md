---
name: review
description: Post-implementation review. Run after a feature is complete or after fixing a series of bugs. Checks for drift between what was built and the spec, CLAUDE.md / GEMINI.md accuracy, skill relevance, and any rules that were repeatedly violated during the session.
---

# MRT Post-Implementation Review

You are doing a review pass — no new code unless explicitly asked.

## 1. Directives Drift Check (CLAUDE.md / GEMINI.md)
Read the current CLAUDE.md / GEMINI.md and compare against what you observed during this session.
- Are any rules in CLAUDE.md / GEMINI.md outdated or inaccurate based on what you saw in the codebase?
- Are any rules missing that would have prevented the bugs or issues we just fixed?
- Is the master directives file clear and concise?

Flag each drift as: ADD / REMOVE / UPDATE / ACCURATE

## 2. Skill Relevance Check
For each skill invoked this session:
- Did the skill produce useful output or did you have to work around it?
- Are any instructions in the skill outdated or contradicted by what you saw in the codebase?
- Are any steps missing that would have caught the issues we just fixed?

## 3. Rules That Were Violated
List any CLAUDE.md / GEMINI.md or skill rules that were violated during this session — even if caught and fixed.
For each: state the rule, what happened, and whether the rule needs to be clearer or enforced differently.

## 4. Missing Rules
Based on the bugs and issues fixed this session — what rule, if it had existed, would have prevented them?
Write the rule in the exact format it should appear in CLAUDE.md / GEMINI.md or the relevant skill.

## 5. Firestore & Schema Drift
- Do firestore.rules reflect all collections touched this session?
- Does docs/SCHEMA_ARCHITECTURE.md match any new fields added?
- Are all new queries covered by an index in firestore.indexes.json?

## Output
A structured report with specific suggested edits — not prose.
For CLAUDE.md / GEMINI.md changes: show the exact line to add, remove, or update.
For skill changes: show the exact section and replacement text.
End with: READY TO APPLY — list the changes you want me to make, or LOOKS GOOD if no changes needed.