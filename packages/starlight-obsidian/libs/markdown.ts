import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { VFile } from 'vfile'

import {
  remarkEnsureFrontmatter,
  remarkMarkdownImages,
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
  .use(remarkMarkdownImages)

export async function transformMarkdown(filePath: string, markdown: string, context: TransformContext) {
  const file = new VFile({
    data: { ...context },
    path: filePath,
    value: markdown,
  })

  const compiled = await processor.process(file)

  return String(compiled)
}
