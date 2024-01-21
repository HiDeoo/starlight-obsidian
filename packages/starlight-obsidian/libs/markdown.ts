import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { VFile } from 'vfile'

import {
  remarkEnsureFrontmatter,
  remarkMarkdownAssets,
  remarkMarkdownLinks,
  remarkReplacements,
  type TransformContext,
} from './remark'

const processor = remark()
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkEnsureFrontmatter)
  .use(remarkReplacements)
  .use(remarkMarkdownLinks)
  .use(remarkMarkdownAssets)

export function transformMarkdownToString(filePath: string, markdown: string, context: TransformContext) {
  const compiled = processor.processSync(getVFile(filePath, markdown, context))

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
