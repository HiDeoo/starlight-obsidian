import { rehype } from 'rehype'
import rehypeMermaid from 'rehype-mermaid'

const processor = rehype().use(rehypeMermaid, {
  dark: true,
  strategy: 'img-svg',
})

export async function transformHtmlToString(html: string) {
  const compiled = await processor.process(html)

  return String(compiled)
}
