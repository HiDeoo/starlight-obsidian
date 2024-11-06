import fs from 'node:fs'
import path from 'node:path'

import twitterMatcher from '@astro-community/astro-embed-twitter/matcher'
import youtubeMatcher from '@astro-community/astro-embed-youtube/matcher'
import { toHtml } from 'hast-util-to-html'
import isAbsoluteUrl from 'is-absolute-url'
import type { BlockContent, Blockquote, Code, Html, Image, Link, Parent, Root, RootContent } from 'mdast'
import { findAndReplace } from 'mdast-util-find-and-replace'
import { toHast } from 'mdast-util-to-hast'
import { customAlphabet } from 'nanoid'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'
import yaml from 'yaml'

import type { StarlightObsidianConfig } from '..'

import { transformHtmlToString } from './html'
import { transformMarkdownToAST } from './markdown'
import {
  getObsidianRelativePath,
  isObsidianFile,
  isObsidianBlockAnchor,
  parseObsidianFrontmatter,
  slugifyObsidianAnchor,
  slugifyObsidianPath,
  type ObsidianFrontmatter,
  type Vault,
  type VaultFile,
} from './obsidian'
import { extractPathAndAnchor, getExtension, isAnchor } from './path'
import { getStarlightCalloutType, getStarlightLikeFrontmatter, isAssetFile } from './starlight'

const generateAssetImportId = customAlphabet('abcdefghijklmnopqrstuvwxyz', 6)

const highlightReplacementRegex = /==(?<highlight>(?:(?!==).)+)==/g
const commentReplacementRegex = /%%(?<comment>(?:(?!%%).)+)%%/gs
const wikilinkReplacementRegex = /!?\[\[(?<url>(?:(?![[\]|]).)+)(?:\|(?<maybeText>(?:(?![[\]]).)+))?]]/g
const tagReplacementRegex = /(?:^|\s)#(?<tag>[\w/-]+)/g
const calloutRegex = /^\[!(?<type>\w+)][+-]? ?(?<title>.*)$/
const imageSizeRegex = /^(?:(?<altText>.*)\|)?(?:(?<widthOnly>\d+)|(?:(?<width>\d+)x(?<height>\d+)))$/

const asideDelimiter = ':::'

export function remarkStarlightObsidian() {
  return async function transformer(tree: Root, file: VFile) {
    const obsidianFrontmatter = getObsidianFrontmatter(tree)

    if (obsidianFrontmatter && obsidianFrontmatter.publish === false) {
      file.data.skip = true
      return
    }

    handleReplacements(tree, file)
    await handleMermaid(tree, file)
    await handleImagesAndNoteEmbeds(tree, file)

    visit(tree, (node, index, parent) => {
      const context: VisitorContext = { file, index, parent }

      switch (node.type) {
        case 'math':
        case 'inlineMath': {
          return handleMath(context)
        }
        case 'link': {
          return handleLinks(node, context)
        }
        case 'blockquote': {
          return handleBlockquotes(node, context)
        }
        default: {
          return CONTINUE
        }
      }
    })

    handleFrontmatter(tree, file, obsidianFrontmatter)
    handleImports(tree, file)
  }
}

function getObsidianFrontmatter(tree: Root) {
  // The frontmatter is always at the root of the tree.
  for (const node of tree.children) {
    if (node.type !== 'yaml') {
      continue
    }

    const obsidianFrontmatter = parseObsidianFrontmatter(node.value)

    if (obsidianFrontmatter) {
      return obsidianFrontmatter
    }
  }

  return
}

