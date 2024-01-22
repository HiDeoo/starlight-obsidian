import fs from 'node:fs'
import path from 'node:path'

import { toHtml } from 'hast-util-to-html'
import isAbsoluteUrl from 'is-absolute-url'
import type { BlockContent, Code, Parent, Root, RootContent } from 'mdast'
import { findAndReplace } from 'mdast-util-find-and-replace'
import { toHast } from 'mdast-util-to-hast'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

import type { StarlightObsidianConfig } from '..'

import { transformHtmlToString } from './html'
import { transformMarkdownToAST } from './markdown'
import {
  getObsidianRelativePath,
  isObsidianAsset,
  isObsidianBlockAnchor,
  slugifyObsidianAnchor,
  slugifyObsidianPath,
  type Vault,
  type VaultFile,
} from './obsidian'
import { extractPathAndAnchor, getExtension, isAnchor } from './path'

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
                fileUrl = getFileUrl(
                  file.data.output,
                  matchingFile ? getFilePathFromVaultFile(matchingFile, urlPath) : urlPath,
                  urlAnchor,
                )
                break
              }
            }
          }

          if (match.startsWith('!')) {
            return {
              type: 'image',
              url: isMarkdownAsset(url, file) ? url : fileUrl,
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
          node.url = getFileUrl(file.data.output, getFilePathFromVaultFile(matchingFile, node.url), urlAnchor)
          break
        }
      }

      return SKIP
    })
  }
}

export function remarkMarkdownAssets() {
  return function transformer(tree: Root, file: VFile) {
    visit(tree, 'image', (node, index, parent) => {
      ensureTransformContext(file)

      if (isAbsoluteUrl(node.url) || !file.dirname) {
        return SKIP
      }

      if (isMarkdownAsset(node.url, file)) {
        replaceNode(parent, index, getMarkdownAssetNode(file, node.url))
        return SKIP
      }

      let fileUrl = node.url

      if (file.data.vault.options.linkSyntax !== 'wikilink') {
        switch (file.data.vault.options.linkFormat) {
          case 'relative': {
            fileUrl = getFileUrl(file.data.output, getRelativeFilePath(file, node.url))
            break
          }
          case 'absolute': {
            fileUrl = getFileUrl(file.data.output, slugifyObsidianPath(node.url))
            break
          }
          case 'shortest': {
            const url = path.basename(decodeURIComponent(node.url))
            const [urlPath] = extractPathAndAnchor(url)
            const matchingFile = file.data.files.find((vaultFile) => vaultFile.fileName === urlPath)

            if (!matchingFile) {
              break
            }

            fileUrl = getFileUrl(file.data.output, getFilePathFromVaultFile(matchingFile, node.url))
            break
          }
        }
      }

      if (isCustomAsset(node.url)) {
        replaceNode(parent, index, getCustomAssetNode(fileUrl))

        return SKIP
      }

      node.url = fileUrl

      return SKIP
    })
  }
}

export function remarkMermaid() {
  return async function transformer(tree: Root) {
    const mermaidNodes: [node: Code, index: number | undefined, parent: Parent | undefined][] = []

    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        mermaidNodes.push([node, index, parent])
        return SKIP
      }

      return CONTINUE
    })

    await Promise.all(
      mermaidNodes.map(async ([node, index, parent]) => {
        const html = toHtml(toHast(node))
        const processedHtml = await transformHtmlToString(html)

        replaceNode(parent, index, { type: 'html', value: processedHtml })
      }),
    )
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

function getFilePathFromVaultFile(vaultFile: VaultFile, url: string) {
  return vaultFile.uniqueFileName ? vaultFile.slug : slugifyObsidianPath(url)
}

function isMarkdownAsset(filePath: string, file: VFile) {
  return (
    (file.data.vault?.options.linkSyntax === 'markdown' && filePath.endsWith('.md')) ||
    getExtension(filePath).length === 0
  )
}

// Custom asset nodes are replaced by a custom HTML node, e.g. an audio player for audio files, etc.
function isCustomAsset(filePath: string) {
  return isObsidianAsset(filePath) && !isObsidianAsset(filePath, 'image')
}

function getCustomAssetNode(filePath: string): RootContent {
  if (isObsidianAsset(filePath, 'audio')) {
    return {
      type: 'html',
      value: `<audio class="sl-obs-embed-audio" controls src="${filePath}"></audio>`,
    }
  } else if (isObsidianAsset(filePath, 'video')) {
    return {
      type: 'html',
      value: `<video class="sl-obs-embed-video" controls src="${filePath}"></video>`,
    }
  }

  return {
    type: 'html',
    value: `<iframe class="sl-obs-embed-pdf" src="${filePath}"></iframe>`,
  }
}

function getMarkdownAssetNode(file: VFile, fileUrl: string): RootContent {
  ensureTransformContext(file)

  const fileExt = file.data.vault.options.linkSyntax === 'wikilink' ? '.md' : ''
  const filePath = decodeURIComponent(
    file.data.vault.options.linkFormat === 'relative' ? getRelativeFilePath(file, fileUrl) : fileUrl,
  )
  const url = path.join('/', `${filePath}${fileExt}`)

  const matchingFile = file.data.files.find((vaultFile) => vaultFile.path === url)

  if (!matchingFile) {
    return { type: 'text', value: '' }
  }

  const content = fs.readFileSync(matchingFile.fsPath, 'utf8')
  const root = transformMarkdownToAST(matchingFile.fsPath, content, file.data)

  return {
    type: 'blockquote',
    children: [
      {
        type: 'html',
        value: `<strong>${matchingFile.stem}</strong>`,
      },
      ...(root.children as BlockContent[]),
    ],
  }
}

function replaceNode(parent: Parent | undefined, index: number | undefined, replacement: RootContent) {
  if (!parent || index === undefined) {
    return
  }

  parent.children[index] = replacement
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
