import type { Root } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import { rehype } from 'rehype'
import { markdownToHtml } from 'satteri'
import { describe, expect, test } from 'vitest'

import { rehypeStarlightObsidian } from '../libs/rehype'
import { satteriStarlightObsidian } from '../libs/satteri'

const rehypeProcessor = rehype().data('settings', { fragment: true }).use(rehypeStarlightObsidian)

const processors = [
  {
    name: 'unified',
    process: async (input: string) => {
      const tree = toHast(fromMarkdown(input))
      const result = (await rehypeProcessor.run(tree)) as Root
      return normalizeHtml(toHtml(result))
    },
  },
  {
    name: 'satteri',
    process: async (input: string) => {
      const result = await markdownToHtml(input, { hastPlugins: [satteriStarlightObsidian] })
      return normalizeHtml(result.html)
    },
  },
] as const

describe.for(processors)('$name processor', ({ process }) => {
  test('does not transform text similar to a block identifier', async () => {
    const output = await process('Some text ^with-a-block-identifier and some other text')

    expect(output).toBe('<p>Some text ^with-a-block-identifier and some other text</p>')
  })

  test('transforms block identifiers in a paragraph', async () => {
    const output = await process('Some text ^with-a-block-identifier')

    expect(output).toBe(`<p id="block-with-a-block-identifier">Some text</p>`)
  })

  test('transforms block identifiers in a list item', async () => {
    const output = await process('- Some text ^with-a-block-identifier')

    expect(output).toBe(`<ul><li id="block-with-a-block-identifier">Some text</li></ul>`)
  })

  test('transforms block identifiers in a blockquote with a single paragraph', async () => {
    const output = await process('> Some text ^with-a-block-identifier')

    expect(output).toBe(`<blockquote id="block-with-a-block-identifier"><p>Some text</p></blockquote>`)
  })

  test('transforms block identifiers in a blockquote with multiple paragraphs', async () => {
    const output = await process('> Some text\n>\n> Other text ^with-a-block-identifier')

    expect(output).toBe(`<blockquote id="block-with-a-block-identifier"><p>Some text</p><p>Other text</p></blockquote>`)
  })

  test('transforms block identifiers in a blockquote with an unordered list', async () => {
    const output = await process('> - Some text\n> - Other text ^with-a-block-identifier')

    expect(output).toBe(
      `<blockquote id="block-with-a-block-identifier"><ul><li>Some text</li><li>Other text</li></ul></blockquote>`,
    )
  })

  test('transforms block identifiers in a blockquote with an ordered list', async () => {
    const output = await process('> 1. Some text\n> 2. Other text ^with-a-block-identifier')

    expect(output).toBe(
      `<blockquote id="block-with-a-block-identifier"><ol><li>Some text</li><li>Other text</li></ol></blockquote>`,
    )
  })

  test('does not transform descendant identifiers after a blockquote identifier', async () => {
    const output = await process('> First text ^first\n>\n> Last text ^last')

    expect(output).toBe(`<blockquote id="block-last"><p>First text ^first</p><p>Last text</p></blockquote>`)
  })
})

function normalizeHtml(html: string) {
  return html.trim().replaceAll(/>\s+</g, '><')
}
