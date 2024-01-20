import fs from 'node:fs/promises'
import path from 'node:path'

import type { StarlightObsidianConfig } from '..'

import { ensureDirectory, removeDirectory } from './fs'
import { transformMarkdown } from './markdown'
import { getObsidianVaultFiles, type Vault, type VaultFile } from './obsidian'

const docsPath = 'src/content/docs'
const publicPath = 'public'

export async function addObsidianFiles(config: StarlightObsidianConfig, vault: Vault, obsidianPaths: string[]) {
  const outputPaths = getOutputPaths(config)

  await cleanOutputPaths(outputPaths)

  const vaultFiles = getObsidianVaultFiles(vault, obsidianPaths)

  // TODO(HiDeoo) worker? queue? parallel?
  await Promise.all(
    vaultFiles.map(async (vaultFile) => {
      await (vaultFile.type === 'asset'
        ? addAssetFile(outputPaths.asset, vaultFile)
        : addContentFIle(config, vault, outputPaths.content, vaultFiles, vaultFile))
    }),
  )
}

async function addContentFIle(
  config: StarlightObsidianConfig,
  vault: Vault,
  outputPath: string,
  vaultFiles: VaultFile[],
  vaultFile: VaultFile,
) {
  const obsidianContent = await fs.readFile(vaultFile.fsPath, 'utf8')
  const starlightContent = await transformMarkdown(vaultFile.fsPath, obsidianContent, {
    files: vaultFiles,
    output: config.output,
    vault,
  })

  const starlightPath = path.join(outputPath, vaultFile.path)
  const starlightDirPath = path.dirname(starlightPath)

  await ensureDirectory(starlightDirPath)
  await fs.writeFile(starlightPath, starlightContent)
}

async function addAssetFile(outputPath: string, vaultFile: VaultFile) {
  const starlightPath = path.join(outputPath, vaultFile.slug)
  const starlightDirPath = path.dirname(starlightPath)

  await ensureDirectory(starlightDirPath)
  await fs.copyFile(vaultFile.fsPath, starlightPath)
}

function getOutputPaths(config: StarlightObsidianConfig): OutputPaths {
  return {
    asset: path.join(publicPath, config.output),
    content: path.join(docsPath, config.output),
  }
}

async function cleanOutputPaths(outputPaths: OutputPaths) {
  await removeDirectory(outputPaths.asset)
  await removeDirectory(outputPaths.content)
}

interface OutputPaths {
  asset: string
  content: string
}
