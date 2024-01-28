import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import { VFile } from 'vfile'

import { remarkStarlightObsidian, type TransformContext } from './remark'

const processor = remark()
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkFrontmatter)
  .use(remarkStarlightObsidian)

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
  }
}

export function transformMarkdownToAST(filePath: string, markdown: string, context: TransformContext) {
  return processor.parse(getVFile(filePath, markdown, context))
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
}
