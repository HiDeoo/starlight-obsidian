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
        { label: 'Features', link: '/features/' },
      ],
      social: {
        github: 'https://github.com/HiDeoo/starlight-obsidian',
      },
      title: 'Starlight Obsidian',
    }),
  ],
})
