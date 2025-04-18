---
title: Configuration
description: An overview of all the configuration options supported by the Starlight Obsidian plugin.
---

The Starlight Obsidian plugin can be configured inside the `astro.config.mjs` configuration file of your project:

```js {11}
// astro.config.mjs
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightObsidian, { obsidianSidebarGroup } from 'starlight-obsidian'

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightObsidian({
          // Configuration options go here.
        }),
      ],
      title: 'My Docs',
    }),
  ],
})
```

## Configuration options

The Starlight Obsidian plugin accepts the following configuration options:

### `vault` (required)

**Type:** `string`

The absolute or relative path to the Obsidian vault to publish.

### `ignore`

**Type:** `string[]`  
**Default:** `[]`

A list of [glob patterns](https://github.com/mrmlnc/fast-glob#basic-syntax) to ignore when generating the Obsidian vault pages.
This option can be used to ignore [files](https://help.obsidian.md/Files+and+folders/Accepted+file+formats) or folders.

### `output`

**Type:** `string`  
**Default:** `'notes'`

The name of the output directory containing the generated Obsidian vault pages relative to the `src/content/docs/` directory.

### `skipGeneration`

**Type:** `boolean`  
**Default:** `false`

Whether the Starlight Obsidian plugin should skip the generation of the Obsidian vault pages.

This is useful to disable generating the Obsidian vault pages when deploying on platforms that do not have access to the Obsidian vault.
This will require you to [build](https://docs.astro.build/en/reference/cli-reference/#astro-build) and commit vault pages before deploying your site.

Read more about deploying your site in the [“Deployment”](/guides/deployment/) guide.

### `sidebar`

**Type:** [`StarlightObsidianSidebarConfig`](#sidebar-configuration)

The generated vault pages [sidebar group configuration](#sidebar-configuration).

### `configFolder`

**Type:** `string`  
**Default:** `'.obsidian'`

The name of the Obsidian vault [configuration folder](https://help.obsidian.md/Files+and+folders/Configuration+folder) if different from the default one.

### `tableOfContentsOverview`

**Type:** `'default' | 'title'`  
**Default:** `'default'`

By default, Starlight will include an “Overview” heading at the top of each page’s table of contents. If your Obsidian vault pages already include a top-level heading named “Overview”, you can set this option to `'title'` to instead use the page title as the top-level heading in the table of contents.

### `copyFrontmatter`

**Type:** `'none' | 'starlight' | 'all'`  
**Default:** `'none'`

By default (`none`), all unsupported [properties](/guides/features/#properties) are ignored and not exported.
Set this option to `starlight` to copy all known [Starlight frontmatter fields](https://starlight.astro.build/reference/frontmatter/) from an Obsidian note to the associated generated page or to `all` to copy all frontmatter fields.

This option is useful if you want to customize the generated Starlight pages from Obsidian.
Note that the values are not validated and are copied as-is so it's up to you to ensure they are compatible with Starlight.

## Sidebar configuration

The sidebar configuration is an object used to configure the generated vault pages sidebar group.
It accepts the following options:

### `label`

**Type:** `string`  
**Default:** `'Notes'`

The generated vault pages sidebar group label.

### `collapsed`

**Type:** `boolean`  
**Default:** `false`

Whether the generated vault pages root sidebar group should be collapsed by default.

### `collapsedFolders`

**Type:** `boolean`  
**Default:** Default to the value of the [`collapsed`](#collapsed) sidebar option.

Whether the sidebar groups of your vault nested folders should be collapsed by default.
