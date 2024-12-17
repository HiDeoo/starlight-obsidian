import type { Element, ElementContent, Root } from 'hast'
import { toString } from 'hast-util-to-string'
import { h } from 'hastscript'
import { escape } from 'html-escaper'
import type { Literal } from 'mdast'
import type { Options as RehypeAutolinkHeadingsOptions } from 'rehype-autolink-headings'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'

const blockIdentifierRegex = /(?<identifier> *\^(?<name>[\w-]+))$/

export function rehypeStarlightObsidian() {
  return function transformer(tree: Root) {
    // Blocks are supported in paragraphs, list items, and blockquotes.
    // https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link%20to%20a%20block%20in%20a%20note
    visit(tree, 'element', (node) => {
      // Handle blockqoutes first as they are block which can contain paragraphs or list items and we want to hoist
      // the IDs to the blockquote element.
      if (node.tagName === 'blockquote') {
        const lastChild = node.children.at(-1)

        if (
          !lastChild ||
          lastChild.type !== 'element' ||
          !(lastChild.tagName === 'p' || lastChild.tagName === 'ul' || lastChild.tagName === 'ol')
        ) {
          return CONTINUE
        }

        const lastGrandChild = lastChild.children.at(-1)

        if (lastChild.tagName === 'p') {
          return transformBlockIdentifier(node, lastGrandChild)
        } else if (lastGrandChild?.type === 'element' && lastGrandChild.tagName === 'li') {
          return transformBlockIdentifier(node, lastGrandChild.children.at(-1))
        }
      } else if (node.tagName === 'p' || node.tagName === 'li') {
        return transformBlockIdentifier(node, node.children.at(-1))
      }

      return CONTINUE
    })
  }
}

// https://hideoo.dev/notes/starlight-heading-links
// https://github.com/withastro/docs/blob/main/plugins/rehype-autolink.ts
// https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/
export function getRehypeAutolinkHeadingsOptions(): RehypeAutolinkHeadingsOptions {
  return {
    behavior: 'after',
    content: (heading) => {
      return [
        h('span', { ariaHidden: 'true' }, '§'),
        h('span', { class: 'sr-only' }, `Section titled ${escape(toString(heading))}`),
      ]
    },
    group: ({ tagName }) =>
      h('div', { class: `sl-obs-section sl-obs-section-level-${tagName.slice(1)}`, tabIndex: -1 }),
    properties: { class: 'sl-obs-heading-link' },
  }
}

function transformBlockIdentifier(reference: Element, node: ElementContent | undefined) {
  if (!isNodeWithValue(node)) {
    return CONTINUE
  }

  const identifier = getBlockIdentifer(node)

  if (!identifier) {
    return CONTINUE
  }

  node.value = node.value.slice(0, identifier.length * -1)
  reference.properties['id'] = `block-${identifier.name}`

  return SKIP
}

function isNodeWithValue(node: ElementContent | undefined): node is NodeWithValue {
  return node !== undefined && 'value' in node
}

function getBlockIdentifer(node: NodeWithValue): { length: number; name: string } | undefined {
  const match = blockIdentifierRegex.exec(node.value)
  const identifier = match?.groups?.['identifier']
  const name = match?.groups?.['name']

  if (!identifier || !name) {
    return undefined
  }

  return { length: identifier.length, name }
}

type NodeWithValue = ElementContent & Literal
