import fs from 'node:fs/promises'

import { afterAll, afterEach, expect, test, vi } from 'vitest'

import { getVault } from '../libs/obsidian'
import { addObsidianFiles } from '../libs/starlight'

import { getFixtureConfig } from './utils'

const copyFileSpy = vi.spyOn(fs, 'copyFile').mockResolvedValue(undefined)
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

  const obsidianFiles = ['foo.md', 'nested/bar.md', 'baz.png', 'nested/qux.pdf']

  await addObsidianFiles(config, vault, obsidianFiles)

  // The first readFile call is for the `.obsidian/app.json` file.
  expect(readFileSpy).toHaveBeenCalledTimes(3)
  expect(mkdirSpy).toHaveBeenCalledTimes(4)
  expect(writeFileSpy).toHaveBeenCalledTimes(2)
  expect(copyFileSpy).toHaveBeenCalledTimes(2)

  expect(mkdirSpy).toHaveBeenNthCalledWith(1, 'public/notes', { recursive: true })
  expect(copyFileSpy).toHaveBeenNthCalledWith(1, 'baz.png', 'public/notes/baz.png')

  expect(mkdirSpy).toHaveBeenNthCalledWith(2, 'public/notes/nested', { recursive: true })
  expect(copyFileSpy).toHaveBeenNthCalledWith(2, 'nested/qux.pdf', 'public/notes/nested/qux.pdf')

  expect(readFileSpy).toHaveBeenNthCalledWith(2, 'foo.md', 'utf8')
  expect(mkdirSpy).toHaveBeenNthCalledWith(3, 'src/content/docs/notes', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes/foo.md', expect.any(String))

  expect(readFileSpy).toHaveBeenNthCalledWith(3, 'nested/bar.md', 'utf8')
  expect(mkdirSpy).toHaveBeenNthCalledWith(4, 'src/content/docs/notes/nested', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(2, 'src/content/docs/notes/nested/bar.md', expect.any(String))
})

test('copies content files to a custom output directory', async () => {
  const config = getFixtureConfig('basics', { output: 'test' })
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md', 'bar.webm'])

  // The first readFile call is for the `.obsidian/app.json` file.
  expect(readFileSpy).toHaveBeenCalledTimes(2)

  expect(mkdirSpy).toHaveBeenNthCalledWith(1, 'public/test', { recursive: true })
  expect(copyFileSpy).toHaveBeenNthCalledWith(1, 'bar.webm', 'public/test/bar.webm')
  expect(mkdirSpy).toHaveBeenNthCalledWith(2, 'src/content/docs/test', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/test/foo.md', expect.any(String))
})

test('does not copy canvas', async () => {
  const config = getFixtureConfig('basics')
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md', 'bar.canvas'])

  expect(copyFileSpy).not.toHaveBeenCalled()
})

test('emits aliases', async () => {
  readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValueOnce(`{}`).mockResolvedValue(`---
aliases:
  - foo
  - bar
---

Test`)

  const config = getFixtureConfig('aliases')
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['folder/foo.md'])

  expect(writeFileSpy).toHaveBeenCalledTimes(3)

  expect(mkdirSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes/folder', { recursive: true })
  expect(writeFileSpy).toHaveBeenNthCalledWith(1, 'src/content/docs/notes/folder/foo.md', expect.any(String))

  expect(mkdirSpy).toHaveBeenNthCalledWith(2, 'public/notes/folder/foo', { recursive: true })

  const redirect = /<meta http-equiv="refresh" content="0;url=\/notes\/folder\/foo">/

  expect(writeFileSpy.mock.calls.at(1)).toMatch(redirect)
  expect(writeFileSpy.mock.calls.at(2)).toMatch(redirect)
})

test('clears the default output directories', async () => {
  const config = getFixtureConfig('basics')
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md'])

  expect(rmSpy).toHaveBeenCalledTimes(2)
  expect(rmSpy).toHaveBeenNthCalledWith(1, 'public/notes', { force: true, recursive: true })
  expect(rmSpy).toHaveBeenNthCalledWith(2, 'src/content/docs/notes', { force: true, recursive: true })
})

test('clears custom output directories', async () => {
  const config = getFixtureConfig('basics', { output: 'test' })
  const vault = await getVault(config)

  await addObsidianFiles(config, vault, ['foo.md'])

  expect(rmSpy).toHaveBeenCalledTimes(2)
  expect(rmSpy).toHaveBeenNthCalledWith(1, 'public/test', { force: true, recursive: true })
  expect(rmSpy).toHaveBeenNthCalledWith(2, 'src/content/docs/test', { force: true, recursive: true })
})
