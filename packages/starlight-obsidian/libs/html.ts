import { rehype } from 'rehype'
import rehypeMermaid from 'rehype-mermaid'

const processor = rehype()
  .data('settings', {
    fragment: true,
    closeSelfClosing: true,
  })
  .use(rehypeMermaid, {
    dark: true,
    strategy: 'img-svg',
  })

export async function transformHtmlToString(html: string) {
  const file = await processor.process(html)

  return String(file)
}
