import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('strips unsupported known and unknown properties', async () => {
  const md = await transformFixtureMdFile('basics', 'Unsupported properties.md', { includeFrontmatter: true })

  expect(md).not.toMatch(/unknown/)
  expect(md).not.toMatch(/cssclasses/)
})

test('includes supported properties', async () => {
  const md = await transformFixtureMdFile('basics', 'Supported properties.md', { includeFrontmatter: true })

  expect(md).toMatchInlineSnapshot(`
    "---
    title: Supported properties
    description: This is a custom description
    slug: custom-slug
    ---

    Test
    "
  `)
})
