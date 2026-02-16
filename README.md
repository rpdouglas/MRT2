# 🛡️ My Recovery Toolkit (MRT)
### *Recovery is a High-Performance Lifestyle*

My Recovery Toolkit is a high-performance, **Zero-Knowledge** digital companion designed for individuals navigating 12-Step and Buddhist-inspired recovery journeys. Built with a focus on privacy, somatic regulation, and AI-driven insights, MRT meets users exactly where they are—from the acute crisis of Day 1 to the seasoned maintenance of Year 35.

## 🗝️ The Zero-Knowledge Advantage
Unlike traditional wellness apps, MRT is built on the principle that **we cannot leak what we cannot read.**
* **Client-Side Encryption:** All sensitive data (Journals, Workbook answers, Sponsee notes) is encrypted on your device using the **Web Crypto API (AES-GCM)**.
* **Mathematical Privacy:** Your encryption key is derived from your private PIN + a unique salt using **PBKDF2**. This key is never stored on our servers.
* **Data Sovereignty:** You own your data. Export your entire history to PDF or JSON at any time.

## 🚀 Key Features

* **The Horizon (Dashboard):** Real-time sobriety counter, habit streaks, and a "Bio-Rhythm" snapshot of your daily balance.
* **The Vault (Secure Journaling):** Encrypted reflections with integrated **Gemini AI** for sentiment analysis and pattern recognition.
* **The Library (Interactive Workbooks):** Structured 12-Step, CBT, and Recovery Dharma modules to facilitate deep inner work.
* **The Pulse (Vitality):** Somatic regulation tools including a guided **4-7-8 Breathwork** pacer and activity logging.
* **The Compass (AI Insights):** Analyzes decrypted history to identify subtle relapse triggers and emotional trends.

## 🎨 Design System: Vibrant Momentum
MRT utilizes a high-saturation, motion-heavy design system designed to signal life and energy. 
* **Atmospheric Tinting:** Each module has a unique color signature to orient users emotionally.
* **100dvh Layouts:** Immersive, app-like experience optimized for mobile PWA usage.
* **Tactile Feedback:** Haptic triggers for breathwork and task completion.

## 🛠️ Tech Stack
* **Frontend:** React 19 + Vite + Tailwind CSS v4
* **Backend:** Firebase (Auth, Firestore, Hosting)
* **Intelligence:** Google Gemini 2.5 (Flash/Pro Cascade)
* **Security:** AES-GCM (Client-side) + PBKDF2 Key Derivation
* **Infrastructure:** GitHub Actions (CI/CD) + DevContainers (Codespaces)

## 🏁 Getting Started

### Prerequisites
* Node.js (v20+)
* Firebase CLI

### Installation
1.  **Clone the Repo:**
    \`\`\`bash
    git clone https://github.com/rpdouglas/MRT2.git
    cd MRT2
    \`\`\`
2.  **Install Dependencies:**
    \`\`\`bash
    npm install
    \`\`\`
3.  **Environment Setup:**
    Create a \`.env\` file in the root and add your Firebase and Gemini credentials.
4.  **Run Development Server:**
    \`\`\`bash
    npm run dev
    \`\`\`

## 📜 Documentation
For detailed technical specifications, refer to the \`docs/\` directory:
* [Infrastructure & DevOps](./docs/specs/13_INFRASTRUCTURE.md)
* [Security Model](./docs/specs/SECURITY_ZERO_KNOWLEDGE.md)
* [Gamification Engine](./docs/specs/07_GAMIFICATION.md)

---
**Developed with purpose by Clean and Sober Ryan.**
*Disclaimer: MRT is a self-help tool and does not provide medical advice or crisis intervention.*
