import { fromMarkdown } from 'mdast-util-from-markdown'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { VFile } from 'vfile'

import { remarkStarlightObsidian, type TransformContext } from './remark'

const processor = remark().use(remarkGfm).use(remarkMath).use(remarkFrontmatter).use(remarkStarlightObsidian)

export async function transformMarkdownToString(
  filePath: string,
  markdown: string,
  context: TransformContext,
): Promise<TransformResult> {
  const file = await processor.process(getVFile(filePath, markdown, context))

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