function handleFrontmatter(tree: Root, file: VFile, obsidianFrontmatter?: ObsidianFrontmatter) {
  // Remove the existing frontmatter, if any, for embedded notes.
  if (file.data.embedded) {
    // The frontmatter is always at the root of the tree.
    for (const [index, node] of tree.children.entries()) {
      if (node.type !== 'yaml') {
        continue
      }

      tree.children.splice(index, 1)
      break
    }

    return
  }

  let hasFrontmatter = false

  // The frontmatter is always at the root of the tree.
  for (const node of tree.children) {
    if (node.type !== 'yaml') {
      continue
    }

    node.value = getFrontmatterNodeValue(file, obsidianFrontmatter)
    hasFrontmatter = true

    if (obsidianFrontmatter?.aliases && obsidianFrontmatter.aliases.length > 0) {
      file.data.aliases = obsidianFrontmatter.aliases
    }

    break
  }

  if (!hasFrontmatter) {
    tree.children.unshift({ type: 'yaml', value: getFrontmatterNodeValue(file) })
  }
}

function handleImports(tree: Root, file: VFile) {
  if (
    !file.data.includeTwitterComponent &&
    !file.data.includeYoutubeComponent &&
    (!file.data.assetImports || file.data.assetImports.length === 0)
  ) {
    return
  }

  file.data.isMdx = true

  const imports: Html[] = []

  if (file.data.includeTwitterComponent) {
    imports.push(createMdxNode(`import Twitter from 'starlight-obsidian/components/Twitter.astro'`))
  }

  if (file.data.includeYoutubeComponent) {
    imports.push(createMdxNode(`import Youtube from 'starlight-obsidian/components/Youtube.astro'`))
  }

  if (file.data.assetImports) {
    imports.push(
      createMdxNode(`import { Image } from 'astro:assets'`),
      ...file.data.assetImports.map(([id, path]) => createMdxNode(`import ${id} from '${path}'`)),
    )
  }

  tree.children.splice(1, 0, ...imports)
}

function handleReplacements(tree: Root, file: VFile) {
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

          switch (file.data.vault.options.linkFormat) {
            case 'relative': {
              fileUrl = getFileUrl(file.data.output, getRelativeFilePath(file, urlPath), urlAnchor)
              break
            }
            case 'absolute':
            case 'shortest': {
              const matchingFile = file.data.files.find(
                (vaultFile) => vaultFile.isEqualStem(urlPath) || vaultFile.isEqualFileName(urlPath),
              )

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
          const isMarkdown = isMarkdownFile(url, file)

          return {
            type: 'image',
            url: isMarkdown ? url : fileUrl,
            alt: text,
            data: { isAssetResolved: !isMarkdown },
          }
        }

        return {
          children: [{ type: 'text', value: text }],
          type: 'link',
          url: fileUrl,
        }
      },
    ],
    [
      tagReplacementRegex,
      (_match: string, tag: string) => {
        // Tags with only numbers are not valid.
        // https://help.obsidian.md/Editing+and+formatting/Tags#Tag%20format
        if (/^\d+$/.test(tag)) {
          return false
        }

        return {
          type: 'html',
          value: ` <span class="sl-obs-tag">#${tag}</span>`,
        }
      },
    ],
  ])
}

function handleMath({ file }: VisitorContext) {
  file.data.includeKatexStyles = true
  return SKIP
}

function handleLinks(node: Link, { file }: VisitorContext) {
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
  const matchingFile = file.data.files.find((vaultFile) => vaultFile.isEqualFileName(urlPath))

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
}

async function handleImages(node: Image, context: VisitorContext) {
  const { file } = context

  ensureTransformContext(file)

  if (!file.dirname) {
    return SKIP
  }

  if (isAbsoluteUrl(node.url)) {
    const isExternalEmbed = handleExternalEmbeds(node, context)

    if (isExternalEmbed) {
      return SKIP
    }

    if (isObsidianFile(node.url, 'image')) {
      handleImagesWithSize(node, context, 'external')
    }

    return SKIP
  }

  if (isMarkdownFile(node.url, file)) {
    replaceNode(context, await getMarkdownFileNode(file, node.url))
    return SKIP
  }

  let fileUrl = node.url

  if (!node.data?.isAssetResolved) {
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
        const matchingFile = file.data.files.find((vaultFile) => vaultFile.isEqualFileName(urlPath))

        if (!matchingFile) {
          break
        }

        fileUrl = getFileUrl(file.data.output, getFilePathFromVaultFile(matchingFile, node.url))
        break
      }
    }
  }

  if (isCustomFile(node.url)) {
    replaceNode(context, getCustomFileNode(fileUrl))

    return SKIP
  }

  node.url = isAssetFile(fileUrl) ? getAssetPath(file, fileUrl) : fileUrl

  if (isAssetFile(node.url)) {
    handleImagesWithSize(node, context, 'asset')
  }

  return SKIP
}

