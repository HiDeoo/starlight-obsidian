import { z } from 'astro/zod'

export const starlightObsidianSchema = () =>
  z
    .object({
      tags: z.array(z.string()),
    })
    .partial()
