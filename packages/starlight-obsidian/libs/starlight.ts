import fs from 'node:fs/promises'
import path from 'node:path'

import type { StarlightObsidianConfig } from '..'

import { ensureDirectory, removeDirectory } from './fs'
import { transformMarkdownToString } from './markdown'
import { getObsidianVaultFiles, type Vault, type VaultFile } from './obsidian'

const docsPath = 'src/content/docs'
const publicPath = 'public'

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

export async function addObsidianFiles(config: StarlightObsidianConfig, vault: Vault, obsidianPaths: string[]) {
  const outputPaths = getOutputPaths(config)

  await cleanOutputPaths(outputPaths)

  const vaultFiles = getObsidianVaultFiles(vault, obsidianPaths)

  // TODO(HiDeoo) worker? queue? parallel?
  await Promise.all(
    vaultFiles.map(async (vaultFile) => {
      await (vaultFile.type === 'asset'
        ? addAssetFile(outputPaths, vaultFile)
        : addContentFile(config, vault, outputPaths, vaultFiles, vaultFile))
    }),
  )
}

export function getStarlightCalloutType(obsidianCalloutType: string): string {
  return obsidianToStarlightCalloutTypeMap[obsidianCalloutType] ?? 'note'
}

async function addContentFile(
  config: StarlightObsidianConfig,
  vault: Vault,
  outputPaths: OutputPaths,
  vaultFiles: VaultFile[],
  vaultFile: VaultFile,
) {
  const obsidianContent = await fs.readFile(vaultFile.fsPath, 'utf8')
  const {
    content: starlightContent,
    aliases,
    skip,
  } = await transformMarkdownToString(vaultFile.fsPath, obsidianContent, {
    files: vaultFiles,
    output: config.output,
    vault,
  })

  if (skip) {
    return
  }

  const starlightPath = path.join(outputPaths.content, vaultFile.path.replace(/\.md$/, '.mdx'))
  const starlightDirPath = path.dirname(starlightPath)

  await ensureDirectory(starlightDirPath)
  await fs.writeFile(starlightPath, starlightContent)

  if (aliases) {
    for (const alias of aliases) {
      await addAliasFile(config, outputPaths, vaultFile, alias)
    }
  }
}

async function addAssetFile(outputPaths: OutputPaths, vaultFile: VaultFile) {
  const starlightPath = path.join(outputPaths.asset, vaultFile.slug)
  const starlightDirPath = path.dirname(starlightPath)

  await ensureDirectory(starlightDirPath)
  await fs.copyFile(vaultFile.fsPath, starlightPath)
}

async function addAliasFile(
  config: StarlightObsidianConfig,
  outputPaths: OutputPaths,
  vaultFile: VaultFile,
  alias: string,
) {
  const starlightPath = path.join(outputPaths.asset, path.dirname(vaultFile.path), alias, 'index.html')
  const starlightDirPath = path.dirname(starlightPath)

  const to = path.join('/', config.output, vaultFile.slug)
  const from = path.join(path.dirname(to), alias)

  await ensureDirectory(starlightDirPath)

  // Based on https://github.com/withastro/astro/blob/57ab578bc7bdac6c65c2315365c0e94bc98af2b3/packages/astro/src/core/build/generate.ts#L584-L591
  // but tweaked to add an `<html>` element so that Pagefind does not emit a warning when ignoring the page.
  await fs.writeFile(
    starlightPath,
    `<!doctype html>
<html>
  <head>
    <title>Redirecting to: ${to}</title>
    <meta http-equiv="refresh" content="0;url=${to}">
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${to}">
  </head>
  <body>
    <a href="${to}">Redirecting from <code>${from}</code> to "<code>${to}</code>"</a>
  </body>
</html>`,
  )
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