function handleBlockquotes(node: Blockquote, context: VisitorContext) {
  const [firstChild, ...otherChildren] = node.children

  if (firstChild?.type !== 'paragraph') {
    return SKIP
  }

  const [firstGrandChild, ...otherGrandChildren] = firstChild.children

  if (firstGrandChild?.type !== 'text') {
    return SKIP
  }

  const [firstLine, ...otherLines] = firstGrandChild.value.split(/\r?\n/)

  if (!firstLine) {
    return SKIP
  }

  const match = firstLine.match(calloutRegex)

  const { title, type } = match?.groups ?? {}

  if (!match || !type) {
    return SKIP
  }

  const asideTitle = title && title.length > 0 ? `[${title.trim()}]` : ''

  const aside: RootContent[] = [
    {
      type: 'paragraph',
      children: [
        {
          type: 'html',
          value: `${asideDelimiter}${getStarlightCalloutType(type)}${asideTitle}\n${otherLines.join('\n')}`,
        },
        ...otherGrandChildren,
        ...(otherChildren.length === 0 ? [{ type: 'html', value: `\n${asideDelimiter}` } satisfies RootContent] : []),
      ],
    },
  ]

  if (otherChildren.length > 0) {
    aside.push(...otherChildren, { type: 'html', value: asideDelimiter })
  }

  replaceNode(context, aside)

  return CONTINUE
}

async function handleMermaid(tree: Root, file: VFile) {
  const mermaidNodes: [node: Code, context: VisitorContext][] = []

  visit(tree, 'code', (node, index, parent) => {
    if (node.lang === 'mermaid') {
      mermaidNodes.push([node, { file, index, parent }])
      return SKIP
    }

    return CONTINUE
  })

  await Promise.all(
    mermaidNodes.map(async ([node, context]) => {
      const html = toHtml(toHast(node))
      const processedHtml = await transformHtmlToString(html)

      replaceNode(context, { type: 'html', value: processedHtml })
    }),
  )
}

async function handleImagesAndNoteEmbeds(tree: Root, file: VFile) {
  const imageNodes: [node: Image, context: VisitorContext][] = []

  visit(tree, 'image', (node, index, parent) => {
    imageNodes.push([node, { file, index, parent }])
    return SKIP
  })

  await Promise.all(
    imageNodes.map(async ([node, context]) => {
      await handleImages(node, context)
    }),
  )
}

