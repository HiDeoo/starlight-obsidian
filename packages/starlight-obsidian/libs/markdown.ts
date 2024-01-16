import type { Root } from 'mdast'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'

const parser = remark().use(remarkFrontmatter).use(remarkEnsureFrontmatter)

export function transformMarkdown(markdown: string) {
  return parser.process(markdown)
}

function remarkEnsureFrontmatter() {
  return function transformer(tree: Root) {
    let hasFrontmatter = false

    // The frontmatter is always at the root of the tree.
    for (const node of tree.children) {
      if (node.type !== 'yaml') {
        continue
      }

      hasFrontmatter = true
      node.value = getFrontmatterNodeValue()
    }

    if (!hasFrontmatter) {
      tree.children.unshift({ type: 'yaml', value: getFrontmatterNodeValue() })
    }
  }
}

function getFrontmatterNodeValue() {
  // TODO(HiDeoo)
  return 'title: // TODO(HiDeoo)'
}
