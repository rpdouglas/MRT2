# 📐 Feature Spec: Onboarding & The Gates

**Status:** Live (Sprint 5)
**Access Level:** Free / Public

## 1. The "Why" (User Story)
* **As a:** New user ("David" or "Ned")
* **I want to:** Understand the app's value quickly and set up my profile without friction.
* **So that:** I can start tracking my sobriety and journaling securely.

## 2. User Experience (The Flow)
### A. The Landing Page (The Interactive Showcase)
* **Visuals:** 60/40 Asymmetrical Layout on Desktop. Stacks vertically on Mobile.
* **Left Column:** MRT Branding, Empathetic Blurb, and a primary "Begin Journey" CTA. Features a large, glassmorphism-wrapped Notebook LM YouTube Demo embed.
* **Right Column:** Interactive Persona Grid.
    * *Desktop:* Hovering transitions headshots to bios.
    * *Mobile:* Tapping opens a clean modal with the Bio image stacked above the Persona's YouTube Video.

### B. The Auth Consolidation
* A single, clean tabbed glassmorphism card in `Login.tsx`.
* Users can cleanly toggle between "Sign In" and "Create Account".
* The "Create Account" tab dynamically reveals "Confirm Password" and "Privacy Guarantee" trust badges.

### C. The Native Link Tree (`/links`)
* **Purpose:** A standalone, database-free public route designed to capture social media traffic (Instagram/TikTok bio links) and direct them to the app, the VitePress guide, or support.
* **Architecture:** Bypasses the `PrivateRoute` wrapper. Uses hardcoded `LinkItem` data to ensure instantaneous load times even on poor 3G connections.

### D. The Forced Redirect (The Trap)
* **Logic:** Upon successful login/signup, the app checks `userProfile.hasCompletedOnboarding`.
* **Action:** If `false` (or missing), the user is routed to `/profile`.
* **Requirement:** They must enter a Display Name and Sobriety Date. Once saved, `hasCompletedOnboarding` is set to `true`, releasing them to the Dashboard.

## 3. Technical Architecture
* **Data Model:** Checks and updates `users/{uid}` collection.
* **Routing:** Uses React Router DOM inside a `useEffect` authentication listener for private routes.
