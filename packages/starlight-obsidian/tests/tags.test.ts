import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('includes tags in the frontmatter', async () => {
  const result = await transformFixtureMdFile('basics', 'Tags.md', { includeFrontmatter: true })

  expect(result.content).toMatch(/^tags:\n\s+- page-tag1\n\s+- page-tag2$/m)
})

test('transforms inline tags in the content', async () => {
  const result = await transformFixtureMdFile('basics', 'Tags.md', { includeFrontmatter: true })

  expect(result.content).toMatchInlineSnapshot(`
    "---
    title: Tags
    editUrl: false
    tags:
      - page-tag1
      - page-tag2
    ---

    This is a <span class="sl-obs-tag">#tag</span> in a sentence and <span class="sl-obs-tag">#another</span> one.

    This is a <span class="sl-obs-tag">#nested/tag-1</span>.

    This is an invalid tag: #123.
    "
  `)
})
