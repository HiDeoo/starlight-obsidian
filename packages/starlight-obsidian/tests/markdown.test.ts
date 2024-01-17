import { expect, test } from 'vitest'

import { transformMarkdown } from '../libs/markdown'

import { getFixtureFile } from './utils'

test('supports GitHub Flavored Markdown', async () => {
  const md = await transformFixtureMdFile('basics', 'gfm.md')

  // If GFM is not supported, the task list items would look like `* \[x] …
  expect(md).not.toContain('\\[')
})

async function transformFixtureMdFile(fixtureName: string, filePath: string): ReturnType<typeof transformMarkdown> {
  const md = await getFixtureFile(fixtureName, filePath)
  const transformedMd = await transformMarkdown(md)

  return transformedMd.replace(/^---\n.*\n---\n\n/, '')
}
