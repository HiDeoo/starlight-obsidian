import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    starlight({
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-obsidian/edit/main/docs/',
      },
      sidebar: [{ label: 'Features', link: '/features/' }],
      title: 'Starlight Obsidian',
    }),
  ],
})