function getFrontmatterNodeValue(file: VFile, obsidianFrontmatter?: ObsidianFrontmatter) {
  let frontmatter: Frontmatter = {
    title: file.stem,
    editUrl: false,
  }

  if (obsidianFrontmatter && (file.data.copyFrontmatter === 'starlight' || file.data.copyFrontmatter === 'all')) {
    if (file.data.copyFrontmatter === 'starlight') {
      const starlightLikeFrontmatter = getStarlightLikeFrontmatter(obsidianFrontmatter.raw)
      frontmatter = { ...frontmatter, ...starlightLikeFrontmatter }
    } else {
      const { cover, image, description, permalink, tags, ...restFrontmatter } = obsidianFrontmatter.raw
      frontmatter = { ...frontmatter, ...restFrontmatter }
    }
  }

  if (file.data.includeKatexStyles) {
    if (!frontmatter.head) {
      frontmatter.head = []
    }

    frontmatter.head.push({
      tag: 'link',
      attrs: {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      },
    })
  }

  const ogImage = obsidianFrontmatter?.cover ?? obsidianFrontmatter?.image

  if (ogImage && isAbsoluteUrl(ogImage)) {
    if (!frontmatter.head) {
      frontmatter.head = []
    }

    if (!frontmatter.head.some((tag) => tag.attrs['property'] === 'og:image')) {
      frontmatter.head.push({ tag: 'meta', attrs: { property: 'og:image', content: ogImage } })
    }

    if (!frontmatter.head.some((tag) => tag.attrs['property'] === 'twitter:image')) {
      frontmatter.head.push({ tag: 'meta', attrs: { name: 'twitter:image', content: ogImage } })
    }
  }

  if (obsidianFrontmatter?.description && obsidianFrontmatter.description.length > 0) {
    frontmatter.description = obsidianFrontmatter.description
  }

  if (obsidianFrontmatter?.permalink && obsidianFrontmatter.permalink.length > 0) {
    frontmatter.slug = obsidianFrontmatter.permalink
  }

  if (obsidianFrontmatter?.tags && obsidianFrontmatter.tags.length > 0) {
    frontmatter.tags = obsidianFrontmatter.tags
  }

  const { title, ...frontmatterWithoutTitle } = frontmatter

  // The title should always be a string (even if it looks like a date).
  return (yaml.stringify({ title }, { version: '1.1' }) + yaml.stringify(frontmatterWithoutTitle)).trim()
}

function getFileUrl(output: StarlightObsidianConfig['output'], filePath: string, anchor?: string) {
  return `${path.posix.join(path.posix.sep, output, slugifyObsidianPath(filePath))}${slugifyObsidianAnchor(anchor ?? '')}`
}

function getRelativeFilePath(file: VFile, relativePath: string) {
  ensureTransformContext(file)

  return path.posix.join(getObsidianRelativePath(file.data.vault, file.dirname), relativePath)
}

function getAssetPath(file: VFile, relativePath: string) {
  ensureTransformContext(file)

  return path.posix.join('../../..', path.posix.relative(file.dirname, file.data.vault.path), 'assets', relativePath)
}

function getFilePathFromVaultFile(vaultFile: VaultFile, url: string) {
  return vaultFile.uniqueFileName ? vaultFile.slug : slugifyObsidianPath(url)
}

function isMarkdownFile(filePath: string, file: VFile) {
  return (
    (file.data.vault?.options.linkSyntax === 'markdown' && filePath.endsWith('.md')) ||
    getExtension(filePath).length === 0
  )
}

function handleExternalEmbeds(node: Image, context: VisitorContext) {
  const twitterId = twitterMatcher(node.url)
  const youtubeId = youtubeMatcher(node.url)

  if (!twitterId && !youtubeId) {
    return false
  }

  const type = twitterId ? 'twitter' : 'youtube'
  const id = twitterId ?? youtubeId
  const component = type === 'twitter' ? 'Twitter' : 'Youtube'

  if (type === 'twitter') {
    context.file.data.includeTwitterComponent = true
  } else {
    context.file.data.includeYoutubeComponent = true
  }

  replaceNode(context, createMdxNode(`<${component} id="${id}" />`))

  return true
}

