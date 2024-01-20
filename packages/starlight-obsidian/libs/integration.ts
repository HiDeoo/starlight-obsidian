import type { AstroIntegration } from 'astro'

import { rehypeBlockIdentifiers } from './rehype'

export function starlightObsidianIntegration(): AstroIntegration {
  return {
    name: 'starlight-obsidian-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            rehypePlugins: [rehypeBlockIdentifiers],
          },
        })
      },
    },
  }
}
