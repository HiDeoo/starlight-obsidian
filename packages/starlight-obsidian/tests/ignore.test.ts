import { expect, test } from 'vitest'

import type { StarlightObsidianConfig } from '..'
import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig } from './utils'

test('ignores files', async () => {
  const paths = await getFixtureObsidianPaths('basics', { ignore: ['Callouts.md', '*outub*'] })

  expect(paths).not.toContain('/Callouts.md')
  expect(paths).not.toContain('/Youtube video and tweet.md')
})

test('ignores folders', async () => {
  const paths = await getFixtureObsidianPaths('links-markdown-absolute', { ignore: ['folder'] })

  expect(paths.every((path) => !path.includes('/folder/'))).toBe(true)
})

test('ignores nested folders', async () => {
  const paths = await getFixtureObsidianPaths('links-markdown-absolute', { ignore: ['folder/nested folder'] })

  expect(paths.every((path) => !path.includes('/folder/nested folder/'))).toBe(true)
})

test('ignores nested folders with a globstar', async () => {
  const paths = await getFixtureObsidianPaths('links-markdown-absolute', { ignore: ['**/nested folder'] })

  expect(paths.every((path) => !path.includes('/folder/nested folder/'))).toBe(true)
})

async function getFixtureObsidianPaths(fixtureName: string, config: Partial<StarlightObsidianConfig> = {}) {
  const vault = await getVault(getFixtureConfig(fixtureName, config))
  const paths = await getObsidianPaths(vault, config.ignore)
  const files = getObsidianVaultFiles(vault, paths)

  return files.map((file) => file.path)
}
