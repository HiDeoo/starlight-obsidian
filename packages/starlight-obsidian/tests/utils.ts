import type { StarlightObsidianConfig } from '..'

export function getFixtureConfig(name: string, config: Partial<StarlightObsidianConfig> = {}): StarlightObsidianConfig {
  return {
    output: 'notes',
    vault: `../../fixtures/${name}`,
    ...config,
  }
}
