import path from 'node:path'

import { expect, test } from 'vitest'

import { getVault } from '../libs/obsidian'

import { getFixtureConfig } from './utils'

test('returns a vault with an absolute path', async () => {
  const vault = await getVault(getFixtureConfig('basics'))

  expect(path.isAbsolute(vault.path)).toBe(true)
  expect(vault.path).toMatch(/fixtures\/basics$/)
})

test('throws if the specified vault path is not a directory', async () => {
  await expect(getVault(getFixtureConfig('unknown'))).rejects.toThrowErrorMatchingInlineSnapshot(
    `[AstroUserError: The provided vault path is not a directory.]`,
  )
})

test('throws if the specified vault path is not a valid vault directory', async () => {
  await expect(getVault(getFixtureConfig('not-a-vault'))).rejects.toThrowErrorMatchingInlineSnapshot(
    `[AstroUserError: The provided vault path is not a valid Obsidian vault directory.]`,
  )
})

test.each([
  ['markdown-links-shortest'],
  // TODO(HiDeoo)
])('returns the correct vault options', async (fixtureName) => {
  const vault = await getVault(getFixtureConfig(fixtureName))

  const [syntax, , format] = fixtureName.split('-')

  expect(vault.options.linkFormat).toBe(format)
  expect(vault.options.linkSyntax).toBe(syntax)
})

test('returns the default vault options', async () => {
  const vault = await getVault(getFixtureConfig('basics'))

  expect(vault.options.linkFormat).toBe('shortest')
  expect(vault.options.linkSyntax).toBe('wikilink')
})
