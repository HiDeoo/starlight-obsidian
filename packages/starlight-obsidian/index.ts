import { randomBytes } from 'node:crypto'

import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types'
import type { AstroIntegrationLogger } from 'astro'
import { z } from 'astro/zod'

import { starlightObsidianIntegration } from './libs/integration'
import { getObsidianPaths, getVault } from './libs/obsidian'
import { throwUserError } from './libs/plugin'
import { addObsidianFiles, getSidebarFromConfig, getSidebarGroupPlaceholder, type SidebarGroup } from './libs/starlight'

const starlightObsidianConfigSchema = z.object({
  /**
   * The name of the Obsidian vault configuration folder if different from the default one.
   *
   * @default '.obsidian'
   * @see https://help.obsidian.md/Files+and+folders/Configuration+folder
   */
  configFolder: z.string().startsWith('.').default('.obsidian'),
  /**
   * Defines which frontmatter fields the Starlight Obsidian plugin should copy from Obsidian notes to the generated
   * pages.
   *
   * By default (`none`), all unsupported properties are ignored and not exported. Set this option to `starlight` to
   * copy all known Starlight frontmatter fields from an Obsidian note to the associated generated page or to `all` to
   * copy all frontmatter fields.
   *
   * This option is useful if you want to customize the generated Starlight pages from Obsidian. Note that the values
   * are not validated and are copied as-is so it's up to you to ensure they are compatible with Starlight.
   *
   * @default 'none'
   * @see https://starlight.astro.build/reference/frontmatter/
   */
  copyFrontmatter: z.union([z.literal('none'), z.literal('starlight'), z.literal('all')]).default('none'),
  /**
   * @deprecated Use the {@link StarlightObsidianUserConfig.copyFrontmatter} option instead.
   */
  copyStarlightFrontmatter: z.never().optional(),
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

let overridesInjected = false

export const obsidianSidebarGroup = getSidebarGroupPlaceholder()

export default function starlightObsidianPlugin(userConfig: StarlightObsidianUserConfig): StarlightPlugin {
  return makeStarlightObsidianPlugin(obsidianSidebarGroup)(userConfig)
}

export function createStarlightObsidianPlugin(): [plugin: typeof starlightObsidianPlugin, sidebarGroup: SidebarGroup] {
  const sidebarGroup = getSidebarGroupPlaceholder(Symbol(randomBytes(24).toString('base64url')))
  return [makeStarlightObsidianPlugin(sidebarGroup), sidebarGroup]
}

function makeStarlightObsidianPlugin(
  sidebarGroup: SidebarGroup,
): (userConfig: StarlightObsidianUserConfig) => StarlightPlugin {
  overridesInjected = true

  return function starlightObsidianPlugin(userConfig) {
    const parsedConfig = starlightObsidianConfigSchema.safeParse(userConfig)

    if (!parsedConfig.success) {
      const isUsingDeprecatedCopyStarlightFrontmatter = parsedConfig.error.issues.some(
        (issue) => issue.path.join('.') === 'copyStarlightFrontmatter',
      )

      if (isUsingDeprecatedCopyStarlightFrontmatter) {
        throwUserError(
          'The `copyStarlightFrontmatter` option has been deprecated in favor of the `copyFrontmatter` option.',
          'For more information see https://starlight-obsidian.vercel.app/configuration/#copyfrontmatter',
        )
      }

      throwUserError(
        `The provided plugin configuration is invalid.\n${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`,
      )
    }

    const config = parsedConfig.data

    return {
      name: 'starlight-obsidian-plugin',
      hooks: {
        async 'config:setup'({
          addIntegration,
          addRouteMiddleware,
          command,
          config: starlightConfig,
          logger,
          updateConfig,
        }) {
          if (command !== 'build' && command !== 'dev') {
            return
          }

          if (config.tableOfContentsOverview === 'title') {
            addRouteMiddleware({ entrypoint: 'starlight-obsidian/middleware' })
          }

          const updatedStarlightConfig: Partial<StarlightUserConfig> = {
            components: {
              ...starlightConfig.components,
              ...overrideStarlightComponent(starlightConfig.components, logger, 'PageTitle'),
            },
            customCss: [...(starlightConfig.customCss ?? []), 'starlight-obsidian/styles/common'],
            sidebar: getSidebarFromConfig(config, starlightConfig.sidebar, sidebarGroup),
          }

          if (config.skipGeneration) {
            logger.warn(
              `Skipping generation of Starlight pages from Obsidian vault as the 'skipGeneration' option is enabled.`,
            )
          } else {
            try {
              const start = performance.now()
              logger.info(`Generating Starlight pages from Obsidian vault at '${config.vault}'…`)

              const vault = await getVault(config)
              const obsidianPaths = await getObsidianPaths(vault, config.ignore)
              await addObsidianFiles(config, vault, obsidianPaths, logger)

              const duration = Math.round(performance.now() - start)
              logger.info(`Starlight pages generated from Obsidian vault at '${config.vault}' in ${duration}ms.`)
            } catch (error) {
              logger.error(error instanceof Error ? error.message : String(error))

              throwUserError(`Failed to generate Starlight pages from Obsidian vault at '${config.vault}'.`)
            }
          }

          addIntegration(starlightObsidianIntegration(config))
          updateConfig(updatedStarlightConfig)
        },
      },
    }
  }
}

function overrideStarlightComponent(
  components: StarlightUserConfig['components'],
  logger: AstroIntegrationLogger,
  component: keyof NonNullable<StarlightUserConfig['components']>,
) {
  if (components?.[component]) {
    if (!overridesInjected) {
      logger.warn(
        `It looks like you already have a \`${component}\` component override in your Starlight configuration.`,
      )
      logger.warn(
        `To use \`starlight-obsidian\`, either remove your override or update it to render the content from \`starlight-obsidian/components/${component}.astro\`.`,
      )
    }

    return {}
  }

  return {
    [component]: `starlight-obsidian/overrides/${component}.astro`,
  }
}

export type StarlightObsidianUserConfig = z.input<typeof starlightObsidianConfigSchema>
export type StarlightObsidianConfig = z.output<typeof starlightObsidianConfigSchema>
