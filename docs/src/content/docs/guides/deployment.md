---
title: Deployment
description: Learn how to deploy your Obsidian vault pages with the Starlight Obsidian plugin.
---

When building your documentation, the Starlight Obsidian plugin will generate pages from your Obsidian vault.

## Deploying your vault pages

When deploying your Starlight project, the target platform may not have access to the Obsidian vault or it would be impractical to include the vault in the deployment.
In such cases, you can use the [`skipGeneration` configuration option](/configuration/#skipgeneration) to disable the generation of vault pages on specific platforms.

When using this option, you will need to [build](https://docs.astro.build/en/reference/cli-reference/#astro-build) and commit the generated vault pages before deploying your site.

```js {11-12}
// astro.config.mjs
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightObsidian from 'starlight-obsidian'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightObsidian({
          // Disable generating vault pages when deploying on Vercel.
          skipGeneration: !!process.env['VERCEL'],
        }),
      ],
      title: 'My Docs',
    }),
  ],
})
```
