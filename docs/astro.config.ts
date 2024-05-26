import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightObsidian, { obsidianSidebarGroup } from 'starlight-obsidian'

export default defineConfig({
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-obsidian/edit/main/docs/',
      },
      plugins: [
        starlightObsidian({
          output: 'demo',
          sidebar: {
            collapsed: true,
            collapsedFolders: false,
            label: 'Demo',
          },
          vault: '../fixtures/demo',
        }),
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Getting Started', link: '/getting-started/' },
            { label: 'Configuration', link: '/configuration/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Project Structure', link: '/guides/project-structure/' },
            { label: 'Ignoring Content', link: '/guides/ignoring-content/' },
            { label: 'Features', link: '/guides/features/' },
            { label: 'Deployment', link: '/guides/deployment/' },
          ],
        },
        obsidianSidebarGroup,
      ],
      social: {
        github: 'https://github.com/HiDeoo/starlight-obsidian',
      },
      title: 'Starlight Obsidian',
    }),
  ],
})
