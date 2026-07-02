import type { Element, ElementContent, Root } from 'hast'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'

import { getBlockIdentifier, getLastContentChild, isNodeWithValue } from './markdown'

export function rehypeStarlightObsidian() {
  return function transformer(tree: Root) {
    // Blocks are supported in paragraphs, list items, and blockquotes.
    // https://help.obsidian.md/Linking+notes+and+files/Internal+links#Link%20to%20a%20block%20in%20a%20note
    visit(tree, 'element', (node) => {
      // Handle blockqoutes first as they are block which can contain paragraphs or list items and we want to hoist
      // the IDs to the blockquote element.
      if (node.tagName === 'blockquote') {
        const lastChild = getLastContentChild(node.children)?.child

        if (
          lastChild?.type !== 'element' ||
          !(lastChild.tagName === 'p' || lastChild.tagName === 'ul' || lastChild.tagName === 'ol')
        ) {
          return CONTINUE
        }

        const lastGrandChild = getLastContentChild(lastChild.children)?.child

        if (lastChild.tagName === 'p') {
          return transformBlockIdentifier(node, lastGrandChild)
        } else if (lastGrandChild?.type === 'element' && lastGrandChild.tagName === 'li') {
          return transformBlockIdentifier(node, getLastContentChild(lastGrandChild.children)?.child)
        }
      } else if (node.tagName === 'p' || node.tagName === 'li') {
        return transformBlockIdentifier(node, getLastContentChild(node.children)?.child)
      }

      return CONTINUE
    })
  }
}

function transformBlockIdentifier(reference: Element, node: ElementContent | undefined) {
  if (!isNodeWithValue(node)) {
    return CONTINUE
  }

  const identifier = getBlockIdentifier(node)

  if (!identifier) {
    return CONTINUE
  }

  node.value = node.value.slice(0, identifier.length * -1)
  reference.properties['id'] = `block-${identifier.name}`

  return SKIP
}
