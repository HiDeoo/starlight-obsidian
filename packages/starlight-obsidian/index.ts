import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types'
import { z } from 'astro/zod'

import { starlightObsidianIntegration } from './libs/integration'
import { getObsidianPaths, getVault } from './libs/obsidian'
import { throwUserError } from './libs/plugin'
import { addObsidianFiles, getSidebarFromConfig, getSidebarGroupPlaceholder } from './libs/starlight'

const starlightObsidianConfigSchema = z.object({
  // TODO(HiDeoo)
  configFolder: z.string().startsWith('.').default('.obsidian'),
  // TODO(HiDeoo)
  ignore: z.array(z.string()).default([]),
  // TODO(HiDeoo) doc with @default
  output: z.string().default('notes'),
  // TODO(HiDeoo)
  sidebar: z
    .object({
      // TODO(HiDeoo)
      collapsed: z.boolean().default(false),
      // TODO(HiDeoo)
      collapsedFolders: z.boolean().optional(),
      // TODO(HiDeoo)
      label: z.string().default('Notes'),
    })
    .default({}),
  // TODO(HiDeoo) Add doc (absolute or relative path)
  // TODO(HiDeoo) vaultDir? Something else
  vault: z.string(),
})

export const obsidianSidebarGroup = getSidebarGroupPlaceholder()

export default function starlightObsidianPlugin(userConfig: StarlightObsidianUserConfig): StarlightPlugin {
  const parsedConfig = starlightObsidianConfigSchema.safeParse(userConfig)

  if (!parsedConfig.success) {
    throwUserError(
      `The provided plugin configuration is invalid.\n${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`,
    )
  }

  const config = parsedConfig.data

  return {
    name: 'starlight-obsidian-plugin',
    hooks: {
      async setup({ addIntegration, config: starlightConfig, logger, updateConfig }) {
        const updatedStarlightConfig: Partial<StarlightUserConfig> = {
          customCss: [...(starlightConfig.customCss ?? []), 'starlight-obsidian/styles'],
          sidebar: getSidebarFromConfig(config, starlightConfig.sidebar),
        }

        if (starlightConfig.components?.PageTitle) {
          logger.warn(
            'It looks like you already have a `PageTitle` component override in your Starlight configuration.',
          )
          logger.warn('To use `starlight-obsidian`, remove the override for the `PageTitle` component.\n')
        } else {
          updatedStarlightConfig.components = {
            PageTitle: 'starlight-obsidian/overrides/PageTitle.astro',
          }
        }

        const start = performance.now()
        logger.info('Generating Starlight pages from Obsidian vault…')

        const vault = await getVault(config)
        const obsidianPaths = await getObsidianPaths(vault, config.ignore)
        await addObsidianFiles(config, vault, obsidianPaths)

        const duration = Math.round(performance.now() - start)
        logger.info(`Starlight pages generated from Obsidian vault in ${duration}ms.`)

        addIntegration(starlightObsidianIntegration())
        updateConfig(updatedStarlightConfig)
      },
    },
  }
}

export type StarlightObsidianUserConfig = z.input<typeof starlightObsidianConfigSchema>
export type StarlightObsidianConfig = z.output<typeof starlightObsidianConfigSchema>
