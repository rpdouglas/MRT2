import { defineConfig } from 'vitepress'

// PROJ-102 (SEO/AEO) Phase 3: matches the URL scheme scripts/generate-docs-sitemap.mjs
// already uses (extensionless, index stripped) so canonical/og:url stay
// consistent with what's actually listed in sitemap.xml.
const SITE_ORIGIN = 'https://rpdouglas.github.io/MRT2';
function relativePathToUrl(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.md$/, '');
  const clean = withoutExt.replace(/(^|\/)index$/, '$1');
  return clean === '' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${clean}`;
}

export default defineConfig({
  title: "My Recovery Toolkit",
  description: "Privacy-first 12-step recovery toolkit and secure journaling guide.",
  // Deployed to GitHub Pages as a project page at rpdouglas.github.io/MRT2/
  // (see .github/workflows/deploy-docs.yaml) — base must match that path or
  // every asset request (/assets/*.css, /assets/*.js) resolves against the
  // wrong origin in production. Discovered during PROJ-102 Phase 1 while
  // validating the new sitemap generator against a real build.
  base: '/MRT2/',
  // Site-wide defaults; per-page canonical/og:title/og:description/og:url
  // are added below in transformHead using each page's own resolved title
  // and frontmatter `description`.
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'My Recovery Toolkit' }],
    ['meta', { property: 'og:image', content: `${SITE_ORIGIN}/og-image.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${SITE_ORIGIN}/og-image.png` }],
  ],
  transformHead: ({ pageData, title, description }) => {
    const url = relativePathToUrl(pageData.relativePath);
    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    ];
  },
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
          { text: 'My Dashboard', link: '/guide/02-dashboard' },
          { text: 'My Journal (Journal & AI)', link: '/guide/03-journal-and-ai' },
          { text: 'My Tasks (Tasks & Habits)', link: '/guide/04-tasks-habits' },
          { text: 'My Vitality', link: '/guide/05-vitality' },
          { text: 'My Workbooks', link: '/guide/06-workbooks' },
          { text: 'The Toolbox (CBT)', link: '/guide/08-cbt-tools' },
          { text: 'Daily Readings', link: '/guide/09-daily-readings' },
          { text: 'My Insights & Recovery Capital', link: '/guide/10-insights' },
          { text: 'My Recovery Games', link: '/guide/11-recovery-games' }
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
