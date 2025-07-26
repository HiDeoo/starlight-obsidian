import type { AstroIntegration } from 'astro'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import type { StarlightObsidianConfig } from '..'

import { rehypeStarlightObsidian } from './rehype'
import { vitePluginStarlightObsidianConfig } from './vite'

export function starlightObsidianIntegration(config: StarlightObsidianConfig): AstroIntegration {
  return {
    name: 'starlight-obsidian-integration',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            rehypePlugins: [rehypeStarlightObsidian, rehypeKatex],

            remarkPlugins: [[remarkMath, { singleDollarTextMath: config.math.singleDollarTextMath }]],
          },
          vite: {
            plugins: [vitePluginStarlightObsidianConfig(config)],
          },
        })
      },
    },
  }
}
