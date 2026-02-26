import os

# =============================================================================
# 1. VITEPRESS CONFIG & HOMEPAGE
# =============================================================================

config_mts = r'''import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "My Recovery Toolkit",
  description: "Documentation and User Guide",
  base: '/MRT2/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/01-getting-started' },
      { text: 'FAQ', link: '/support/faq' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation (App)', link: '/guide/installation' },
          { text: 'Free vs Premium', link: '/guide/freemium' },
          { text: 'Account & Vault', link: '/guide/01-getting-started' }
        ]
      },
      {
        text: 'Core Features',
        items: [
          { text: 'The Horizon (Dashboard)', link: '/guide/02-dashboard' },
          { text: 'The Vault (Journal & AI)', link: '/guide/03-journal-and-ai' },
          { text: 'The Ledger (Tasks)', link: '/guide/04-tasks-habits' },
          { text: 'The Pulse (Vitality)', link: '/guide/05-vitality' },
          { text: 'The Compass (Workbooks)', link: '/guide/06-workbooks' }
        ]
      },
      {
        text: 'Security & Data',
        items: [
          { text: 'Exports & Google Drive', link: '/guide/07-account-data' },
          { text: 'Privacy Policy', link: '/privacy' },
          { text: 'Terms of Service', link: '/tos' }
        ]
      },
      {
        text: 'Support',
        items: [
          { text: 'FAQ & Troubleshooting', link: '/support/faq' },
          { text: 'Changelog', link: '/support/changelog' }
        ]
      }
    ]
  }
})
'''

index_md = r'''---
layout: home

hero:
  name: "My Recovery Toolkit"
  text: "Documentation & Resources"
  tagline: The safest place to do the hardest work.
  actions:
    - theme: brand
      text: Read the Guide
      link: /guide/01-getting-started
    - theme: alt
      text: Open App
      link: https://www.myrecoverytoolkit.ca
---
'''

# =============================================================================
# 2. NEW SUPPORT PAGES
# =============================================================================

installation_md = r'''# 📱 Installing the App

My Recovery Toolkit is a **Progressive Web App (PWA)**. This means it runs securely on your device, works offline, and takes up a fraction of the storage space of a normal app, without needing an App Store.

## iOS (iPhone & iPad)
Apple requires manual installation for PWAs.
1. Open **Safari** and go to `www.myrecoverytoolkit.ca`.
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner.
5. The MRT icon will now appear on your home screen. Launch it from there!

## Android
1. Open **Chrome** and go to `www.myrecoverytoolkit.ca`.
2. You should see a prompt at the bottom of the screen that says **"Install App"**. Tap it.
3. If you don't see the prompt, tap the three dots (menu) in the top right of Chrome and select **"Add to Home screen"** or **"Install app"**.

## Desktop (Windows / Mac)
1. Open **Chrome** or **Edge** and navigate to the site.
2. Click the small "Install" icon (a screen with a down arrow) located on the far right side of the URL address bar.
'''

freemium_md = r'''# 💎 Free vs. Premium Tiers

My Recovery Toolkit operates on a "Freemium" model. Our core belief is that tools for acute crisis de-escalation should **always be free**. We only charge for features that cost us money to run (like advanced AI processing) or power-user tools for established sponsors.

## 🟢 The Free Tier (Standard)
Designed for immediate relief, habit building, and finding stability.
* **Unlimited Journaling:** Secure, zero-knowledge encryption for all entries.
* **The Ledger:** Unlimited task and habit tracking with "Smart Resets."
* **The Horizon:** Full dashboard tracking for clean time and gamification streaks.
* **The Pulse:** Unlimited somatic tracking (Fuel, Movement) and 4-7-8 Breathwork.
* **AI Access:** 1 free "Analysis Wizard" deep-dive per week.

## 🌟 MRT Premium (Supporter)
Designed for users in the maintenance phase looking for deep insights, and sponsors managing commitments.
* **Unlimited AI Compass:** Unlimited, on-demand Gemini 2.5 pattern recognition and deep-dive journal analysis.
* **The Digital Rolodex (Service Module):** A securely encrypted system to track sponsee step work, contact info, and meeting times.
* **Cloud Auto-Sync:** Automated, invisible JSON backups to your personal Google Drive.
* **PDF Exports:** Generate beautiful, formatted reports of your journal history for therapy or sponsorship sessions.
'''

