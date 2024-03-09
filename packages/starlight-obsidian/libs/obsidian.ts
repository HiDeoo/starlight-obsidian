import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'astro/zod'
import { slug } from 'github-slugger'
import { globby } from 'globby'
import yaml from 'yaml'

import type { StarlightObsidianConfig } from '..'

import { isDirectory, isFile } from './fs'
import { getExtension, isAnchor, slugifyPath, stripExtension } from './path'
import { throwUserError } from './plugin'
import { isAssetFile } from './starlight'

const obsidianAppConfigSchema = z.object({
  newLinkFormat: z.union([z.literal('absolute'), z.literal('relative'), z.literal('shortest')]).default('shortest'),
  useMarkdownLinks: z.boolean().default(false),
})

const obsidianFrontmatterSchema = z.object({
  aliases: z
    .array(z.string())
    .optional()
    .transform((aliases) => aliases?.map((alias) => slug(alias))),
  cover: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  permalink: z.string().optional(),
  publish: z
    .union([z.boolean(), z.literal('true'), z.literal('false')])
    .optional()
    .transform((publish) => publish === undefined || publish === 'true' || publish === true),
  tags: z.array(z.string()).optional(),
})

const imageFileFormats = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])
const audioFileFormats = new Set(['.flac', '.m4a', '.mp3', '.wav', '.ogg', '.wav', '.3gp'])
const videoFileFormats = new Set(['.mkv', '.mov', '.mp4', '.ogv', '.webm'])
const otherFileFormats = new Set(['.pdf'])

const fileFormats = new Set([...imageFileFormats, ...audioFileFormats, ...videoFileFormats, ...otherFileFormats])

export async function getVault(config: StarlightObsidianConfig): Promise<Vault> {
  const vaultPath = path.resolve(config.vault)

  if (!(await isDirectory(vaultPath))) {
    throwUserError('The provided vault path is not a directory.')
  }

  if (!(await isVaultDirectory(config, vaultPath))) {
    throwUserError('The provided vault path is not a valid Obsidian vault directory.')
  }

  const options = await getVaultOptions(config, vaultPath)

  return {
    options,
    path: vaultPath,
  }
}

export function getObsidianPaths(vault: Vault, ignore: StarlightObsidianConfig['ignore'] = []) {
  return globby(['**/*.md', ...[...fileFormats].map((fileFormat) => `**/*${fileFormat}`)], {
    absolute: true,
    cwd: vault.path,
    ignore,
  })
}

export function getObsidianVaultFiles(vault: Vault, obsidianPaths: string[]): VaultFile[] {
  const allFileNames = obsidianPaths.map((obsidianPath) => path.basename(obsidianPath))

  return obsidianPaths.map((obsidianPath, index) => {
    const baseFileName = allFileNames[index] as string
    let fileName = baseFileName

    const type = isAssetFile(fileName) ? 'asset' : isObsidianFile(fileName) ? 'file' : 'content'

    if (type === 'asset') {
      fileName = slugifyPath(fileName)
    }

    const filePath = getObsidianRelativePath(vault, obsidianPath)
    const slug = slugifyObsidianPath(filePath)

    return createVaultFile({
      fileName,
      fsPath: obsidianPath,
      path: type === 'asset' ? slug : filePath,
      slug,
      stem: stripExtension(fileName),
      type,
      uniqueFileName: allFileNames.filter((currentFileName) => currentFileName === baseFileName).length === 1,
    })
  })
}

export function getObsidianRelativePath(vault: Vault, obsidianPath: string) {
  return obsidianPath.replace(vault.path, '')
}

export function slugifyObsidianPath(obsidianPath: string) {
  const segments = obsidianPath.split('/')

  return segments
    .map((segment, index) => {
      const isLastSegment = index === segments.length - 1

      if (!isLastSegment) {
        return slug(decodeURIComponent(segment))
      } else if (isObsidianFile(segment) && !isAssetFile(segment)) {
        return decodeURIComponent(segment)
      } else if (isAssetFile(segment)) {
        return `${slug(decodeURIComponent(stripExtension(segment)))}${getExtension(segment)}`
      }

      return slug(decodeURIComponent(stripExtension(segment)))
    })
    .join('/')
}

export function slugifyObsidianAnchor(obsidianAnchor: string) {
  if (obsidianAnchor.length === 0) {
    return ''
  }

  let anchor = isAnchor(obsidianAnchor) ? obsidianAnchor.slice(1) : obsidianAnchor

  if (isObsidianBlockAnchor(anchor)) {
    anchor = anchor.replace('^', 'block-')
  }

  return `#${slug(decodeURIComponent(anchor))}`
}

export function isObsidianBlockAnchor(anchor: string) {
  return anchor.startsWith('#^') || anchor.startsWith('^')
}

export function isObsidianFile(filePath: string, type?: 'image' | 'audio' | 'video' | 'other') {
  const formats: Set<string> =
    type === undefined
      ? fileFormats
      : type === 'image'
        ? imageFileFormats
        : type === 'audio'
          ? audioFileFormats
          : type === 'video'
            ? videoFileFormats
            : otherFileFormats

  return formats.has(getExtension(filePath))
}

export function parseObsidianFrontmatter(content: string): ObsidianFrontmatter | undefined {
  try {
    const raw: unknown = yaml.parse(content)
    return { ...obsidianFrontmatterSchema.parse(raw), raw: raw as ObsidianFrontmatter['raw'] }
  } catch {
    return
  }
}

export function createVaultFile(baseVaultFile: BaseVaultFile) {
  return {
    ...baseVaultFile,
    isEqualFileName(otherFileName: string) {
      return (isAssetFile(otherFileName) ? slugifyPath(otherFileName) : otherFileName) === this.fileName
    },
    isEqualStem(otherStem: string) {
      return (isAssetFile(otherStem) ? slugifyPath(otherStem) : otherStem) === this.stem
    },
  }
}

async function isVaultDirectory(config: StarlightObsidianConfig, vaultPath: string) {
  const configPath = path.join(vaultPath, config.configFolder)

  return (await isDirectory(configPath)) && (await isFile(path.join(configPath, 'app.json')))
}

async function getVaultOptions(config: StarlightObsidianConfig, vaultPath: string): Promise<VaultOptions> {
  const appConfigPath = path.join(vaultPath, config.configFolder, 'app.json')

  try {
    const appConfigData = await fs.readFile(appConfigPath, 'utf8')
    const appConfig = obsidianAppConfigSchema.parse(JSON.parse(appConfigData))

    return {
      linkFormat: appConfig.newLinkFormat,
      linkSyntax: appConfig.useMarkdownLinks ? 'markdown' : 'wikilink',
    }
  } catch (error) {
    throw new Error('Failed to read Obsidian vault app configuration.', { cause: error })
  }
}

export interface Vault {
  options: VaultOptions
  path: string
}

interface VaultOptions {
  linkFormat: 'absolute' | 'relative' | 'shortest'
  linkSyntax: 'markdown' | 'wikilink'
}

interface BaseVaultFile {
  fileName: string
  fsPath: string
  // The path is relative to the vault root.
  path: string
  slug: string
  // This represent the file name without the extension.
  stem: string
  type: 'asset' | 'content' | 'file'
  uniqueFileName: boolean
}

export interface VaultFile extends BaseVaultFile {
  isEqualFileName(otherFileName: string): boolean
  isEqualStem(otherStem: string): boolean
}

export type ObsidianFrontmatter = z.output<typeof obsidianFrontmatterSchema> & {
  raw: Record<string | number, unknown>
}
