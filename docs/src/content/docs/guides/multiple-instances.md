---
title: Multiple Instances
description: Learn how to use multiple instances of the Starlight Obsidian plugin.
---

By default, the Starlight Obsidian plugin generates pages for one [vault](/configuration#vault-required) based on the provided [plugin configuration](http://localhost:4321/configuration#configuration-options).

If you want to generate pages for multiple vaults, the Starlight Obsidian plugin exposes a `createStarlightObsidianPlugin()` function that allows you to create multiple instances of the plugin.

## `createStarlightObsidianPlugin()`

Calling the `createStarlightObsidianPlugin()` function returns an array with exactly two values:

1. A new Starlight Obsidian plugin instance that you can add to your Starlight configuration.
1. A reference to the generated sidebar group for that instance that you can add to your sidebar.

The following example creates two Starlight Obsidian plugin instances for two different vaults: one for a vault about _astronomy_ and another for a vault about _biology_.
The associated sidebar groups are then added to the sidebar:

```js {6-7}
// astro.config.mjs
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { createStarlightObsidianPlugin } from 'starlight-obsidian'

const [astronomyStarlightObsidian, astronomyObsidianSidebarGroup] = createStarlightObsidianPlugin()
const [biologyStarlightObsidian, biologyObsidianSidebarGroup] = createStarlightObsidianPlugin()

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        // Generate the astronomy Obsidian vault pages.
        astronomyStarlightObsidian({
          vault: '../path/to/astronomy/obsidian/vault',
          // Output the generated pages to the 'src/content/docs/notes-astronomy' directory.
          output: 'notes-astronomy',
          // Label the astronomy sidebar group.
          sidebar: { label: 'Astronomy' },
        }),
        // Generate the biology Obsidian vault pages.
        biologyStarlightObsidian({
          vault: '../path/to/biology/obsidian/vault',
          // Output the generated pages to the 'src/content/docs/notes-biology' directory.
          output: 'notes-biology',
          // Label the biology sidebar group.
          sidebar: { label: 'Biology' },
        }),
      ],
      sidebar: [
        {
          label: 'Guides',
          items: ['guides/example'],
        },
        // Add the astronomy sidebar group to the sidebar.
        astronomyObsidianSidebarGroup,
        // Add the biology sidebar group to the sidebar.
        biologyObsidianSidebarGroup,
      ],
      title: 'My Docs',
    }),
  ],
})
```
