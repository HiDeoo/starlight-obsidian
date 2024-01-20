import path from 'node:path'

import isAbsoluteUrl from 'is-absolute-url'
import type { Root } from 'mdast'
import { findAndReplace } from 'mdast-util-find-and-replace'
import { SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

import type { StarlightObsidianConfig } from '..'

import {
  getObsidianRelativePath,
  isObsidianBlockAnchor,
  slugifyObsidianAnchor,
  slugifyObsidianPath,
  type Vault,
  type VaultFile,
} from './obsidian'
import { extractPathAndAnchor, isAnchor } from './path'

const highlightReplacementRegex = /==(?<highlight>(?:(?!==).)+)==/g
const commentReplacementRegex = /%%(?<comment>(?:(?!%%).)+)%%/gs
const wikilinkReplacementRegex = /!?\[\[(?<url>(?:(?![[\]|]).)+)(?:\|(?<maybeText>(?:(?![[\]|]).)+))?]]/g

export function remarkEnsureFrontmatter() {
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

export function remarkReplacements() {
  return function transformer(tree: Root, file: VFile) {
    findAndReplace(tree, [
      [
        highlightReplacementRegex,
        (_match: string, highlight: string) => ({
          type: 'html',
          value: `<mark class="sl-obs-highlight">${highlight}</mark>`,
        }),
      ],
      [commentReplacementRegex, null],
      [
        wikilinkReplacementRegex,
        (match: string, url: string, maybeText?: string) => {
          ensureTransformContext(file)

          let fileUrl: string
          let text = maybeText ?? url

          if (isAnchor(url)) {
            fileUrl = slugifyObsidianAnchor(url)
            text = maybeText ?? url.slice(isObsidianBlockAnchor(url) ? 2 : 1)
          } else {
            const [urlPath, urlAnchor] = extractPathAndAnchor(url)
            const matchingFile = file.data.files.find(
              (vaultFile) => vaultFile.stem === urlPath || vaultFile.fileName === urlPath,
            )

            switch (file.data.vault.options.linkFormat) {
              case 'relative': {
                fileUrl = getFileUrl(file.data.output, getRelativeFilePath(file, urlPath), urlAnchor)
                break
              }
              case 'absolute':
              case 'shortest': {
                fileUrl = getFileUrl(file.data.output, matchingFile ? matchingFile.slug : urlPath, urlAnchor)
                break
              }
            }
          }

          if (match.startsWith('!')) {
            return {
              type: 'image',
              url: fileUrl,
              alt: text,
            }
          }

          return {
            children: [{ type: 'text', value: text }],
            type: 'link',
            url: fileUrl,
          }
        },
      ],
    ])
  }
}

export function remarkMarkdownLinks() {
  return function transformer(tree: Root, file: VFile) {
    visit(tree, 'link', (node) => {
      ensureTransformContext(file)

      if (file.data.vault.options.linkSyntax === 'wikilink' || isAbsoluteUrl(node.url) || !file.dirname) {
        return SKIP
      }

      if (isAnchor(node.url)) {
        node.url = slugifyObsidianAnchor(node.url)
        return SKIP
      }

      const url = path.basename(decodeURIComponent(node.url))
      const [urlPath, urlAnchor] = extractPathAndAnchor(url)
      const matchingFile = file.data.files.find((vaultFile) => vaultFile.fileName === urlPath)

      if (!matchingFile) {
        return SKIP
      }

      switch (file.data.vault.options.linkFormat) {
        case 'relative': {
          node.url = getFileUrl(file.data.output, getRelativeFilePath(file, node.url), urlAnchor)
          break
        }
        case 'absolute':
        case 'shortest': {
          node.url = getFileUrl(
            file.data.output,
            matchingFile.uniqueFileName ? matchingFile.slug : slugifyObsidianPath(node.url),
            urlAnchor,
          )
          break
        }
      }

      return SKIP
    })
  }
}

export function remarkMarkdownImages() {
  return function transformer(tree: Root, file: VFile) {
    visit(tree, 'image', (node) => {
      ensureTransformContext(file)

      if (file.data.vault.options.linkSyntax === 'wikilink' || isAbsoluteUrl(node.url) || !file.dirname) {
        return SKIP
      }

      switch (file.data.vault.options.linkFormat) {
        case 'relative': {
          node.url = getFileUrl(file.data.output, getRelativeFilePath(file, node.url))
          break
        }
        case 'absolute': {
          node.url = getFileUrl(file.data.output, slugifyObsidianPath(node.url))
          break
        }
        case 'shortest': {
          const url = path.basename(decodeURIComponent(node.url))
          const [urlPath] = extractPathAndAnchor(url)
          const matchingFile = file.data.files.find((vaultFile) => vaultFile.fileName === urlPath)

          if (!matchingFile) {
            break
          }

          node.url = getFileUrl(file.data.output, matchingFile.slug)
          break
        }
      }

      return SKIP
    })
  }
}

function getFrontmatterNodeValue(file: VFile) {
  return `title: ${file.stem}`
}

function getFileUrl(output: StarlightObsidianConfig['output'], filePath: string, anchor?: string) {
  return `${path.posix.join('/', output, slugifyObsidianPath(filePath))}${slugifyObsidianAnchor(anchor ?? '')}`
}

function getRelativeFilePath(file: VFile, relativePath: string) {
  ensureTransformContext(file)

  return path.posix.join(getObsidianRelativePath(file.data.vault, file.dirname), relativePath)
}

function ensureTransformContext(file: VFile): asserts file is VFile & { data: TransformContext; dirname: string } {
  if (!file.dirname || !file.data.files || file.data.output === undefined || !file.data.vault) {
    throw new Error('Invalid transform context.')
  }
}

export interface TransformContext {
  files: VaultFile[]
  output: StarlightObsidianConfig['output']
  vault: Vault
}

declare module 'vfile' {
  interface DataMap extends TransformContext {}
}
