import fs from 'node:fs/promises'

import { afterAll, afterEach, expect, test, vi } from 'vitest'

import { getVault } from '../libs/obsidian'
import { addObsidianFiles } from '../libs/starlight'

import { getFixtureConfig } from './utils'

const mkdirSpy = vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined)
let readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValueOnce(`{}`).mockResolvedValue(``)
const rmSpy = vi.spyOn(fs, 'rm').mockResolvedValue()
const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue()

afterEach(() => {
  vi.clearAllMocks()
  readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValueOnce(`{}`).mockResolvedValue(``)
})

afterAll(() => {
  vi.restoreAllMocks()
})

test('copies Obsidian files to the default output directory', async () => {
  const config = getFixtureConfig('basics')
  const vault = await getVault(config)

  const obsidianPaths = ['foo.md', 'nested/bar.md']

  await addObsidianFiles(config, vault, obsidianPaths)

  expect(readFileSpy).toHaveBeenNthCalledWith(2, obsidianPaths[0], 'utf8')
  expect(mkdirSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes/foo.md', expect.any(String))

  expect(readFileSpy).toHaveBeenNthCalledWith(3, obsidianPaths[1], 'utf8')
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

test('clears the default output directory', async () => {
  const config = getFixtureConfig('basics')
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md'])

  expect(rmSpy).toHaveBeenCalledOnce()
  expect(rmSpy).toHaveBeenCalledWith('src/content/docs/notes', { force: true, recursive: true })
})

test('clears a custom output directory', async () => {
  const config = getFixtureConfig('basics', { output: 'test' })
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md'])

  expect(rmSpy).toHaveBeenCalledOnce()
  expect(rmSpy).toHaveBeenCalledWith('src/content/docs/test', { force: true, recursive: true })
})