function handleImagesWithSize(node: Image, context: VisitorContext, type: 'asset' | 'external') {
  if (!node.alt) {
    return
  }

  const match = node.alt.match(imageSizeRegex)
  const { altText, width, widthOnly, height } = match?.groups ?? {}

  if (widthOnly === undefined && width === undefined) {
    return
  }

  const imgAltText = altText ?? ''
  const imgWidth = widthOnly ?? width
  const imgHeight = height ?? 'auto'
  // Workaround Starlight `auto` height default style.
  const imgStyle = height === undefined ? '' : ` style="height: ${height}px !important;"`

  if (type === 'external') {
    replaceNode(context, {
      type: 'html',
      value: `<img src="${node.url}" alt="${imgAltText}" width="${imgWidth}" height="${imgHeight}"${imgStyle} />`,
    })
  } else {
    const importId = generateAssetImportId()

    if (!context.file.data.assetImports) {
      context.file.data.assetImports = []
    }

    context.file.data.assetImports.push([importId, node.url])

    replaceNode(
      context,
      createMdxNode(
        `<Image src={${importId}} alt="${imgAltText}" width="${imgWidth}" height="${imgHeight}"${imgStyle} />`,
      ),
    )
  }
}

// Custom file nodes are replaced by a custom HTML node, e.g. an audio player for audio files, etc.
function isCustomFile(filePath: string) {
  return isObsidianFile(filePath) && !isObsidianFile(filePath, 'image')
}

function getCustomFileNode(filePath: string): RootContent {
  if (isObsidianFile(filePath, 'audio')) {
    return {
      type: 'html',
      value: `<audio class="sl-obs-embed-audio" controls src="${filePath}"></audio>`,
    }
  } else if (isObsidianFile(filePath, 'video')) {
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

async function getMarkdownFileNode(file: VFile, fileUrl: string): Promise<RootContent> {
  ensureTransformContext(file)

  const fileExt = file.data.vault.options.linkSyntax === 'wikilink' ? '.md' : ''
  const filePath = decodeURIComponent(
    file.data.vault.options.linkFormat === 'relative' ? getRelativeFilePath(file, fileUrl) : fileUrl,
  )
  const url = path.posix.join(path.posix.sep, `${filePath}${fileExt}`)
  const matchingFile = file.data.files.find(
    (vaultFile) => vaultFile.path === url || vaultFile.isEqualStem(filePath) || vaultFile.isEqualFileName(filePath),
  )

  if (!matchingFile) {
    return { type: 'text', value: '' }
  }

  const content = fs.readFileSync(matchingFile.fsPath, 'utf8')
  const root = await transformMarkdownToAST(matchingFile.fsPath, content, { ...file.data, embedded: true })

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

function replaceNode({ index, parent }: VisitorContext, replacement: RootContent | RootContent[]) {
  if (!parent || index === undefined) {
    return
  }

  parent.children.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]))
}

// We are using `Html` node instead of real MDX nodes because we are not using `remark-mdx` due to the fact that it
// makes the parsing step way more strict. During our inital testing round, we found out that a few users had pretty
// poorly formatted Markdown files (usually the result of various Obisidian migration tools) and we wanted to make sure
// that they could still use Starlight Obsidian.
function createMdxNode(value: string): Html {
  return { type: 'html', value }
}

function ensureTransformContext(file: VFile): asserts file is VFile & { data: TransformContext; dirname: string } {
  if (!file.dirname || !file.data.files || file.data.output === undefined || !file.data.vault) {
    throw new Error('Invalid transform context.')
  }
}

export interface TransformContext {
  aliases?: string[]
  assetImports?: [id: string, path: string][]
  copyFrontmatter: StarlightObsidianConfig['copyFrontmatter']
  embedded?: boolean
  files: VaultFile[]
  includeKatexStyles?: boolean
  includeTwitterComponent?: boolean
  includeYoutubeComponent?: boolean
  isMdx?: true
  output: StarlightObsidianConfig['output']
  skip?: true
  vault: Vault
}

interface VisitorContext {
  file: VFile
  index: number | undefined
  parent: Parent | undefined
}

interface Frontmatter {
  title: string | undefined
  description?: string
  editUrl: false
  slug?: string
  tags?: string[]
  head?: { tag: string; attrs: Record<string, string> }[]
}

declare module 'vfile' {
  interface DataMap extends TransformContext {}
}

declare module 'unist' {
  interface Data {
    isAssetResolved?: boolean
  }
}
