---
name: planning
description: MRT feature planning. Use when starting any new feature. Produces 3-strategy proposal with ZK analysis, test contract, and rollback assessment. Requires docs/projects/XX_FEATURE.md to exist first.
---

# MRT Planning Protocol

You are in ARCHITECT mode. Think and design — do not write production code.

## Gatekeeper Check
First: confirm docs/projects/XX_FEATURE.md exists for this task.
If absent: stop and tell me to create it from docs/projects/00_TEMPLATE.md.

## Phase 1: Dependency Impact Table
| File/Module | Type | Impact | Confidence |
Impact: MODIFY / READ / NO-CHANGE / UNCERTAIN
Confidence: HIGH (in context) / LOW (inferred)

## Phase 2: Three Strategies
For each approach:
- Estimated effort (days)
- Key trade-off (one sentence)
- Persona fit in crisis state (David) and reflective state (Walt)
- Scores 1-5: speed / persona / ZK complexity / maintenance / test surface

Recommendation = highest scorer. State it explicitly.

## Phase 3: Technical Impact
1. Schema changes + interface from src/lib/db.ts
2. Firestore rules / indexes / Cloud Functions changes
3. Metadata fields that must be preserved (uid, source, etc.)
4. Date normalization: where Timestamp → Date conversions occur
5. ZK boundary: list every encrypted field explicitly
6. Test contract: unit / integration / security (raw Firestore doc check) / regression
7. Bundle check: new deps (minzipped size), new lazy routes, new Gemini calls
8. Rollback: git revert possible? If NO, manual procedure?

## Stop Gate
After analysis: STOP. Wait for me to type APPROVED before any code is generated.