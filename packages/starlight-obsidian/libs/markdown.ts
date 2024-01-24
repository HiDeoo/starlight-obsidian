import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { VFile } from 'vfile'

import {
  remarkEnsureFrontmatter,
  remarkMarkdownAssets,
  remarkMarkdownLinks,
  remarkKatexStyles,
  remarkMermaid,
  remarkReplacements,
  type TransformContext,
  remarkCallouts,
} from './remark'

const processor = remark()
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkKatexStyles)
  .use(remarkFrontmatter)
  .use(remarkEnsureFrontmatter)
  .use(remarkReplacements)
  .use(remarkMarkdownLinks)
  .use(remarkMarkdownAssets)
  .use(remarkCallouts)
  .use(remarkMermaid)

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
