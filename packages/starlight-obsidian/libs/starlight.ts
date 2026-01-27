import fs from 'node:fs/promises'
import path from 'node:path'

import type { HookParameters, StarlightUserConfig } from '@astrojs/starlight/types'
import type { AstroIntegrationLogger } from 'astro'

import type { StarlightObsidianConfig } from '..'

import { copyFile, ensureDirectory, removeDirectory } from './fs'
import { transformMarkdownToString } from './markdown'
import { getObsidianVaultFiles, isObsidianFile, type ObsidianFrontmatter, type Vault, type VaultFile } from './obsidian'
import { getExtension } from './path'

const assetsPath = 'src/assets'
const docsPath = 'src/content/docs'
const publicPath = 'public'

const starlightObsidianSidebarGroupLabel = Symbol('StarlightObsidianSidebarGroupLabel')

const obsidianToStarlightCalloutTypeMap: Record<string, string> = {
  note: 'note',
  abstract: 'tip',
  summary: 'tip',
  tldr: 'tip',
  info: 'note',
  todo: 'note',
  tip: 'tip',
  hint: 'tip',
  important: 'tip',
  success: 'note',
  check: 'note',
  done: 'note',
  question: 'caution',
  help: 'caution',
  faq: 'caution',
  warning: 'caution',
  caution: 'caution',
  attention: 'caution',
  failure: 'danger',
  fail: 'danger',
  missing: 'danger',
  danger: 'danger',
  error: 'danger',
  bug: 'danger',
  example: 'tip',
  quote: 'note',
  cite: 'note',
}

// https://github.com/withastro/starlight/blob/main/packages/starlight/schema.ts
const starlightFrontmatterKeys = [
  'title',
  // The `description` property is ignored as it's part of the Obsidian frontmatter too.
  'slug',
  'editUrl',
  'head',
  'tableOfContents',
  'template',
  'hero',
  'banner',
  'lastUpdated',
  'prev',
  'next',
  'pagefind',
  'draft',
  'sidebar',
]

export function getSidebarGroupPlaceholder(label = starlightObsidianSidebarGroupLabel): SidebarManualGroup {
  return {
    items: [],
    label: label.toString(),
  }
}

export function getSidebarFromConfig(
  config: StarlightObsidianConfig,
  starlightConfig: HookParameters<'config:setup'>['config'],
  sidebarGroupPlaceholder: SidebarGroup,
): StarlightUserConfig['sidebar'] {
  if (!starlightConfig.sidebar || starlightConfig.sidebar.length === 0) {
    return starlightConfig.sidebar
  }

  function replaceSidebarGroupPlaceholder(group: SidebarManualGroup): SidebarItem {
    if (group.label === sidebarGroupPlaceholder.label) {
      const defaultLocaleConfig = starlightConfig.locales?.[starlightConfig.defaultLocale ?? 'root']
      const label =
        typeof config.sidebar.label === 'string'
          ? config.sidebar.label
          : config.sidebar.label[defaultLocaleConfig?.lang ?? 'en']

      if (!label || label.length === 0) {
        throw new Error('The generated vault pages sidebar group label must have a key for the default language.')
      }

      const group: SidebarGroup = {
        autogenerate: {
          collapsed: config.sidebar.collapsedFolders ?? config.sidebar.collapsed,
          directory: config.output,
        },
        collapsed: config.sidebar.collapsed,
        label,
      }

      if (typeof config.sidebar.label !== 'string') {
        group['translations'] = config.sidebar.label
      }

      return group
    }

    if (isSidebarGroup(group)) {
      return {
        ...group,
        items: group.items.map((item) => {
          return isSidebarGroup(item) ? replaceSidebarGroupPlaceholder(item) : item
        }),
      }
    }

    return group
  }

  return starlightConfig.sidebar.map((item) => {
    return isSidebarGroup(item) ? replaceSidebarGroupPlaceholder(item) : item
  })
}

export async function addObsidianFiles(
  config: StarlightObsidianConfig,
  vault: Vault,
  obsidianPaths: string[],
  logger: AstroIntegrationLogger,
) {
  const outputPaths = getOutputPaths(config)

  await cleanOutputPaths(outputPaths)

  const vaultFiles = getObsidianVaultFiles(vault, obsidianPaths)

  const results = await Promise.allSettled(
    vaultFiles.map(async (vaultFile) => {
      await (vaultFile.type === 'asset'
        ? addAsset(outputPaths, vaultFile)
        : vaultFile.type === 'file'
          ? addFile(outputPaths, vaultFile)
          : addContent(config, vault, outputPaths, vaultFiles, vaultFile))
    }),
  )

  let didFail = false

  for (const result of results) {
    if (result.status === 'rejected') {
      didFail = true
      logger.error(result.reason instanceof Error ? result.reason.message : String(result.reason))
    }
  }

  if (didFail) {
    throw new Error('Failed to generate some Starlight pages. See the error(s) above for more information.')
  }
}

