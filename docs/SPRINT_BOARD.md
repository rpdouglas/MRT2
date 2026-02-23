# 🏃 Active Sprint Board
**Sprint:** 5.1 "The Digital Rolodex"
**Start Date:** 2026-02-23
**Goal:** Implement the backend schema, crypto hooks, and UI scaffold for the Service Module.

## 📌 To Do (Project 05 - Sprint 1)
- [ ] **Schema:** Scaffold the `service` collection structure in Firestore.
- [ ] **Crypto Hook:** Build `useServiceData()` hook to securely handle granular encryption for sponsee names, contact info, and notes.
- [ ] **Data Model:** Ensure deleting a sponsee deletes their encrypted notes (crypto-shredding).
- [ ] **UI Scaffold:** Create `pages/Service.tsx` with "Active" and "Alumni" tabs.

## 🚧 In Progress
- [ ] Requirements gathering and architectural review for granular encryption vs bulk blob encryption.

## ✅ Done (Previous Sprint)
- [x] **Project 04 Closed:** Completed "The Knowledge Base" VitePress migration and documentation sync.
- [x] **CI/CD:** Split pipelines for Firebase (App) and GitHub Pages (Docs).
- [x] **Linting:** Fixed VitePress cache scanning bug in ESLint.
