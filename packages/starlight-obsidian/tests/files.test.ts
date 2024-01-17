import fs from 'node:fs/promises'

import { afterAll, afterEach, expect, test, vi } from 'vitest'

import { getVault } from '../libs/obsidian'
import { addObsidianFiles } from '../libs/starlight'

import { getFixtureConfig } from './utils'

const mkdirSpy = vi.spyOn(fs, 'mkdir').mockImplementation(() => Promise.resolve(void 0))
const readFileSpy = vi.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(''))
const writeFileSpy = vi.spyOn(fs, 'writeFile').mockImplementation(() => Promise.resolve(void 0))

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})

test('copies Obsidian files to the default output directory', async () => {
  const config = getFixtureConfig('basics')
  const vault = await getVault(config)

  const obsidianPaths = ['foo.md', 'nested/bar.md']

  await addObsidianFiles(config, vault, obsidianPaths)

  expect(readFileSpy).toHaveBeenNthCalledWith(1, obsidianPaths[0], 'utf8')
  expect(mkdirSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes/foo.md', expect.any(String))

  expect(readFileSpy).toHaveBeenNthCalledWith(2, obsidianPaths[1], 'utf8')
  expect(mkdirSpy).toHaveBeenNthCalledWith(2, 'src/content/docs/notes/nested', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(2, 'src/content/docs/notes/nested/bar.md', expect.any(String))
})

test('copies Obsidian files to a custom output directory', async () => {
  const config = getFixtureConfig('basics', { output: 'test' })
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md'])

  expect(mkdirSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/test', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/test/foo.md', expect.any(String))
})
