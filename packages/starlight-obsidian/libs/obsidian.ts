import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'astro/zod'
import { slug } from 'github-slugger'
import { globby } from 'globby'

import type { StarlightObsidianConfig } from '..'

import { isDirectory, isFile } from './fs'
import { throwUserError } from './plugin'

const obsidianAppConfigSchema = z.object({
  newLinkFormat: z.union([z.literal('absolute'), z.literal('relative'), z.literal('shortest')]).default('shortest'),
  useMarkdownLinks: z.boolean().default(false),
})

export async function getVault(config: StarlightObsidianConfig): Promise<Vault> {
  const vaultPath = path.resolve(config.vault)

  if (!(await isDirectory(vaultPath))) {
    throwUserError('The provided vault path is not a directory.')
  }

  if (!(await isVaultDirectory(vaultPath))) {
    throwUserError('The provided vault path is not a valid Obsidian vault directory.')
  }

  const options = await getVaultOptions(vaultPath)

  return {
    options,
    path: vaultPath,
  }
}

export function getObsidianPaths(vault: Vault) {
  return globby('**/*.md', { absolute: true, cwd: vault.path })
}

export function getObsidianVaultFiles(vault: Vault, obsidianPaths: string[]): VaultFile[] {
  const allFileNames = obsidianPaths.map((obsidianPath) => path.basename(obsidianPath))

  return obsidianPaths.map((obsidianPath, index) => {
    const fileName = allFileNames[index] as string
    const filePath = getObsidianRelativePath(vault, obsidianPath)

    return {
      fileName,
      path: filePath,
      slug: slugifyObsidianPath(filePath),
      uniqueFileName: allFileNames.filter((currentFileName) => currentFileName === fileName).length === 1,
    }
  })
}

export function getObsidianRelativePath(vault: Vault, obsidianPath: string) {
  return obsidianPath.replace(vault.path, '')
}

export function slugifyObsidianPath(obsidianPath: string) {
  const segments = obsidianPath.split('/')

  return segments
    .map((segment, index) =>
      slug(decodeURIComponent(index === segments.length - 1 ? path.parse(segment).name : segment)),
    )
    .join('/')
}

async function isVaultDirectory(vaultPath: string) {
  const configPath = path.join(vaultPath, '.obsidian')

  return (await isDirectory(configPath)) && (await isFile(path.join(configPath, 'app.json')))
}

async function getVaultOptions(vaultPath: string): Promise<VaultOptions> {
  const appConfigPath = path.join(vaultPath, '.obsidian/app.json')

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

export interface VaultFile {
  fileName: string
  // The path is relative to the vault root.
  path: string
  slug: string
  uniqueFileName: boolean
}
