import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('strips unsupported known and unknown properties', async () => {
  const result = await transformFixtureMdFile('basics', 'Unsupported properties.md', { includeFrontmatter: true })

  expect(result.content).not.toMatch(/unknown/)
  expect(result.content).not.toMatch(/cssclasses/)
})

test('includes supported properties', async () => {
  const result = await transformFixtureMdFile('basics', 'Supported properties.md', { includeFrontmatter: true })

  expect(result.content).toMatchInlineSnapshot(`
    "---
    title: Supported properties
    description: This is a custom description
    slug: custom-slug
    ---

    Test
    "
  `)
})
