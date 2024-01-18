import path from 'node:path'

import isAbsoluteUrl from 'is-absolute-url'
import type { Root } from 'mdast'
import { findAndReplace } from 'mdast-util-find-and-replace'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { SKIP, visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import type { StarlightObsidianConfig } from '..'

import type { Vault, VaultFile } from './obsidian'
import { slugifyPath } from './path'

const parser = remark()
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkEnsureFrontmatter)
  .use(remarkReplacements)
  .use(remarkLinks)

const highlightReplacementRegex = /==(?<highlight>(?:(?!==).)*)==/g
const commentReplacementRegex = /%%(?<comment>(?:(?!%%).)*)%%/gs

export async function transformMarkdown(filePath: string, markdown: string, context: TransformContext) {
  const file = new VFile({
    data: { ...context },
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

function remarkLinks() {
  return function transformer(tree: Root, file: VFile) {
    visit(tree, 'link', (node) => {
      if (isAbsoluteUrl(node.url) || !file.data.output) {
        return SKIP
      }

      const url = path.basename(decodeURIComponent(node.url))
      const matchingFile = file.data.files?.find((vaultFile) => vaultFile.fileName === url)

      if (!matchingFile) {
        return SKIP
      }

      node.url = path.posix.join(
        '/',
        file.data.output,
        matchingFile.uniqueFileName ? matchingFile.slug : slugifyPath(node.url),
      )

      return SKIP
    })
  }
}

function getFrontmatterNodeValue(file: VFile) {
  if (!file.path) {
    throw new Error('Could not find virtual file path.')
  }

  const title = path.parse(file.path).name

  return `title: ${title}`
}

export interface TransformContext {
  files: VaultFile[]
  output: StarlightObsidianConfig['output']
  vault: Vault
}

declare module 'vfile' {
  interface DataMap extends TransformContext {}
}
