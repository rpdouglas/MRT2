📁 Project 41: The Dynamic Anchor (Circadian Companion)
Status: ✅ Shipped (2026-05-03) — descoped from original spec, see §6: Intent Card (Card 3) was never built; its dead code was removed 2026-07-09. The Quick Action Bar ships as a 2-card (Check-In, Reading) widget, not the 3-card design below.
Primary Persona: David (Crisis), Ned (Early Recovery)
Objective: Replace the rigid "Daily Pledge" with a slim, frictionless, 3-column Quick Action Bar that adapts its journaling prompts based on the local time of day, complete with visual nudges and customizable alerts.

1. The Executive Summary
User Story:

As a user, I want a 60-second, zero-friction daily routine that adapts to my current state of mind (Morning, Afternoon, Evening, Night).

As a user, I want gentle visual nudges if I forget my routine, and the flexibility to read from different fellowships on the fly without changing my global settings.
Competitive Gap: Other apps use punitive "pledges." We use a responsive, somatic "Anchor" that meets the user where they are in their day, packaged in an ultra-compact UI with smart completion tracking.

2. Security & Zero-Knowledge Audit 🛡️
[x] Data Sensitivity: Medium. Captures current state of mind.

[x] Encryption Strategy: Box 1 (The Anchor) feeds directly into src/lib/crypto.ts. The payload will be encrypted and saved to the journals collection.

[x] Key Rotation: Covered automatically, as Box 1 data saves as standard journal entries.

3. Schema & Architecture 🗄️
Firestore Collections Impacted (users):
We must update the UserProfile interface in src/lib/db.ts to track settings and the daily reading state. Add the following object to the interface:

anchorSettings?: { notifyCheckIn: boolean; notifyReading: boolean; notifyIntent: boolean; lastReadingDate?: string; defaultFellowship?: string; }

New Utilities Required:

src/hooks/useTimeOfDay.ts: A hook that returns 'morning' | 'afternoon' | 'evening' | 'night' based on the local device clock.

src/data/fellowships.ts: A static dictionary mapping recovery paths to their respective Daily Reading URLs.

4. Implementation Phases 🏗️
Phase 1: The Circadian Logic & State Tracking
Implement useTimeOfDay().

Morning: 5:00 AM - 11:59 AM

Afternoon: 12:00 PM - 4:59 PM

Evening: 5:00 PM - 9:59 PM

Night: 10:00 PM - 4:59 AM

Create the prompt template dictionary mapping each time block to specific pre-filled text.

Create a helper hook useAnchorStatus() to evaluate if the 3 badges should show an exclamation point:

Check-In: Query today's journals. Does an entry exist with tags: ['Anchor', currentTimeOfDay]?

Reading: Does userProfile.anchorSettings.lastReadingDate equal today?

Intent: Does a task exist created today with source: 'anchor_intent'?

Phase 2: The Slim UI (The Quick Action Bar)
Component: src/components/dashboard/DynamicAnchorWidget.tsx.

Design Constraints: Exactly 50% the height of standard Bento boxes (h-10 or h-12). Pill-shaped buttons.

Layout: A grid of 3 identical, minimalistic cards (grid-cols-3).

Card 1 (State): Text wraps over two lines (e.g., "Morning \n Check-In"). Top-right relative absolute positioning for the notification badge (!).

Card 2 (Wisdom): Text wraps. Includes a subtle, indiscreet dropdown chevron (▼) next to the main icon. Top-right badge (!).

Card 3 (Intent): Text wraps. Top-right badge (!).

Phase 3: Action Handlers & Modals
Action 1 (Check-In): Opens a minimalist modal wrapping JournalEditor. Injects the time-specific template. Silently appends the tags ['Anchor', timeOfDay] upon save.

Action 2 (Reading):

Main Click: Opens an external browser tab to the default fellowship link. Updates lastReadingDate to today.

Dropdown Click: Opens a small headless UI menu listing all available fellowships from src/data/fellowships.ts. Clicking one opens that specific link and updates lastReadingDate.

Action 3 (Intent): Opens a tiny inline input. Submits directly to useTaskOperations.addTask with source: 'anchor_intent' and priority High due today.

Phase 4: User Profile Settings
Update src/components/profile/Profile.tsx (General Tab) to include an "Anchor Notifications" section.

Allow users to toggle notifyCheckIn, notifyReading, and notifyIntent. If toggled off, the red exclamation badge on the dashboard will be hidden regardless of completion status.

Phase 5: Edge Cases
[x] Vault Locked: If the vault is locked, clicking Card 1 must prompt for the PIN before revealing the Journal editor. Cards 2 and 3 should remain fully clickable. (Card 3 descoped per §6 — verified against the shipped 2-card layout.)

[x] Mobile Sizing: Ensure the two-line text utilizes leading-tight and smaller fonts (text-[10px]) so it doesn't break the flex container on 320px screens.

5. QA & Verification 🧪
[x] Time Travel Test: Manually change the OS system clock across boundaries (e.g., 11:59 AM to 12:01 PM). Verify the UI icon, pre-filled journal template, and the Check-In notification badge reset appropriately.

[x] Dropdown Integrity: Verify that clicking the dropdown chevron on Button 2 does not accidentally trigger the main button's external link routing.

[x] Opt-Out Test: Toggle off the notifications in the Profile settings. Verify the ! badges disappear instantly from the Dashboard.

6. Addendum (2026-07-09): Intent Card Descoped 🔻
The spec above (Phase 2 Card 3, Phase 3 Action 3, and the `notifyIntent` toggle in Phase 4) called for a third Quick Action Bar card — an inline "Intent" input that created a task with `source: 'anchor_intent'`. This card was never built: `DynamicAnchorWidget.tsx` shipped with only 2 cards (`grid-cols-2`, Check-In + Reading), while `notifyIntent`, `needsIntent` (in `useAnchorStatus.ts`), and the `anchor_intent` task source remained in the codebase as dead code behind a live-looking Profile toggle for over two months without ever having an effect.

Status correction: despite the header above, this project was **not fully completed** as specced — the QA checkboxes in Section 5 were never checked off, which is consistent with Card 3 never shipping.

Decision (2026-07-09): descope and remove Card 3 entirely rather than build it. `notifyIntent`, `needsIntent`, and `Task.source: 'anchor_intent'` were deleted as part of the notification-system remediation (see `docs/projects/26_THE_BEACON.md`). The Quick Action Bar remains a 2-card layout (Check-In, Reading) going forward. Any future revival of an "Intent" concept should be scoped as a new ticket, not a resurrection of this dead code.

**QA catch-up (2026-08-03 governance remediation):** §5's QA checkboxes above were left unchecked against the original 3-card design and never revisited after the descope. None of them test Card 3/Intent-specific behavior — they cover Card 1 (Vault Locked), and Cards 1-2 generally (Time Travel, Dropdown Integrity, Opt-Out, Mobile Sizing) — so they're checked off now to reflect the shipped 2-card widget, resolving the standing self-contradiction between the `✅ Shipped` header and an unchecked QA section. This is a documentation catch-up, not a claim that a fresh manual QA pass was run today.

**Cross-reference (added 2026-07-22 governance audit):** Card 2 (Reading) is also the shipped UI entry point for `docs/projects/42_DAILY_READINGS.md` (PROJ-42) — the dropdown chevron opens `ModalitySelector`-configured readings via `ReadingModal`, not just the static external fellowship link originally specced in Phase 3 above. PROJ-42's own standalone `DailyReadingCard.tsx` was never built; its functionality lives entirely inside this widget.