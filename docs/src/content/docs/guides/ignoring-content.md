---
title: Ignoring Content
description: Learn how to ignore content from being published by the Starlight Obsidian plugin.
---

By default, all content in your Obsidian vault is published by the Starlight Obsidian plugin.
You can ignore content from being published by using one of the following methods.

## `publish` property

The Starlight Obsidian plugin respects the [`publish` Obsidian property](https://help.obsidian.md/Obsidian+Publish/Publish+and+unpublish+notes#Ignore%20notes).
By adding and setting the `publish` property to `false` in Obsidian, the associated vault file will be ignored by the Starlight Obsidian plugin.

## `ignore` configuration option

The Starlight Obsidian plugin [`ignore` configuration option](/configuration/#ignore) can be used to ignore content from being published.
This option accepts a list of [glob patterns](https://github.com/mrmlnc/fast-glob#basic-syntax) to ignore when generating the Obsidian vault pages.

The example below shows various ways to ignore content using the `ignore` configuration option.

```js
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightObsidian({
          vault: '../path/to/obsidian/vault',
          ignore: [
            // Ignore all files and folders in the `private` folder.
            'private/**/*',
            // Ignore all files containing `secret` in their name.
            '**/*secret*',
          ],
        }),
      ],
    }),
  ],
})
```

:::tip

You can use this [webpage](https://www.digitalocean.com/community/tools/glob) to generate and test glob patterns.

:::
