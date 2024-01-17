import type { Root } from 'mdast'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

const parser = remark().use(remarkGfm).use(remarkFrontmatter).use(remarkEnsureFrontmatter)

export async function transformMarkdown(markdown: string) {
  const file = await parser.process(markdown)

  return String(file)
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
      break
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
