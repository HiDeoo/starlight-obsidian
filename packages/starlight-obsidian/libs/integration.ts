import type { AstroIntegration } from 'astro'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { rehypeBlockIdentifiers } from './rehype'

export function starlightObsidianIntegration(): AstroIntegration {
  return {
    name: 'starlight-obsidian-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            rehypePlugins: [rehypeBlockIdentifiers, rehypeKatex],
            remarkPlugins: [remarkMath],
          },
        })
      },
    },
  }
}
