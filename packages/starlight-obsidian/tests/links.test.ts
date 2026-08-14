import { expect, test } from 'vitest'

import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig, transformFixtureMdFile } from './utils'

const linkSyntaxAndFormats = [
  ['markdown', 'absolute'],
  ['markdown', 'relative'],
  ['markdown', 'shortest'],
  ['wikilink', 'absolute'],
  ['wikilink', 'relative'],
  ['wikilink', 'shortest'],
]

test('formats link URLs', async () => {
  for (const [syntax, format] of linkSyntaxAndFormats) {
    const fixtureName = `links-${syntax}-${format}`

    const vault = await getVault(getFixtureConfig(fixtureName))
    const paths = await getObsidianPaths(vault)
    const files = getObsidianVaultFiles(vault, paths)
    const options = {
      context: { copyFrontmatter: 'none', files, output: 'notes', singleDollarTextMath: true, vault } as const,
    }

    let result = await transformFixtureMdFile(fixtureName, 'root 1.md', options)

    expect(result.content).toBe(`[root 2](/notes/root-2)

[file in folder 1](/notes/folder/file-in-folder-1)

[file in nested folder 1](/notes/folder/nested-folder/file-in-nested-folder-1)

[duplicate file name](/notes/duplicate-file-name)

[duplicate file name](/notes/folder/duplicate-file-name)

[duplicate file name](/notes/folder/nested-folder/duplicate-file-name)

[root 2 with custom text](/notes/root-2)

[file in folder 1 with custom text](/notes/folder/file-in-folder-1)

[file in nested folder 1 with custom text](/notes/folder/nested-folder/file-in-nested-folder-1)

## Random heading

[Random heading](#random-heading)

[Random heading](/notes/folder/file-in-folder-1#random-heading)

[Random heading](/notes/folder/nested-folder/file-in-nested-folder-1#random-heading)

* Random list item ^root-list-item

[root-list-item](#block-root-list-item)

[Link to block in root 1](#block-root-list-item)

[Link to block in file in folder 1](/notes/folder/file-in-folder-1#block-folder-list-item)

[Link to block in file in nested folder 1](/notes/folder/nested-folder/file-in-nested-folder-1#block-nested-folder-list-item)

[A link to a file](/notes/an-image.png)

[A link to a file in folder](/notes/folder/an-image-in-folder.png)

[A link to a file in nested folder](/notes/folder/nested-folder/an-image-in-nested-folder.png)
`)

    result = await transformFixtureMdFile(fixtureName, 'folder/file in folder 1.md', options)

    expect(result.content).toBe(`[root 1](/notes/root-1)

[file in folder 2](/notes/folder/file-in-folder-2)

[file in nested folder 1](/notes/folder/nested-folder/file-in-nested-folder-1)

[duplicate file name](/notes/duplicate-file-name)

[duplicate file name](/notes/folder/duplicate-file-name)

[duplicate file name](/notes/folder/nested-folder/duplicate-file-name)

[root 1 with custom text](/notes/root-1)

[file in folder 2 with custom text](/notes/folder/file-in-folder-2)

[file in nested folder 1 with custom text](/notes/folder/nested-folder/file-in-nested-folder-1)

## Random heading

[Random heading](/notes/root-1#random-heading)

[Random heading](#random-heading)

[Random heading](/notes/folder/nested-folder/file-in-nested-folder-1#random-heading)

* Random list item ^folder-list-item

[folder-list-item](#block-folder-list-item)

[Link to block in root 1](/notes/root-1#block-root-list-item)

[Link to block in file in folder 1](#block-folder-list-item)

[Link to block in file in nested folder 1](/notes/folder/nested-folder/file-in-nested-folder-1#block-nested-folder-list-item)

[A link to a file](/notes/an-image.png)

[A link to a file in folder](/notes/folder/an-image-in-folder.png)

[A link to a file in nested folder](/notes/folder/nested-folder/an-image-in-nested-folder.png)
`)

    result = await transformFixtureMdFile(fixtureName, 'folder/nested folder/file in nested folder 1.md', options)

    expect(result.content).toBe(`[root 1](/notes/root-1)

[file in folder 1](/notes/folder/file-in-folder-1)

[file in nested folder 2](/notes/folder/nested-folder/file-in-nested-folder-2)

[duplicate file name](/notes/duplicate-file-name)

[duplicate file name](/notes/folder/duplicate-file-name)

[duplicate file name](/notes/folder/nested-folder/duplicate-file-name)

[root 1 with custom text](/notes/root-1)

[file in folder 1 with custom text](/notes/folder/file-in-folder-1)

[file in nested folder 2 with custom text](/notes/folder/nested-folder/file-in-nested-folder-2)

## Random heading

[Random heading](/notes/root-1#random-heading)

[Random heading](/notes/folder/file-in-folder-1#random-heading)

[Random heading](#random-heading)

* Random list item ^nested-folder-list-item

[nested-folder-list-item](#block-nested-folder-list-item)

[Link to block in root 1](/notes/root-1#block-root-list-item)

[Link to block in file in folder 1](/notes/folder/file-in-folder-1#block-folder-list-item)

[Link to block in file in nested folder 1](#block-nested-folder-list-item)

[A link to a file](/notes/an-image.png)

[A link to a file in folder](/notes/folder/an-image-in-folder.png)

[A link to a file in nested folder](/notes/folder/nested-folder/an-image-in-nested-folder.png)
`)
  }
})

test('supports literal percent signs in wikilinks', async () => {
  const result = await transformFixtureMdFile('basics', 'Test special % characters.md')

  expect(result.content).toBe('[Test special % characters](/notes/test-special--characters)\n')
})

test('uses resource links instead of auto links', async () => {
  const result = await transformFixtureMdFile('basics', 'Internal images with dimensions.md')

  expect(result.content).toMatch(
    /^Link to \[https:\/\/starlight.astro.build\/]\(https:\/\/starlight.astro.build\/\) which/m,
  )
})

test.for(linkSyntaxAndFormats)(
  'rebases links relative to the configured root in %s with the %s format',
  async ([syntax, format]) => {
    const fixtureName = `links-${syntax}-${format}`

    const vault = await getVault(getFixtureConfig(fixtureName, { root: 'folder' }))
    const paths = await getObsidianPaths(vault)
    const files = getObsidianVaultFiles(vault, paths)

    const result = await transformFixtureMdFile(fixtureName, 'folder/file in folder 1.md', {
      context: { copyFrontmatter: 'none', files, output: 'notes', singleDollarTextMath: true, vault },
    })

    expect(result.content).toMatch('[file in folder 2](/notes/file-in-folder-2)')
    expect(result.content).toMatch('[file in nested folder 1](/notes/nested-folder/file-in-nested-folder-1)')
    expect(result.content).toMatch('[A link to a file in folder](/notes/an-image-in-folder.png)')
  },
)

test('does not redirect shortest links outside the configured root for identical file names', async () => {
  const fixtureName = 'links-wikilink-shortest'

  const vault = await getVault(getFixtureConfig(fixtureName, { root: 'folder' }))
  const paths = await getObsidianPaths(vault)
  const files = getObsidianVaultFiles(vault, paths)

  const result = await transformFixtureMdFile(fixtureName, 'folder/link outside root.md', {
    context: { copyFrontmatter: 'none', files, output: 'notes', singleDollarTextMath: true, vault },
  })

  expect(result.content).toBe('[private/duplicate file name](/notes/private/duplicate-file-name)\n')
})
