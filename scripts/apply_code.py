import os

FENCE = chr(96) * 3

def update_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.replace('__FENCE__', FENCE))
    print(f"✅ Synchronized: {filepath}")

def main():
    print("🚀 Appending Persona-Driven Features to the Product Backlog...\n")

    update_file('docs/SPRINT_BOARD.md', r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 8.0 (The Road to 5,000)

## ✅ Completed Sprints
- [x] **Sprint 8.3:** Content Expansion. Integrated "Women for Recovery".
- [x] **Sprint 8.4:** The Polish Update. Implemented PROJ-26 The Beacon.
- [x] **Sprint 8.5:** The CBT Engine. Built the Tools Hub, Zero-Knowledge Rehydration, and 5 interactive SMART tools (CBA, ABC, DENTS, Personify, Lifestyle).

## 🟡 Sprint 8.0: The Road to 5,000 (Active)
- [ ] **Admin:** Receive $50,000 funding tranche.
- [ ] **PROJ-07:** Finalize Android App Store deployment (Asset Links, Play Console compliance).

## 🧊 Product Backlog (Future Epics)

### Core Product Enhancements
- [ ] **PROJ-28: The Resentment Burner (Ephemeral Journaling)** * *Target:* David / Early Recovery. 
  * *Scope:* A cathartic input field where toxic thoughts are visually "burned" and permanently deleted from device memory without ever touching Firestore.
- [ ] **PROJ-29: The Sponsor Passport (Selective Dashboard Sharing)** * *Target:* Ned & Lisa / Network Growth. 
  * *Scope:* A secure, time-boxed read-only view of a user's Vitality and Streak dashboard to share with sponsors. Generates organic B2B/Network viral growth.
- [ ] **PROJ-30: Predictive Trigger Heatmapping (AI Compass Upgrade)** * *Target:* Walt / Long-Term Insight. 
  * *Scope:* Upgrade the AI layer to correlate time-of-day, day-of-week, and Vitality deficits with low mood scores to predict relapse risk before it happens.
- [ ] **PROJ-31: The Amends Workshop (Step 8 & 9 Assistant)** * *Target:* Lisa & Walt / Mid-to-Late Stage. 
  * *Scope:* A dedicated sandbox for drafting apologies with an AI "Tone Checker" to ensure accountability without slipping into defensiveness or expectations.
""")

    print("\n🎉 Backlog updated! The new epics are officially on the roadmap.")

if __name__ == "__main__":
    main()