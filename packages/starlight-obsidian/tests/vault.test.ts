import path from 'node:path'

import { expect, test } from 'vitest'

import { getVault } from '../libs/obsidian'

import { getFixtureConfig, linkSyntaxAndFormats } from './utils'

test('returns a vault with an absolute path', async () => {
  const vault = await getVault(getFixtureConfig('basics'))

  expect(path.isAbsolute(vault.path)).toBe(true)
  expect(vault.path).toMatch(/fixtures[/\\]basics$/)
  expect(vault.rootPath).toBe(vault.path)
})

test('resolves the configured root relative to the vault', async () => {
  const vault = await getVault(getFixtureConfig('links-markdown-absolute', { root: './folder' }))

  expect(vault.path).toMatch(/fixtures[/\\]links-markdown-absolute$/)
  expect(vault.rootPath).toMatch(/fixtures[/\\]links-markdown-absolute[/\\]folder$/)
})

test('rejects a root that is not a valid directory', async () => {
  await expect(getVault(getFixtureConfig('basics', { root: 'missing' }))).rejects.toThrowError(
    /The provided `root` path is not a directory/,
  )
})

test('throws if the specified vault path is not a directory', async () => {
  await expect(getVault(getFixtureConfig('unknown'))).rejects.toThrowError(
    /The provided vault path is not a directory.\n> Provided path: /,
  )
})

test('throws if the specified vault path is not a valid vault directory', async () => {
  await expect(getVault(getFixtureConfig('not-a-vault'))).rejects.toThrowError(
    /The provided vault path is not a valid Obsidian vault directory and does not include an '.obsidian\/app\.json' file\.\n> Provided path: /,
  )
})

test.each(linkSyntaxAndFormats)(
  'returns the correct vault options in %s with the %s format',
  async (syntax, format) => {
    const vault = await getVault(getFixtureConfig(`links-${syntax}-${format}`))

    expect(vault.options.linkFormat).toBe(format)
    expect(vault.options.linkSyntax).toBe(syntax)
  },
)

test('returns the default vault options', async () => {
  const vault = await getVault(getFixtureConfig('basics'))

  expect(vault.options.linkFormat).toBe('shortest')
  expect(vault.options.linkSyntax).toBe('wikilink')
})

test('supports custom vault config folder', async () => {
  const vault = await getVault(getFixtureConfig('custom-config-folder', { configFolder: '.custom-config' }))

  expect(vault.options.linkSyntax).toBe('markdown')
})
