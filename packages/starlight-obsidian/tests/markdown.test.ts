import { expect, test } from 'vitest'

import { transformMarkdown } from '../libs/markdown'

import { getFixtureFile } from './utils'

test('supports basic syntax', async () => {
  const md = await transformFixtureMdFile('basics', 'Basic syntax.md')

  expect(md).toMatchInlineSnapshot(`
    "This is a paragraph.

    This is another paragraph.

    # This is a heading 1

    ## This is a heading 2

    ### This is a heading 3

    #### This is a heading 4

    ##### This is a heading 5

    ###### This is a heading 6

    **Bold text**

    **Bold text alternative**

    *Italic text*

    *Italic text alternative*

    ~~Striked out text~~

    <mark class="sl-obs-highlight">Highlighted text 1</mark>

    <mark class="sl-obs-highlight">Highlighted text 2</mark>

    \`==Highlighted text in code==\`

    // TODO(HiDeoo) <https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax>
    "
  `)
})

async function transformFixtureMdFile(fixtureName: string, filePath: string): ReturnType<typeof transformMarkdown> {
  const md = await getFixtureFile(fixtureName, filePath)
  const transformedMd = await transformMarkdown(md)

  return transformedMd.replace(/^---\n.*\n---\n\n/, '')
}
