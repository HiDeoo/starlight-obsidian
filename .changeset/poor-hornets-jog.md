---
'starlight-obsidian': minor
---

Removes the `autoLinkHeadings` option.

⚠️ **BREAKING CHANGE:** The `autoLinkHeadings` option has been removed and this feature is now built-in to Starlight and configurable using the Starlight [`markdown.headingLinks` configuration option](https://starlight.astro.build/reference/configuration/#headinglinks) which is enabled by default.

To conserve the previous default behavior of the plugin, set `markdown.headingLinks` to `false` in your Starlight configuration.

```js
// astro.config.mjs
starlight({
  markdown: {
    // Disable Starlight’s clickable heading anchor links.
    headingLinks: false,
  },
}),
```
