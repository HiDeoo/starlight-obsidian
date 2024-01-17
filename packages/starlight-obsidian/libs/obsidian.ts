import path from 'node:path'

import { globby } from 'globby'

import type { StarlightObsidianConfig } from '..'

import { isDirectory, isFile } from './fs'
import { throwUserError } from './plugin'

export async function getVault(config: StarlightObsidianConfig): Promise<Vault> {
  const vaultPath = path.resolve(config.vault)

  if (!(await isDirectory(vaultPath))) {
    throwUserError('The provided vault path is not a directory.')
  }

  if (!(await isVaultDirectory(vaultPath))) {
    throwUserError('The provided vault path is not a valid Obsidian vault directory.')
  }

  return {
    path: vaultPath,
  }
}

export function getObsidianPaths(vault: Vault) {
  return globby('**/*.md', { absolute: true, cwd: vault.path })
}

async function isVaultDirectory(vaultPath: string) {
  const configPath = path.join(vaultPath, '.obsidian')

  return (await isDirectory(configPath)) && (await isFile(path.join(configPath, 'app.json')))
}

export interface Vault {
  path: string
}
