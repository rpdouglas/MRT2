# 🛠️ Project 04: The Frictionless Core

**Objective:** Refine the core engine (Auth, Data Retrieval, Education) to improve user retention.
**Status:** 🟡 Active
**Personas Involved:** Universal (David, Ned, Lisa, Walt)

## 🏗️ Phase 1: The "Vault & Gate" Polish
* [ ] **Refresh Bug:** Fix Journal decryption race condition by wiring `isVaultUnlocked` to the query render.
* [ ] **Auth UI:** Redesign `Login.tsx` into a modern split Sign-In/Sign-Up flow.
* [ ] **Trust Badges:** Add "Zero-Knowledge Encrypted" badges to the sign-up screen.

## 🧠 Phase 2: The "Memory Engine"
* [ ] **Client-Side Search:** Build a search bar in `JournalHistory.tsx` to filter decrypted content and tags.
* [ ] **Insights Polish:** Add trend arrows to `JournalInsights.tsx`.
* [ ] **Interactive Word Cloud:** Make Word Cloud click-to-filter.

## 🎨 Phase 3: The "Knowledge Base"
* [ ] **VitePress Setup:** Initialize VitePress in a `/docs-site` directory for static hosting.
* [ ] **Documentation Migration:** Move Privacy Policy, TOS, and User Guide to the VitePress site.
* [ ] **App Integration:** Replace internal `UserGuide.tsx` with external links to the new site.