export function getStarlightCalloutType(obsidianCalloutType: string): string {
  return obsidianToStarlightCalloutTypeMap[obsidianCalloutType] ?? 'note'
}

export function isAssetFile(filePath: string): boolean {
  return getExtension(filePath) !== '.bmp' && isObsidianFile(filePath, 'image')
}

export function getStarlightLikeFrontmatter(rawFrontmatter: ObsidianFrontmatter['raw']): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {}

  for (const key of starlightFrontmatterKeys) {
    if (key in rawFrontmatter) {
      frontmatter[key] = rawFrontmatter[key]
    }
  }

  return frontmatter
}

async function addContent(
  config: StarlightObsidianConfig,
  vault: Vault,
  outputPaths: OutputPaths,
  vaultFiles: VaultFile[],
  vaultFile: VaultFile,
) {
  try {
    const obsidianContent = await fs.readFile(vaultFile.fsPath, 'utf8')
    const {
      content: starlightContent,
      aliases,
      skip,
      type,
    } = await transformMarkdownToString(vaultFile.fsPath, obsidianContent, {
      files: vaultFiles,
      copyFrontmatter: config.copyFrontmatter,
      output: config.output,
      singleDollarTextMath: config.math.singleDollarTextMath,
      vault,
    })

    if (skip) {
      return
    }

    const starlightPath = path.join(
      outputPaths.content,
      type === 'markdown' ? vaultFile.path : vaultFile.path.replace(/\.md$/, '.mdx'),
    )
    const starlightDirPath = path.dirname(starlightPath)

    await ensureDirectory(starlightDirPath)
    await fs.writeFile(starlightPath, starlightContent)

    if (aliases) {
      for (const alias of aliases) {
        await addAlias(config, outputPaths, vaultFile, alias)
      }
    }
  } catch (error) {
    throwVaultFileError(error, vaultFile)
  }
}

async function addFile(outputPaths: OutputPaths, vaultFile: VaultFile) {
  try {
    await copyFile(vaultFile.fsPath, path.join(outputPaths.file, vaultFile.slug))
  } catch (error) {
    throwVaultFileError(error, vaultFile)
  }
}

async function addAsset(outputPaths: OutputPaths, vaultFile: VaultFile) {
  try {
    await copyFile(vaultFile.fsPath, path.join(outputPaths.asset, vaultFile.slug))
  } catch (error) {
    throwVaultFileError(error, vaultFile)
  }
}

async function addAlias(
  config: StarlightObsidianConfig,
  outputPaths: OutputPaths,
  vaultFile: VaultFile,
  alias: string,
) {
  const starlightPath = path.join(outputPaths.file, path.dirname(vaultFile.path), alias, 'index.html')
  const starlightDirPath = path.dirname(starlightPath)

  const to = path.posix.join(path.posix.sep, config.output, vaultFile.slug)
  const from = path.posix.join(path.dirname(to), alias)

  await ensureDirectory(starlightDirPath)

  // Based on https://github.com/withastro/astro/blob/57ab578bc7bdac6c65c2315365c0e94bc98af2b3/packages/astro/src/core/build/generate.ts#L584-L591
  // but tweaked to add an `<html>` element so that Pagefind does not emit a warning and ignore the page.
  await fs.writeFile(
    starlightPath,
    `<!doctype html>
<html lang="en">
  <head>
    <title>${vaultFile.stem}</title>
    <meta http-equiv="refresh" content="0;url=${to}">
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${to}">
  </head>
  <body data-pagefind-body>
    <h2 id="alias">Alias</h2>
    <code>(name: ${alias})</code>
    <a href="${to}" data-pagefind-ignore>Redirecting from <code>${from}</code> to "<code>${to}</code>"</a>
  </body>
</html>`,
  )
}

function getOutputPaths(config: StarlightObsidianConfig): OutputPaths {
  return {
    asset: path.join(assetsPath, config.output),
    content: path.join(docsPath, config.output),
    file: path.join(publicPath, config.output),
  }
}

async function cleanOutputPaths(outputPaths: OutputPaths) {
  await removeDirectory(outputPaths.asset)
  await removeDirectory(outputPaths.content)
  await removeDirectory(outputPaths.file)
}

function throwVaultFileError(error: unknown, vaultFile: VaultFile): never {
  throw new Error(`${vaultFile.path} — ${error instanceof Error ? error.message : String(error)}`, { cause: error })
}

function isSidebarGroup(item: SidebarItem): item is SidebarManualGroup {
  return typeof item === 'object' && 'items' in item
}

interface OutputPaths {
  asset: string
  content: string
  file: string
}

interface SidebarManualGroup {
  items: SidebarManualGroup[]
  label: string
}

type SidebarItem = NonNullable<StarlightUserConfig['sidebar']>[number]
export type SidebarGroup = Exclude<SidebarItem, string>
