import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('includes tags in the frontmatter', async () => {
  const md = await transformFixtureMdFile('basics', 'Tags.md', { includeFrontmatter: true })

  expect(md).toMatch(/^tags:\n\s+- page-tag1\n\s+- page-tag2$/m)
})
