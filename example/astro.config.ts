import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightObsidian from 'starlight-obsidian'

export default defineConfig({
  integrations: [
    starlight({
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-obsidian/edit/main/example/',
      },
      plugins: [
        starlightObsidian({
          // vault: '../fixtures/basics',
          // vault: '../fixtures/not-a-vault',
          // vault: '../fixtures/links-markdown-shortest',
          // vault: '../fixtures/links-markdown-relative',
          // vault: '../fixtures/links-markdown-absolute',
          // vault: '../fixtures/links-wikilink-shortest',
          // vault: '../fixtures/links-wikilink-relative',
          vault: '../fixtures/links-wikilink-absolute',
        }),
      ],
      // TODO(HiDeoo)
      sidebar: [
        {
          label: 'Guides',
          items: [{ label: 'Example Guide', link: '/guides/example/' }],
        },
      ],
      title: 'Starlight Obsidian Example',
    }),
  ],
})
