import { expect, test } from 'vitest'

import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig, transformFixtureMdFile } from './utils'

test('strips unsupported known, unknown properties, and known Starlight frontmatter fields', async () => {
  const result = await transformFixtureMdFile('basics', 'Unsupported properties.md', { includeFrontmatter: true })

  expect(result.content).not.toMatch(/unknown/)
  expect(result.content).not.toMatch(/cssclasses/)
  expect(result.content).not.toMatch(/pagefind/)
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

test('includes known Starlight frontmatter fields if the option is enabled', async () => {
  const fixtureName = 'basics'
  const vault = await getVault(getFixtureConfig(fixtureName))
  const paths = await getObsidianPaths(vault)
  const files = getObsidianVaultFiles(vault, paths)
  const options = {
    context: { copyStarlightFrontmatter: true, files, output: 'notes', vault },
    includeFrontmatter: true,
  }

  const result = await transformFixtureMdFile(fixtureName, 'Starlight properties.md', options)

  expect(result.content).toMatchInlineSnapshot(`
    "---
    title: Custom Starlight Title
    editUrl: false
    slug: custom-starlight-slug
    tableOfContents: false
    description: This is a custom description
    ---

    Test
    "
  `)
})
