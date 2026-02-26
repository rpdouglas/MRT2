# 📐 Feature Spec: Onboarding & The Gates

**Status:** Draft (Sprint 1)
**Access Level:** Free

## 1. The "Why" (User Story)
* **As a:** New user ("David" or "Ned")
* **I want to:** Understand the app's value quickly and set up my profile without confusion.
* **So that:** I can start tracking my sobriety and journaling immediately.

## 2. User Experience (The Flow)
### A. The Landing Page
* **Visuals:** Full MRT branding ("My Recovery Toolkit" + App Icon).
* **Content:** Features headshots and brief bios of our 4 Core Personas to help the user identify their journey stage. Includes a prominent link to the Notebook LM overview video.
* **Action:** Unified "Login / Create Account" button.

### B. The Auth Consolidation
* A single, clean interface replacing the two-step login. 

### C. The Forced Redirect
* **Logic:** Upon successful login/signup, the app checks `userProfile.hasCompletedOnboarding`.
* **Action:** If `false` (or missing), the user is routed to `/profile`.
* **Requirement:** They must enter a Display Name and Sobriety Date. Once saved, `hasCompletedOnboarding` is set to `true`, and they are routed to the Dashboard.

## 3. Technical Architecture
* **Data Model:** Checks and updates `users/{uid}` collection.
* **Routing:** Uses React Router DOM inside a protected route wrapper or an authentication listener effect.
