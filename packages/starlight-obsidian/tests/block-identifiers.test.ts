import { rehype } from 'rehype'
import { expect, test } from 'vitest'

import { rehypeBlockIdentifiers } from '../libs/rehype'

const processor = rehype().data('settings', { fragment: true }).use(rehypeBlockIdentifiers)

test('does not transform text similar to a block identifier', async () => {
  const input = `<p>Some text ^with-a-block-identifier and some other text</p>`
  const output = String(await processor.process(input))

  expect(output).toBe(input)
})

test('transforms block identifiers in a paragraph', async () => {
  const input = `<p>Some text ^with-a-block-identifier</p>`
  const output = String(await processor.process(input))

  expect(output).toMatchInlineSnapshot(`"<p id="block-with-a-block-identifier">Some text</p>"`)
})

test('transforms block identifiers in a list item', async () => {
  const input = `<li>Some text ^with-a-block-identifier</li>`
  const output = String(await processor.process(input))

  expect(output).toMatchInlineSnapshot(`"<li id="block-with-a-block-identifier">Some text</li>"`)
})

test('transforms block identifiers in a blockquote with a single paragraph', async () => {
  const input = `<blockquote><p>Some text ^with-a-block-identifier</p></blockquote>`
  const output = String(await processor.process(input))

  expect(output).toMatchInlineSnapshot(`"<blockquote id="block-with-a-block-identifier"><p>Some text</p></blockquote>"`)
})

test('transforms block identifiers in a blockquote with multiple paragraphs', async () => {
  const input = `<blockquote><p>Some text</p><p>Other text ^with-a-block-identifier</p></blockquote>`
  const output = String(await processor.process(input))

  expect(output).toMatchInlineSnapshot(
    `"<blockquote id="block-with-a-block-identifier"><p>Some text</p><p>Other text</p></blockquote>"`,
  )
})

test('transforms block identifiers in a blockquote with an unordered list', async () => {
  const input = `<blockquote><ul><li>Some text</li><li>Other text ^with-a-block-identifier</li></ul></blockquote>`
  const output = String(await processor.process(input))

  expect(output).toMatchInlineSnapshot(
    `"<blockquote id="block-with-a-block-identifier"><ul><li>Some text</li><li>Other text</li></ul></blockquote>"`,
  )
})

test('transforms block identifiers in a blockquote with an ordered list', async () => {
  const input = `<blockquote><ol><li>Some text</li><li>Other text ^with-a-block-identifier</li></ol></blockquote>`
  const output = String(await processor.process(input))

  expect(output).toMatchInlineSnapshot(
    `"<blockquote id="block-with-a-block-identifier"><ol><li>Some text</li><li>Other text</li></ol></blockquote>"`,
  )
})
