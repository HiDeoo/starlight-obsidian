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
    const options = { context: { copyFrontmatter: 'none', files, output: 'notes', vault } as const }

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

test('uses resource links instead of auto links', async () => {
  const result = await transformFixtureMdFile('basics', 'Internal images with dimensions.md')

  expect(result.content).toMatch(
    /^Link to \[https:\/\/starlight.astro.build\/]\(https:\/\/starlight.astro.build\/\) which/m,
  )
})
