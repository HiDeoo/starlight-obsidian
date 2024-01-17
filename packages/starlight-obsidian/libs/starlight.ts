import fs from 'node:fs/promises'
import path from 'node:path'

import { transformMarkdown } from './markdown'
import type { Vault } from './obsidian'

// FIXME(HiDeoo)
const docsPath = 'src/content/docs/test'

// TODO(HiDeoo) Add output directory

export async function addObsidianFiles(vault: Vault, obsidianPaths: string[]) {
  // TODO(HiDeoo) Check the destination exists?

  // TODO(HiDeoo) worker? queue? parallel?
  await Promise.all(
    obsidianPaths.map(async (obsidianPath) => {
      const obsidianContent = await fs.readFile(obsidianPath, 'utf8')
      const starlightContent = await transformMarkdown(obsidianContent)

      const starlightPath = path.join(docsPath, obsidianPath.replace(vault.path, ''))
      const starlightDirPath = path.dirname(starlightPath)

      await fs.mkdir(starlightDirPath, { recursive: true })
      await fs.writeFile(starlightPath, String(starlightContent))
    }),
  )
}
