import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightObsidian, { obsidianSidebarGroup } from 'starlight-obsidian'

const site =
  process.env['VERCEL_ENV'] !== 'production' && process.env['VERCEL_URL']
    ? `https://${process.env['VERCEL_URL']}`
    : 'https://starlight-obsidian.vercel.app/'

export default defineConfig({
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-obsidian/edit/main/docs/',
      },
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: new URL('og.jpg', site).href },
        },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'Starlight plugin to publish Obsidian vaults.' } },
      ],
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
          items: ['getting-started', 'configuration'],
        },
        {
          label: 'Guides',
          items: [
            'guides/project-structure',
            'guides/ignoring-content',
            'guides/features',
            'guides/deployment',
            'guides/multiple-instances',
          ],
        },
        {
          label: 'Resources',
          items: [{ label: 'Plugins and Tools', link: '/resources/starlight/' }],
        },
        obsidianSidebarGroup,
      ],
      social: [
        { href: 'https://bsky.app/profile/hideoo.dev', icon: 'blueSky', label: 'Bluesky' },
        { href: 'https://github.com/HiDeoo/starlight-obsidian', icon: 'github', label: 'GitHub' },
      ],
      title: 'Starlight Obsidian',
    }),
  ],
  site,
})
