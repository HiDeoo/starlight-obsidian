import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types'
import type { AstroIntegrationLogger } from 'astro'
import { z } from 'astro/zod'

import { starlightObsidianIntegration } from './libs/integration'
import { getObsidianPaths, getVault } from './libs/obsidian'
import { throwUserError } from './libs/plugin'
import { addObsidianFiles, getSidebarFromConfig, getSidebarGroupPlaceholder } from './libs/starlight'

const starlightObsidianConfigSchema = z.object({
  /**
   * Add links to Starlight headings to make it easier to share a link to a specific section of a page.
   *
   * @default false
   */
  autoLinkHeadings: z.boolean().default(false),
  /**
   * The name of the Obsidian vault configuration folder if different from the default one.
   *
   * @default '.obsidian'
   * @see https://help.obsidian.md/Files+and+folders/Configuration+folder
   */
  configFolder: z.string().startsWith('.').default('.obsidian'),
  /**
   * Whether the Starlight Obsidian plugin should copy known Starlight frontmatter fields from Obsidian notes to the
   * generated pages.
   *
   * This is useful if you want to customize the generated Starlight pages from Obsidian. Note that the values are not
   * validated and are copied as-is so it's up to you to ensure they are compatible with Starlight.
   *
   * @default false
   * @see https://starlight.astro.build/reference/frontmatter/
   */
  copyStarlightFrontmatter: z.boolean().default(false),
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
   * Whether the Starlight Obsidian plugin should skip the generation of the Obsidian vault pages.
   *
   * This is useful to disable generating the Obsidian vault pages when deploying on platforms that do not have access
   * to the Obsidian vault. This will require you to build and commit the pages locally ahead of time.
   *
   * @default false
   */
  skipGeneration: z.boolean().default(false),
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
   * Determines if the table of contents top-level heading should be the Starlight default one ("Overview") or the page
   * title.
   * This option is useful when the Obsidian vault pages already have a top-level heading named "Overview".
   *
   * @default 'title'
   */
  tableOfContentsOverview: z.union([z.literal('default'), z.literal('title')]).default('default'),
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

        const customCss = [...(starlightConfig.customCss ?? []), 'starlight-obsidian/styles/common']

        if (config.autoLinkHeadings) {
          customCss.push('starlight-obsidian/styles/autolinks-headings')
        }

        const updatedStarlightConfig: Partial<StarlightUserConfig> = {
          customCss,
          sidebar: getSidebarFromConfig(config, starlightConfig.sidebar),
        }

        if (!updatedStarlightConfig.components) {
          updatedStarlightConfig.components = {}
        }

        if (starlightConfig.components?.PageTitle) {
          logComponentOverrideWarning(logger, 'PageTitle')
        } else {
          updatedStarlightConfig.components.PageTitle = 'starlight-obsidian/overrides/PageTitle.astro'
        }

        if (config.tableOfContentsOverview === 'title') {
          if (starlightConfig.components?.PageSidebar) {
            logComponentOverrideWarning(logger, 'PageSidebar')
          } else {
            updatedStarlightConfig.components.PageSidebar = 'starlight-obsidian/overrides/PageSidebar.astro'
          }
        }

        if (config.skipGeneration) {
          logger.warn(
            `Skipping generation of Starlight pages from Obsidian vault as the 'skipGeneration' option is enabled.`,
          )
        } else {
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
        }

        addIntegration(starlightObsidianIntegration(config))
        updateConfig(updatedStarlightConfig)
      },
    },
  }
}

function logComponentOverrideWarning(logger: AstroIntegrationLogger, component: string) {
  logger.warn(`It looks like you already have a \`${component}\` component override in your Starlight configuration.`)
  logger.warn(`To use \`starlight-obsidian\`, remove the override for the \`${component}\` component.\n`)
}

export type StarlightObsidianUserConfig = z.input<typeof starlightObsidianConfigSchema>
export type StarlightObsidianConfig = z.output<typeof starlightObsidianConfigSchema>
