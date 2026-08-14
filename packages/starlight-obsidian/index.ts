import { randomBytes } from 'node:crypto'
import path from 'node:path'

import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types'
import type { AstroIntegrationLogger } from 'astro'
import { z } from 'astro/zod'

import { throwPluginError } from './libs/error'
import { starlightObsidianIntegration } from './libs/integration'
import { getObsidianPaths, getVault } from './libs/obsidian'
import { stripLeadingAndTrailingSlashes } from './libs/path'
import {
  addObsidianFiles,
  getSidebarEntriesPlaceholder,
  getSidebarFromConfig,
  type SidebarAutoEntries,
} from './libs/starlight'

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
   * This option can be used to ignore files or folders and is resolved relative to {@link StarlightObsidianUserConfig.root}.
   *
   * @default []
   * @see https://github.com/mrmlnc/fast-glob#basic-syntax
   * @see https://help.obsidian.md/Files+and+folders/Accepted+file+formats
   */
  ignore: z.array(z.string()).default([]),
  /**
   * Configures math processing options.
   */
  math: z
    .object({
      /**
       * Whether or not to support inline math expressions using single dollar signs.
       *
       * @default true
       * @see https://github.com/micromark/micromark-extension-math/issues/6#issuecomment-1938838687
       */
      singleDollarTextMath: z.boolean().default(true),
    })
    .prefault({}),
  /**
   * The name of the output directory containing the generated Obsidian vault pages relative to the `src/content/docs/`
   * directory.
   *
   * @default 'notes'
   */
  output: z
    .string()
    .default('notes')
    .refine(
      (value) => {
        const label = stripLeadingAndTrailingSlashes(value)
        return label !== '' && label !== '.' && !label.startsWith('..')
      },
      {
        error: "The `output` directory cannot be empty, '.', or start with '..'.",
      },
    ),
  /**
   * The vault-relative directory to publish.
   *
   * @default '.'
   */
  root: z
    .string()
    .default('.')
    .refine(
      (value) => {
        const normalizedRoot = path.normalize(value)

        return (
          value.length > 0 &&
          !path.isAbsolute(value) &&
          normalizedRoot !== '..' &&
          !normalizedRoot.startsWith(`..${path.sep}`)
        )
      },
      { error: 'The `root` path must be a non-empty relative path within the vault.' },
    ),
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
   * The generated vault pages sidebar entries configuration.
   */
  sidebar: z
    .object({
      /**
       * @deprecated Use the `collapsed` option of the Starlight sidebar group that contains the vault pages instead.
       */
      collapsed: z.never().optional(),
      /**
       * Whether the sidebar groups of your vault nested folders should be collapsed by default.
       *
       * @default false
       */
      collapsedFolders: z.boolean().default(false),
      /**
       * @deprecated Use the `label` option of the Starlight sidebar group that contains the vault pages instead.
       */
      label: z.never().optional(),
    })
    .prefault({}),
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

export const obsidianSidebarEntries = getSidebarEntriesPlaceholder()

export default function starlightObsidianPlugin(userConfig: StarlightObsidianUserConfig): StarlightPlugin {
  return makeStarlightObsidianPlugin(obsidianSidebarEntries)(userConfig)
}

export function createStarlightObsidianPlugin(): [
  plugin: typeof starlightObsidianPlugin,
  sidebarEntries: SidebarAutoEntries,
] {
  const sidebarEntries = getSidebarEntriesPlaceholder(Symbol(randomBytes(24).toString('base64url')))
  return [makeStarlightObsidianPlugin(sidebarEntries), sidebarEntries]
}

function makeStarlightObsidianPlugin(
  sidebarEntries: SidebarAutoEntries,
): (userConfig: StarlightObsidianUserConfig) => StarlightPlugin {
  overridesInjected = true

  return function starlightObsidianPlugin(userConfig) {
    const parsedConfig = starlightObsidianConfigSchema.safeParse(userConfig)

    if (!parsedConfig.success) {
      const isUsingRemovedSidebarGroupConfig = parsedConfig.error.issues.some((issue) => {
        const path = issue.path.join('.')
        return path === 'sidebar.label' || path === 'sidebar.collapsed'
      })

      if (isUsingRemovedSidebarGroupConfig) {
        throwPluginError(
          'The `sidebar.label` and `sidebar.collapsed` options have been removed.',
          'Create a group in your Starlight sidebar configuration, set the `label` and `collapsed` options on that group, and add `obsidianSidebarEntries` to its `items` array.\nFor more information see https://starlight.astro.build/guides/sidebar/#groups',
        )
      }

      const isUsingDeprecatedCopyStarlightFrontmatter = parsedConfig.error.issues.some(
        (issue) => issue.path.join('.') === 'copyStarlightFrontmatter',
      )

      if (isUsingDeprecatedCopyStarlightFrontmatter) {
        throwPluginError(
          'The `copyStarlightFrontmatter` option has been deprecated in favor of the `copyFrontmatter` option.',
          'For more information see https://starlight-obsidian.vercel.app/configuration/#copyfrontmatter',
        )
      }

      throwPluginError(
        `Invalid starlight-obsidian configuration:

${z.prettifyError(parsedConfig.error)}
`,
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
            sidebar: getSidebarFromConfig(config, starlightConfig, sidebarEntries),
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

              throwPluginError(`Failed to generate Starlight pages from Obsidian vault at '${config.vault}'.`)
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
