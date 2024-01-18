import fs from 'node:fs/promises'
import path from 'node:path'

import type { StarlightObsidianConfig } from '..'

import { transformMarkdown } from './markdown'
import type { Vault } from './obsidian'

const docsPath = 'src/content/docs'

export async function addObsidianFiles(config: StarlightObsidianConfig, vault: Vault, obsidianPaths: string[]) {
  const outputPath = path.join(docsPath, config.output)

  await fs.rm(outputPath, { force: true, recursive: true })

  // TODO(HiDeoo) worker? queue? parallel?
  await Promise.all(
    obsidianPaths.map(async (obsidianPath) => {
      const obsidianContent = await fs.readFile(obsidianPath, 'utf8')
      const starlightContent = await transformMarkdown(obsidianContent, obsidianPath)

      const starlightPath = path.join(outputPath, obsidianPath.replace(vault.path, ''))
      const starlightDirPath = path.dirname(starlightPath)

      await fs.mkdir(starlightDirPath, { recursive: true })
      await fs.writeFile(starlightPath, starlightContent)
    }),
  )
}