faq_md = r'''# ❓ Frequently Asked Questions

### 🔒 Security
**I forgot my PIN. Can you reset it?**
No. MRT uses Zero-Knowledge encryption. Your PIN is the mathematical key used to encrypt your data. We do not store it, and we cannot bypass it. If you forget your PIN, your encrypted data (Journals, Workbooks) is permanently lost. 

**Is Google Gemini training on my private journal entries?**
No. When you request AI analysis, your data is decrypted locally, sent securely to Google's Enterprise API, processed statelessly, and instantly discarded. It is explicitly excluded from their public AI training models.

### 📶 Connectivity
**Can I use the app offline?**
Yes! MRT is built with "Offline-First" technology. If you are in a basement meeting room with no cell service, you can still write journal entries and log habits. The app will save them locally and sync them to the cloud the moment you reconnect.

### ⚙️ Account
**How do I delete my account?**
Go to your **Profile** -> **Data Management** and click the red "Delete Account" button. This instantly and permanently destroys your authentication profile and all associated data records on our servers.
'''

changelog_md = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.0.0 (Upcoming Launch)
* **Feature:** Initial Public Release!
* **Feature:** Zero-Knowledge Client-Side Encryption (AES-GCM).
* **Feature:** The Horizon Gamification Dashboard.
* **Feature:** The Pulse (Vitality Tracking & Breathwork).
* **Feature:** The Compass (Gemini 2.5 AI Analysis).
* **Feature:** Task Ledger with Smart Resets.
'''

# =============================================================================
# 3. SECTOR STUBS (For Documentation-Driven QA)
# =============================================================================
sector_stub = r'''# 🚧 [Feature Guide]

> **Note:** This section of the User Guide is currently being written alongside our active Quality Assurance checks. Check back soon!
'''


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Created/Updated: {path}")

if __name__ == "__main__":
    print("🚀 Rebuilding VitePress Knowledge Base Architecture...")
    
    # Config & Homepage
    write_file("docs-site/.vitepress/config.mts", config_mts)
    write_file("docs-site/index.md", index_md)
    
    # New Support Pages
    write_file("docs-site/guide/installation.md", installation_md)
    write_file("docs-site/guide/freemium.md", freemium_md)
    write_file("docs-site/support/faq.md", faq_md)
    write_file("docs-site/support/changelog.md", changelog_md)

    # Sector Stubs for QA
    write_file("docs-site/guide/01-getting-started.md", sector_stub.replace('[Feature Guide]', 'Account & Vault Setup'))
    write_file("docs-site/guide/02-dashboard.md", sector_stub.replace('[Feature Guide]', 'The Horizon Dashboard'))
    write_file("docs-site/guide/03-journal-and-ai.md", sector_stub.replace('[Feature Guide]', 'Journaling & AI Analysis'))
    write_file("docs-site/guide/04-tasks-habits.md", sector_stub.replace('[Feature Guide]', 'Tasks & Habits'))
    write_file("docs-site/guide/05-vitality.md", sector_stub.replace('[Feature Guide]', 'Vitality & Breathwork'))
    write_file("docs-site/guide/06-workbooks.md", sector_stub.replace('[Feature Guide]', 'Workbooks & The Compass'))
    write_file("docs-site/guide/07-account-data.md", sector_stub.replace('[Feature Guide]', 'Data Export & Deletion'))

    # Clean up old monolithic guide
    try:
        os.remove("docs-site/guide.md")
        print("🗑️  Removed old monolithic guide.md")
    except FileNotFoundError:
        pass

    print("✨ Documentation site successfully restructured. Run 'npm run docs:dev' to preview!")