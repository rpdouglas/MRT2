📁 Project 38: The Urge Intervention System (“The Lifeline Protocol”)
Status: ⚪ Planned
Primary Persona: David (Crisis) → Secondary: Ned (Early Recovery)
Objective: Provide a zero-friction, real-time intervention flow that interrupts urges and guides the user through a structured, somatic-first recovery protocol within 3–5 minutes.

1. The Executive Summary
User Story:
As David, I want to tap one button when I feel an urge so that I can calm down, think clearly, and not relapse.
Competitive Gap:
Most recovery apps (e.g., I Am Sober, Reframe) focus on tracking or reflection after the fact.
MRT will provide a real-time intervention protocol that:
•	regulates the nervous system
•	guides cognition
•	redirects behavior

2. Security & Zero-Knowledge Audit 🛡️
•	Data Sensitivity: Medium–High
o	Captures emotional state, triggers, and behavioral responses.
•	Encryption Strategy:
o	Use src/lib/crypto.ts for:
	Optional user reflections (post-intervention notes)
o	Core event metadata remains unencrypted for analytics:
	trigger_type
	context_tags
	completed
•	Key Rotation:
o	If reflections are stored in journals, they are automatically included in executePinRotation.
o	If stored separately (urge_events), must be included in rotation pipeline if encrypted fields exist.

3. Schema & Architecture 🗄️
🔥 Architectural Decision
Create a new lightweight collection for structured events:
👉 urge_events
This avoids polluting journals and enables fast analytics.

Firestore Collections Impacted
urge_events/{eventId}
export interface UrgeEvent {
  uid: string;

  // Core tracking
  createdAt: number;
  triggerType: 'manual' | 'notification' | 'ai_detected';

  // Context
  contextTags: string[]; // ["stress", "alone", "evening"]
  locationState?: 'home' | 'outside' | 'social' | 'unknown';

  // Flow tracking
  stagesCompleted: {
    regulate: boolean;
    orient: boolean;
    reframe: boolean;
    action: boolean;
  };

  completed: boolean;

  // Optional metrics
  moodBefore?: number;
  moodAfter?: number;

  // Actions taken
  actions: string[]; // ["called_friend", "breathwork", "journal"]

  // Reflection (ENCRYPTED if present)
  reflection?: string; // encrypted blob
}

**Implementation note (added 2026-07-16 governance audit):** When this collection is built, add an owner-scoped `firestore.rules` entry in the same PR that ships the first write path (matching the `journals`/`tasks` pattern: `allow create: if isCreatingOwnedResource(); allow read, update, delete: if isResourceOwner();`) — do not defer it to a follow-up.

Type Location
src/lib/types/urge.ts

🔹 Phase 1: Logic & State (Foundation)
A. Context / Hook
Create:
useUrgeIntervention.ts
Responsibilities:
•	manage flow state (stage machine)
•	create/update urge_events
•	handle transitions

B. State Machine
type UrgeStage =
  | 'idle'
  | 'interrupt'
  | 'regulate'
  | 'orient'
  | 'reframe'
  | 'action'
  | 'complete';
________________________________________
C. Core Functions
•	startUrgeFlow(triggerType)
•	completeStage(stage)
•	logContext(tags)
•	logAction(action)
•	completeFlow()
________________________________________
D. Firebase Integration
•	createUrgeEvent()
•	updateUrgeEvent()
Include:
•	optimistic updates
•	offline support via TanStack Query
________________________________________
E. Guard Clauses
•	if (!user) return
•	if (!isVaultUnlocked && reflection) block input
________________________________________
________________________________________
🔹 Phase 2: UI/UX & Gamification (The Experience)
________________________________________
🎨 Screen 1: INTERRUPT
Component: UrgeInterruptScreen.tsx
•	full-screen modal
•	minimal UI
•	animated gradient pulse
Copy:
“You’re safe. This will pass.”
Buttons:
•	Primary: “Start”
•	Secondary: “Close”
________________________________________
🌬️ Screen 2: REGULATE
Component: reuse/enhance existing:
•	BreathworkPacer.tsx
Enhancements:
•	auto-start
•	3–5 cycles max
•	haptic feedback
On complete:
•	call completeStage('regulate')
________________________________________
🧭 Screen 3: ORIENT
Component: UrgeOrientScreen.tsx
Tap-based selections:
Prompt 1: “What’s happening?”
•	craving
•	stress
•	anger
•	boredom
•	memory
Prompt 2: “Where are you?”
•	alone
•	with people
•	home
•	outside
Store:
•	contextTags
________________________________________
🧠 Screen 4: REFRAME
Component: UrgeReframeScreen.tsx
Options:
A. AI Micro Response
•	call Gemini (short prompt)
•	max 2–3 sentences
B. CBT Quick Prompts
•	“Play the tape forward”
•	“What happens next?”
C. Personal Anchor
•	sobriety date
•	last milestone
•	prior journal snippet
________________________________________
🚀 Screen 5: ACTION
Component: UrgeActionScreen.tsx
Buttons:
•	Call someone
•	Open meeting link
•	Go outside (log movement)
•	Write in journal
Each:
•	logs actions[]
•	deep-links to feature
________________________________________
🟢 Screen 6: COMPLETE
Component: UrgeCompleteScreen.tsx
Copy:
“You made a different choice. That matters.”
Gamification:
•	+XP (25–50)
•	streak protection flag
Optional:
•	“Add a note” → encrypted journal entry
________________________________________
________________________________________
🔹 Phase 3: Edge Cases
•	Offline Mode
o	Queue event locally
o	Sync later
•	Vault Locked
o	Allow full flow
o	Disable reflection input
•	User Exits Early
o	mark completed = false
o	still store partial data
•	320px Screens
o	large buttons
o	vertical stacking
o	no dense text
________________________________________
________________________________________
5. QA & Verification 🧪
Unit Tests
•	useUrgeIntervention.test.ts
o	state transitions
o	stage completion
o	event creation
________________________________________
Integration Tests
•	simulate full flow
•	verify Firestore writes
________________________________________
The Subway Test 🚇
•	trigger urge offline
•	complete flow
•	reconnect → verify sync
________________________________________
The "Crisis Speed" Test ⚡
•	time from tap → breathwork start < 1 second
________________________________________
The "Emotional Load" Test 🧠
•	ensure:
o	no typing required
o	max 3 taps per screen
________________________________________
________________________________________
🔮 6. Future Extensions (Already Roadmap-Aligned)
•	Integrate with:
o	PROJ-33 Predictive Relapse Engine
o	PROJ-35 Autopsy Engine
•	Add:
o	voice input
o	sponsor ping
o	adaptive AI flow
________________________________________
🧭 7. Success Metrics (Critical)
Track:
•	% of users using SOS
•	completion rate of flow
•	drop-off per stage
•	relapse rate correlation
•	Day 1 → Day 7 retention lift
________________________________________
🧠 8. Architectural Fit
This feature directly strengthens:
•	David (Crisis) → Immediate intervention
•	Ned (Early) → Habit reinforcement
•	Lisa (Service) → Future sponsor alerts
•	Walt (Long-term) → Data for insights
________________________________________
💡 Final Positioning
This is not just a feature.
👉 It becomes the emotional core of the app
👉 The reason users open MRT instead of anything else
