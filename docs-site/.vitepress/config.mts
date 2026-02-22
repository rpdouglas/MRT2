import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "My Recovery Toolkit",
  description: "Documentation and User Guide",
  base: '/MRT2/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide' }
    ],
    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'User Guide', link: '/guide' },
          { text: 'Privacy Policy', link: '/privacy' },
          { text: 'Terms of Service', link: '/tos' }
        ]
      }
    ]
  }
})
