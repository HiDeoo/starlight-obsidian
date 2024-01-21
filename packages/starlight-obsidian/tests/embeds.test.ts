import { expect, test } from 'vitest'

import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig, linkSyntaxAndFormats, transformFixtureMdFile } from './utils'

const expectedMd = `![An image](</notes/An image.png>)

![An image in folder](</notes/folder/An image in folder.png>)

![An image in nested folder](</notes/folder/nested-folder/An image in nested folder.png>)

<audio controls src="/notes/A sound.mp3"></audio>

<audio controls src="/notes/folder/A sound.mp3"></audio>

<audio controls src="/notes/folder/nested-folder/A sound.mp3"></audio>
`

// This only tests image and audio embeds as the URL processing is the same for all embeds.
// The next test covers the node replacement logic.
test.each(linkSyntaxAndFormats)('transforms embed URLs in %s with the %s format', async (syntax, format) => {
  const fixtureName = `links-${syntax}-${format}`

  const vault = await getVault(getFixtureConfig(fixtureName))
  const paths = await getObsidianPaths(vault)
  const files = getObsidianVaultFiles(vault, paths)
  const options = { context: { files, output: 'notes', vault } }

  let md = await transformFixtureMdFile(fixtureName, 'root embeds.md', options)

  expect(md).toBe(expectedMd)

  md = await transformFixtureMdFile(fixtureName, 'folder/embeds in folder.md', options)

  expect(md).toBe(expectedMd)

  md = await transformFixtureMdFile(fixtureName, 'folder/nested folder/embeds in nested folder.md', options)

  expect(md).toBe(expectedMd)
})

test('transforms supported embeds', async () => {
  const md = await transformFixtureMdFile('basics', 'Embeds.md')

  expect(md).toMatchInlineSnapshot(`
    "![An image.png](</notes/An image.png>)

    <audio controls src="/notes/A sound.mp3"></audio>

    <video controls src="/notes/A Video.webm"></video>
    "
  `)
})
