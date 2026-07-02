import type { AstroIntegration } from 'astro'

import type { StarlightObsidianConfig } from '..'

import { applyMarkdownPlugin } from './processor'
import { vitePluginStarlightObsidianConfig } from './vite'

export function starlightObsidianIntegration(config: StarlightObsidianConfig): AstroIntegration {
  return {
    name: 'starlight-obsidian-integration',
    hooks: {
      'astro:config:setup': ({ config: astroConfig, updateConfig }) => {
        applyMarkdownPlugin(astroConfig.markdown.processor, config)

        updateConfig({
          vite: {
            plugins: [vitePluginStarlightObsidianConfig(config)],
          },
        })
      },
    },
  }
}
