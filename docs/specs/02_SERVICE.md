# 📐 Feature Spec: Service Module (The Rolodex)

**Project:** PROJ-02
**Persona:** Lisa (The Service Superstar)
**Goal:** A secure way to manage sponsees and service commitments without data leaks.

## 1. The "Why"
* **As:** A sponsor (Lisa).
* **I want to:** Keep notes on my sponsees (Step work progress, contact info, important dates).
* **So that:** I can be an effective guide without carrying a physical notebook that could be lost/read.

## 2. User Experience
* **Entry Point:** Sidebar -> "Service" (New Tab).
* **Views:**
    * **Active Sponsees:** List of people currently being sponsored.
    * **Alumni:** Past sponsees.
    * **Commitments:** Service positions (e.g., "Coffee Maker", "Greeter") with times.
* **Detail View:** Clicking a sponsee opens a secure card with:
    * Contact buttons (Call/Text - Unencrypted).
    * "Step Status" (Dropdown - Unencrypted).
    * **Private Notes:** A secure text area (Encrypted).

## 3. Technical Architecture

### Schema: `service` collection
| Field | Type | Encryption | Purpose |
| :--- | :--- | :--- | :--- |
| `uid` | String | No | Owner (Lisa) |
| `type` | String | No | 'sponsee' \| 'commitment' |
| `name` | String | **YES** | Sponsee Name (Protect Anonymity) |
| `contact` | String | **YES** | Phone/Email |
| `notes` | String | **YES** | Private thoughts/progress |
| `status` | String | No | 'active' \| 'alumni' |
| `meetingTime` | Timestamp | No | For reminders |

### Security Model (The "Rolodex" Rule)
* **Key Usage:** Data is encrypted using **Lisa's PIN**.
* **Implication:** If Lisa forgets her PIN, she loses her sponsee notes.
* **Privacy:** Sponsees do **not** have access to this data. It is a one-way record owned by the sponsor.

## 4. Edge Cases
* **Import/Export:** Sponsee data must be included in the JSON backup (encrypted).
* **Deletion:** Deleting a sponsee must perform a "soft delete" (move to trash) or confirm heavily, as notes are valuable.

## 5. Verification
* [ ] Verify Sponsee Name is stored as ciphertext in Firestore console.
* [ ] Verify Notes are unreadable if Vault is locked.
