# ⚙️ Standard Operating Procedures (SOP)

**Version:** 1.0
**Scope:** Management of external infrastructure, communications, and support.

## 1. Email Architecture (GoDaddy / Workspace)
To maintain professionalism and security, we do not use personal Gmail accounts for user-facing operations.

* **Primary Inbox (Licensed):** `hello@myrecoverytoolkit.ca`
    * *Use Case:* The main anchor for all third-party accounts (Google, Stripe, App Stores).
* **Aliases (Free routing to Primary):**
    * `support@myrecoverytoolkit.ca`: For user help, bug triage, and account deletion requests.
    * `admin@myrecoverytoolkit.ca`: For technical alerts (Firebase, GitHub).
    * `legal@myrecoverytoolkit.ca`: For privacy and terms inquiries.

## 2. Google & YouTube Ownership
We utilize Google's **Brand Account** structure to safely separate the business from personal identities.

* **The Anchor:** A new Google Account created specifically using the `hello@myrecoverytoolkit.ca` email address (Not a @gmail.com address).
* **The YouTube Channel:** Created as a "Brand Account" under the Anchor.
* **Access Management:** The Founder's personal email (`rpdouglas@gmail.com`) is invited as a "Manager" of the Brand Account. This allows the Founder to upload videos from their personal phone/desktop without needing the master `hello@` credentials.

## 3. Customer Support Workflow
1. **In-App Reporting:** User submits a bug via the `FeedbackModal.tsx`.
2. **Triage:** Admin views the report in the Admin Dashboard (`/admin`).
3. **Escalation:** Admin clicks "Generate Triage Report" and pastes the output directly into a new GitHub Issue for the next Sprint.
4. **Resolution:** If the user provided an email, reply via `support@myrecoverytoolkit.ca` once the bug is squashed.
