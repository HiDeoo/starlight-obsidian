import type { ViteUserConfig } from 'astro'

import type { StarlightObsidianConfig } from '..'

export function vitePluginStarlightObsidianConfig(config: StarlightObsidianConfig): VitePlugin {
  const moduleId = 'virtual:starlight-obsidian-config'
  const resolvedModuleId = `\0${moduleId}`
  const moduleContent = `export default ${JSON.stringify(config)}`

  return {
    name: 'vite-plugin-starlight-obsidian-config',
    load(id) {
      return id === resolvedModuleId ? moduleContent : undefined
    },
    resolveId(id) {
      return id === moduleId ? resolvedModuleId : undefined
    },
  }
}

type VitePlugin = NonNullable<ViteUserConfig['plugins']>[number]
