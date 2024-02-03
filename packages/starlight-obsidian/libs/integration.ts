import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import type { AstroIntegration } from 'astro'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import type { StarlightObsidianConfig } from '..'

import { getRehypeAutolinkHeadingsOptions, rehypeStarlightObsidian } from './rehype'
import { vitePluginStarlightObsidianConfig } from './vite'

export function starlightObsidianIntegration(config: StarlightObsidianConfig): AstroIntegration {
  return {
    name: 'starlight-obsidian-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            rehypePlugins: [
              ...(config.autoLinkHeadings
                ? [rehypeHeadingIds, [rehypeAutolinkHeadings, getRehypeAutolinkHeadingsOptions()]]
                : []),
              rehypeStarlightObsidian,
              rehypeKatex,
            ],
            remarkPlugins: [remarkMath],
          },
          vite: {
            plugins: [vitePluginStarlightObsidianConfig(config)],
          },
        })
      },
    },
  }
}
