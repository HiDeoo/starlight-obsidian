import path from 'node:path'

import type { Root } from 'mdast'
import { findAndReplace } from 'mdast-util-find-and-replace'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { VFile } from 'vfile'

const parser = remark().use(remarkGfm).use(remarkFrontmatter).use(remarkEnsureFrontmatter).use(remarkReplacements)

const highlightReplacementRegex = /==(?<highlight>(?:(?!==).)*)==/g
const commentReplacementRegex = /%%(?<comment>(?:(?!%%).)*)%%/gs

export async function transformMarkdown(markdown: string, filePath: string) {
  const file = new VFile({
    path: filePath,
    value: markdown,
  })

  const compiled = await parser.process(file)

  return String(compiled)
}

function remarkEnsureFrontmatter() {
  return function transformer(tree: Root, file: VFile) {
    let hasFrontmatter = false

    // The frontmatter is always at the root of the tree.
    for (const node of tree.children) {
      if (node.type !== 'yaml') {
        continue
      }

      hasFrontmatter = true
      node.value = getFrontmatterNodeValue(file)
      break
    }

    if (!hasFrontmatter) {
      tree.children.unshift({ type: 'yaml', value: getFrontmatterNodeValue(file) })
    }
  }
}

function remarkReplacements() {
  return function transformer(tree: Root) {
    findAndReplace(tree, [
      [
        highlightReplacementRegex,
        (_match: string, highlight: string) => ({
          type: 'html',
          value: `<mark class="sl-obs-highlight">${highlight}</mark>`,
        }),
      ],
      [commentReplacementRegex, null],
    ])
  }
}

function getFrontmatterNodeValue(file: VFile) {
  if (!file.path) {
    throw new Error('Could not find virtual file path.')
  }

  const title = path.parse(file.path).name

  return `title: ${title}`
}
