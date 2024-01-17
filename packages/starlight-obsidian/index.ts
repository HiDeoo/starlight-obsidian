import type { StarlightPlugin } from '@astrojs/starlight/types'

import { getObsidianPaths, getVault } from './libs/obsidian'
import { addObsidianFiles } from './libs/starlight'

export default function starlightObsidianPlugin(options: StarlightObsidianOptions): StarlightPlugin {
  return {
    name: 'starlight-obsidian-plugin',
    hooks: {
      async setup() {
        const vault = await getVault(options)
        const obsidianPaths = await getObsidianPaths(vault)
        await addObsidianFiles(vault, obsidianPaths)
      },
    },
  }
}

export interface StarlightObsidianOptions {
  // TODO(HiDeoo) Add doc (absolute or relative path)
  // TODO(HiDeoo) vaultDir? Something else
  vault: string
}
