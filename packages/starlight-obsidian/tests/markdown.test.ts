import { expect, test } from 'vitest'

import { transformMarkdown } from '../libs/markdown'

import { getFixtureFile } from './utils'

test('highlights text', async () => {
  const md = await transformFixtureMdFile('basics', 'Basic syntax (highlights).md')

  expect(md).toMatchInlineSnapshot(`
    "<mark class="sl-obs-highlight">Highlighted text 1</mark>

    <mark class="sl-obs-highlight">Highlighted text 2</mark>

    <mark class="sl-obs-highlight">Highlighted = text 3</mark>

    <mark class="sl-obs-highlight">Highlighted</mark> text 4 and <mark class="sl-obs-highlight">Highlighted text 5</mark>

    \`==Highlighted text in code==\`
    "
  `)
})

test('strips out comments', async () => {
  const md = await transformFixtureMdFile('basics', 'Basic syntax (comments).md')

  expect(md).toMatchInlineSnapshot(`
    "This is an  comment.

    This is an  comment and another  comment.

    "
  `)
})

async function transformFixtureMdFile(fixtureName: string, filePath: string): ReturnType<typeof transformMarkdown> {
  const md = await getFixtureFile(fixtureName, filePath)
  const transformedMd = await transformMarkdown(md)

  return transformedMd.replace(/^---\n.*\n---\n\n/, '')
}
