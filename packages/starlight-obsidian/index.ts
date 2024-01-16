import type { StarlightPlugin } from '@astrojs/starlight/types'

import { getObsidianPaths } from './libs/obsidian'
import { addObsidianFiles } from './libs/starlight'

export default function starlightObsidianPlugin(options: StarlightObsidianOptions): StarlightPlugin {
  return {
    name: 'starlight-obsidian-plugin',
    hooks: {
      async setup() {
        const obsidianPaths = await getObsidianPaths(options.vault)
        await addObsidianFiles(options.vault, obsidianPaths)
      },
    },
  }
}

export interface StarlightObsidianOptions {
  // TODO(HiDeoo) Add doc
  // TODO(HiDeoo) vaultDir? Something else
  vault: string
}
