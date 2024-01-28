import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('formats aliases URLs using the original source', async () => {
  let result = await transformFixtureMdFile('aliases', 'Page with links.md')

  expect(result.content).toMatchInlineSnapshot(`
    "[Page with aliases](/notes/page-with-aliases)

    [aliases](/notes/page-with-aliases)

    [this is a test](/notes/page-with-aliases)

    [Page with aliases in folder](/notes/page-with-aliases-in-folder)

    [aliases in folder](/notes/page-with-aliases-in-folder)
    "
  `)

  result = await transformFixtureMdFile('aliases', 'folder/Page with links in folder.md')

  expect(result.content).toMatchInlineSnapshot(`
    "[Page with aliases in folder](/notes/page-with-aliases-in-folder)

    [aliases in folder](/notes/page-with-aliases-in-folder)

    [Page with aliases](/notes/page-with-aliases)

    [aliases](/notes/page-with-aliases)

    [this is a test](/notes/page-with-aliases)
    "
  `)
})

test('parses and returns aliases', async () => {
  let result = await transformFixtureMdFile('aliases', 'Page with aliases.md')

  expect(result.aliases).toEqual(['alias', 'test-alias'])

  result = await transformFixtureMdFile('aliases', 'folder/Page with aliases in folder.md')

  expect(result.aliases).toEqual(['aliases-in-folder'])

  result = await transformFixtureMdFile('aliases', 'Page with links.md')

  expect(result.aliases).not.toBeDefined()
})
