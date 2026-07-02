import type { Element, ElementContent, Parents } from 'hast'
import { defineHastPlugin, type HastPluginDefinition, type HastVisitorContext } from 'satteri'

import { getBlockIdentifier, getLastContentChild, isNodeWithValue } from './markdown'

export function satteriStarlightObsidian(): HastPluginDefinition {
  return defineHastPlugin({
    name: 'starlight-obsidian',
    element: {
      filter: ['blockquote', 'p', 'li'],
      visit(node, ctx) {
        if (node.tagName === 'blockquote') {
          const lastChild = getLastContentChild(node.children)?.child

          if (
            lastChild?.type !== 'element' ||
            !(lastChild.tagName === 'p' || lastChild.tagName === 'ul' || lastChild.tagName === 'ol')
          ) {
            return
          }

          const lastGrandChild = getLastContentChild(lastChild.children)?.child

          if (lastChild.tagName === 'p') {
            transformBlockIdentifier(node, lastGrandChild, ctx)
          } else if (lastGrandChild?.type === 'element' && lastGrandChild.tagName === 'li') {
            transformBlockIdentifier(node, getLastContentChild(lastGrandChild.children)?.child, ctx)
          }
        } else if (node.tagName === 'p' || node.tagName === 'li') {
          if (isInsideBlockquoteWithIdentifier(node, ctx)) return

          transformBlockIdentifier(node, getLastContentChild(node.children)?.child, ctx)
        }
      },
    },
  })
}

function transformBlockIdentifier(reference: Element, node: ElementContent | undefined, ctx: HastVisitorContext) {
  if (!isNodeWithValue(node)) return

  const identifier = getBlockIdentifier(node)
  if (!identifier) return

  ctx.setProperty(node, 'value', node.value.slice(0, identifier.length * -1))
  ctx.setProperty(reference, 'id', `block-${identifier.name}`)
}

function isInsideBlockquoteWithIdentifier(node: Element, ctx: HastVisitorContext) {
  let parent: Parents | undefined = ctx.parent(node)

  while (parent !== undefined) {
    if (parent.type === 'element' && parent.tagName === 'blockquote') {
      return blockquoteHasIdentifier(parent)
    }

    parent = ctx.parent(parent)
  }

  return false
}

function blockquoteHasIdentifier(blockquote: Element) {
  const lastChild = getLastContentChild(blockquote.children)?.child

  if (
    lastChild?.type !== 'element' ||
    !(lastChild.tagName === 'p' || lastChild.tagName === 'ul' || lastChild.tagName === 'ol')
  ) {
    return false
  }

  const lastGrandChild = getLastContentChild(lastChild.children)?.child

  if (lastChild.tagName === 'p') {
    return isNodeWithValue(lastGrandChild) && getBlockIdentifier(lastGrandChild) !== undefined
  }

  if (lastGrandChild?.type !== 'element' || lastGrandChild.tagName !== 'li') {
    return false
  }

  const lastListItemChild = getLastContentChild(lastGrandChild.children)?.child

  return isNodeWithValue(lastListItemChild) && getBlockIdentifier(lastListItemChild) !== undefined
}
