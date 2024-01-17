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
          vault: '../fixtures/basics',
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
