import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "My Recovery Toolkit",
  description: "Privacy-first 12-step recovery toolkit and secure journaling guide.",
  base: '/',
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
          { text: 'My Journal (Journal & AI)', link: '/guide/03-journal-and-ai' },
          { text: 'The Ledger (Tasks)', link: '/guide/04-tasks-habits' },
          { text: 'The Pulse (Vitality)', link: '/guide/05-vitality' },
          { text: 'The Compass (Workbooks)', link: '/guide/06-workbooks' },
          { text: 'The Toolbox (CBT)', link: '/guide/08-cbt-tools' },
          { text: 'Daily Readings', link: '/guide/09-daily-readings' },
          { text: 'Insights & Recovery Capital', link: '/guide/10-insights' }
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
