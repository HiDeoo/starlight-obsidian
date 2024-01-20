import { expect, test } from 'vitest'

import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig, linkSyntaxAndFormats, transformFixtureMdFile } from './utils'

const expectedMd = `![An image](</notes/An image.png>)

![An image in folder](</notes/folder/An image in folder.png>)

![An image in nested folder](</notes/folder/nested-folder/An image in nested folder.png>)
`

test.each(linkSyntaxAndFormats)('formats embeds in %s with the %s format', async (syntax, format) => {
  const fixtureName = `links-${syntax}-${format}`

  const vault = await getVault(getFixtureConfig(fixtureName))
  const paths = await getObsidianPaths(vault)
  const files = getObsidianVaultFiles(vault, paths)

  let md = await transformFixtureMdFile(fixtureName, 'root embeds.md', { context: { files, output: 'notes', vault } })

  expect(md).toBe(expectedMd)

  md = await transformFixtureMdFile(fixtureName, 'folder/embeds in folder.md', {
    context: { files, output: 'notes', vault },
  })

  expect(md).toBe(expectedMd)

  md = await transformFixtureMdFile(fixtureName, 'folder/nested folder/embeds in nested folder.md', {
    context: { files, output: 'notes', vault },
  })

  expect(md).toBe(expectedMd)
})
