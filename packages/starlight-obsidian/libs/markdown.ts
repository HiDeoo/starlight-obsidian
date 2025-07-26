import { fromMarkdown } from 'mdast-util-from-markdown'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { VFile } from 'vfile'

import { remarkStarlightObsidian, type TransformContext } from './remark'

let processor: ReturnType<typeof remark> | undefined

export async function transformMarkdownToString(
  filePath: string,
  markdown: string,
  context: TransformContext,
): Promise<TransformResult> {
  const file = await getProcessor(context).process(getVFile(filePath, markdown, context))

  return {
    aliases: file.data.aliases,
    content: String(file),
    skip: file.data.skip === true,
    type: file.data.isMdx === true ? 'mdx' : 'markdown',
  }
}

export async function transformMarkdownToAST(filePath: string, markdown: string, context: TransformContext) {
  const { content } = await transformMarkdownToString(filePath, markdown, context)

  return fromMarkdown(content)
}

function getProcessor(context: TransformContext): ReturnType<typeof remark> {
  processor ??= remark()
    .data('settings', { resourceLink: true })
    .use(remarkGfm)
    .use(remarkMath, { singleDollarTextMath: context.singleDollarTextMath })
    .use(remarkFrontmatter)
    .use(remarkStarlightObsidian)

  return processor
}

function getVFile(filePath: string, markdown: string, context: TransformContext) {
  return new VFile({
    data: { ...context },
    path: filePath,
    value: markdown,
  })
}

interface TransformResult {
  aliases: string[] | undefined
  content: string
  skip: boolean
  type: 'markdown' | 'mdx'
}
