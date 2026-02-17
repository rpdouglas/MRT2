# 📐 Feature Spec: Feedback & Bug Reporting

**Status:** Live (v1.6+)
**Context:** QA & User Testing support.

## 1. Overview
A native module allowing testers to report issues or suggest features without leaving the app. It prioritizes capturing technical context over user narrative to speed up debugging.

## 2. Technical Architecture
* **Component:** `FeedbackModal.tsx`
* **Trigger:** Accessible via the Sidebar (AppShell).
* **Storage:** Writes to the `feedback` root collection in Firestore.

### Metadata Capture
The system automatically appends the following to every report:
* `buildHash`: Cross-referenced against `build-info.json` to identify stale versions.
* `vaultUnlocked`: Helps identify if encryption logic was active during a crash.
* `route`: Identifies the specific page causing the issue.
* `userAgent`: Identifies device/browser specific bugs.

## 3. Security
* **Access:** Any authenticated user can create. Read access restricted to Admins.
* **Privacy:** Unencrypted collection. Users are warned via UI not to include Recovery PII.

## 4. Verification
* [ ] **Network Logic:** Submit while offline. Verify it appears in Firestore once reconnected.
* [ ] **Metadata:** Verify the `buildHash` in Firestore matches the one displayed in `VersionBadge`.
