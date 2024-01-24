import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('strips unsupported known and unknown properties', async () => {
  const md = await transformFixtureMdFile('basics', 'Unsupported properties.md', { includeFrontmatter: true })

  expect(md).not.toMatch(/unknown/)
  expect(md).not.toMatch(/cssclasses/)
})
