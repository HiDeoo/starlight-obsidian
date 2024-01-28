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
    editUrl: false
    description: This is a custom description
    slug: custom-slug
    ---

    Test
    "
  `)
})

test.each([['cover', 'image']])('supports OG images using the `%s` property', async (property) => {
  const result = await transformFixtureMdFile('basics', `Property ${property}.md`, { includeFrontmatter: true })

  expect(result.content).toMatch(`---
title: Property ${property}
editUrl: false
head:
  - tag: meta
    attrs:
      property: og:image
      content: https://history-computer.com/ModernComputer/Basis/images/Engelbart.jpg
  - tag: meta
    attrs:
      name: twitter:image
      content: https://history-computer.com/ModernComputer/Basis/images/Engelbart.jpg
---

Test
`)
})
