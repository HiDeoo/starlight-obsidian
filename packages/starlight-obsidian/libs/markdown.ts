import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { VFile } from 'vfile'

import { remarkStarlightObsidian, type TransformContext } from './remark'

const processor = remark().use(remarkGfm).use(remarkMath).use(remarkFrontmatter).use(remarkStarlightObsidian)

export async function transformMarkdownToString(filePath: string, markdown: string, context: TransformContext) {
  const compiled = await processor.process(getVFile(filePath, markdown, context))

  return String(compiled)
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
