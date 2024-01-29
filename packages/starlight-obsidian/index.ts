import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types'
import { z } from 'astro/zod'

import { starlightObsidianIntegration } from './libs/integration'
import { getObsidianPaths, getVault } from './libs/obsidian'
import { throwUserError } from './libs/plugin'
import { addObsidianFiles, getSidebarFromConfig, getSidebarGroupPlaceholder } from './libs/starlight'

const starlightObsidianConfigSchema = z.object({
  /**
   * The name of the Obsidian vault configuration folder if different from the default one.
   *
   * @default '.obsidian'
   * @see https://help.obsidian.md/Files+and+folders/Configuration+folder
   */
  configFolder: z.string().startsWith('.').default('.obsidian'),
  /**
   * A list of glob patterns to ignore when generating the Obsidian vault pages.
   * This option can be used to ignore files or folders.
   *
   * @default []
   * @see https://github.com/mrmlnc/fast-glob#basic-syntax
   * @see https://help.obsidian.md/Files+and+folders/Accepted+file+formats
   */
  ignore: z.array(z.string()).default([]),
  /**
   * The name of the output directory containing the generated Obsidian vault pages relative to the `src/content/docs/`
   * directory.
   *
   * @default 'notes'
   */
  output: z.string().default('notes'),
  /**
   * The generated vault pages sidebar group configuration.
   */
  sidebar: z
    .object({
      /**
       * Whether the generated vault pages root sidebar group should be collapsed by default.
       *
       * @default false
       */
      collapsed: z.boolean().default(false),
      /**
       * Whether the sidebar groups of your vault nested folders should be collapsed by default.
       *
       * Defaults to the value of the `collapsed` option.
       */
      collapsedFolders: z.boolean().optional(),
      /**
       * The generated vault pages sidebar group label.
       *
       * @default 'Notes'
       */
      label: z.string().default('Notes'),
    })
    .default({}),
  /**
   * The absolute or relative path to the Obsidian vault to publish.
   */
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
      async setup({ addIntegration, command, config: starlightConfig, logger, updateConfig }) {
        if (command !== 'build' && command !== 'dev') {
          return
        }

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

        try {
          const start = performance.now()
          logger.info('Generating Starlight pages from Obsidian vault…')

          const vault = await getVault(config)
          const obsidianPaths = await getObsidianPaths(vault, config.ignore)
          await addObsidianFiles(config, vault, obsidianPaths, logger)

          const duration = Math.round(performance.now() - start)
          logger.info(`Starlight pages generated from Obsidian vault in ${duration}ms.`)
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error))

          throwUserError('Failed to generate Starlight pages from Obsidian vault.')
        }

        addIntegration(starlightObsidianIntegration())
        updateConfig(updatedStarlightConfig)
      },
    },
  }
}

export type StarlightObsidianUserConfig = z.input<typeof starlightObsidianConfigSchema>
export type StarlightObsidianConfig = z.output<typeof starlightObsidianConfigSchema>
