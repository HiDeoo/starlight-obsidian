import { docsSchema, i18nSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro:content'
import { starlightObsidianSchema } from 'starlight-obsidian/schema'

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: starlightObsidianSchema(),
    }),
  }),
  i18n: defineCollection({ type: 'data', schema: i18nSchema() }),
}
