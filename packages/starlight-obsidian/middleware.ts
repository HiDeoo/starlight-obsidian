import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import config from 'virtual:starlight-obsidian-config'

export const onRequest = defineRouteMiddleware((context) => {
  const { entry, toc } = context.locals.starlightRoute

  if (config.tableOfContentsOverview === 'title' && toc) {
    const firstTocItem = toc.items.at(0)

    if (firstTocItem) {
      firstTocItem.text = entry['data'].title
    }
  }
})
