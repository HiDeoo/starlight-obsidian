import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-obsidian/edit/main/docs/',
      },
      sidebar: [
        { label: 'Getting Started', link: '/getting-started/' },
        { label: 'Configuration', link: '/configuration/' },
        { label: 'Features', link: '/features/' },
        {
          label: 'Guides',
          items: [{ label: 'Project Structure', link: '/guides/project-structure/' }],
        },
      ],
      social: {
        github: 'https://github.com/HiDeoo/starlight-obsidian',
      },
      title: 'Starlight Obsidian',
    }),
  ],
})
