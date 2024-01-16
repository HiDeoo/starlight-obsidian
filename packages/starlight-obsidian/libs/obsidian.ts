import { globby } from 'globby'

export function getObsidianPaths(vaultPath: string) {
  return globby('**/*.md', { absolute: true, cwd: vaultPath })
}
