# starlight-obsidian

## 0.11.0

### Minor Changes

- [#67](https://github.com/HiDeoo/starlight-obsidian/pull/67) [`2969770`](https://github.com/HiDeoo/starlight-obsidian/commit/296977054e79da21b3b081f245b9e4ed69d26066) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Improves error message when the `output` directory configuration option is invalid.

- [#69](https://github.com/HiDeoo/starlight-obsidian/pull/69) [`619d371`](https://github.com/HiDeoo/starlight-obsidian/commit/619d371f1a14d48cf68702f28245ac42deee4a39) Thanks [@AsterisMono](https://github.com/AsterisMono)! - Adds support for translating the generated vault pages sidebar group label.

## 0.10.1

### Patch Changes

- [#63](https://github.com/HiDeoo/starlight-obsidian/pull/63) [`3e638d4`](https://github.com/HiDeoo/starlight-obsidian/commit/3e638d43b191da7685d59d3bc7d86ec3de4a922f) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Setups trusted publishing using OpenID Connect (OIDC) authentication — no code changes.

## 0.10.0

### Minor Changes

- [#61](https://github.com/HiDeoo/starlight-obsidian/pull/61) [`c4150ef`](https://github.com/HiDeoo/starlight-obsidian/commit/c4150ef713e327f218c5ee0023ba3831e51cfccd) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds a new configuration option `math.singleDollarTextMath` to control whether or not inline math expressions using single dollar signs should be supported or not.

  This option can be useful to disable support for single dollar inline math expressions which can conflict with “normal” dollars in CommonMark.

## 0.9.1

### Patch Changes

- [#56](https://github.com/HiDeoo/starlight-obsidian/pull/56) [`ff18bbd`](https://github.com/HiDeoo/starlight-obsidian/commit/ff18bbd6b2614e5e817fdca2005825ea1841e0a0) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes a potential syntax issue when converting Obsidian vault files containing void elements to MDX format.

## 0.9.0

### Minor Changes

- [#53](https://github.com/HiDeoo/starlight-obsidian/pull/53) [`be89246`](https://github.com/HiDeoo/starlight-obsidian/commit/be8924661655c041a7339d040c4518e74e39defb) Thanks [@HiDeoo](https://github.com/HiDeoo)! - ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now version `0.34.0`.

  Please use the `@astrojs/upgrade` command to upgrade your project:

  ```sh
  npx @astrojs/upgrade
  ```

- [#53](https://github.com/HiDeoo/starlight-obsidian/pull/53) [`be89246`](https://github.com/HiDeoo/starlight-obsidian/commit/be8924661655c041a7339d040c4518e74e39defb) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Removes the `autoLinkHeadings` option.

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

## 0.8.2

### Patch Changes

- [#51](https://github.com/HiDeoo/starlight-obsidian/pull/51) [`b067e02`](https://github.com/HiDeoo/starlight-obsidian/commit/b067e026613abe8aaed9b3de673a5ae93e70525e) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue with embedded note sections not being rendered correctly.

## 0.8.1

### Patch Changes

- [#47](https://github.com/HiDeoo/starlight-obsidian/pull/47) [`290b2ee`](https://github.com/HiDeoo/starlight-obsidian/commit/290b2ee81556be17dbd5ba01854696b6e6c540a2) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes a potential issue with autolinks in MDX by enforcing the use of resource links.

## 0.8.0

### Minor Changes

- [#45](https://github.com/HiDeoo/starlight-obsidian/pull/45) [`8d1b58c`](https://github.com/HiDeoo/starlight-obsidian/commit/8d1b58cc761ccf380f1dfad25f9b784a7ae4f6bf) Thanks [@HiDeoo](https://github.com/HiDeoo)! - ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now version `0.32.0`.

  Please use the `@astrojs/upgrade` command to upgrade your project:

  ```sh
  npx @astrojs/upgrade
  ```

- [#45](https://github.com/HiDeoo/starlight-obsidian/pull/45) [`8d1b58c`](https://github.com/HiDeoo/starlight-obsidian/commit/8d1b58cc761ccf380f1dfad25f9b784a7ae4f6bf) Thanks [@HiDeoo](https://github.com/HiDeoo)! - ⚠️ **BREAKING CHANGE:** The Starlight Obsidian plugin no longer [overrides](https://starlight.astro.build/guides/overriding-components/) the [`<PageSidebar>` component](https://starlight.astro.build/reference/overrides/#pagesidebar). If you were manually rendering `starlight-obsidian/overrides/PageSidebar.astro` in a custom override, you can now remove it.

## 0.7.1

### Patch Changes

- [#41](https://github.com/HiDeoo/starlight-obsidian/pull/41) [`ab86671`](https://github.com/HiDeoo/starlight-obsidian/commit/ab8667139930cad8322ed494a760547e896e7a27) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Fixes an issue with custom aside titles including links.

## 0.7.0

### Minor Changes

- [#37](https://github.com/HiDeoo/starlight-obsidian/pull/37) [`96f7cef`](https://github.com/HiDeoo/starlight-obsidian/commit/96f7cef43c4a08923c24221fbfb95b4ef840779f) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for running [multiple instances](https://starlight-obsidian.vercel.app/guides/multiple-instances/) of the plugin for different Obsidian vaults and configurations.

## 0.6.0

### Minor Changes

- [#34](https://github.com/HiDeoo/starlight-obsidian/pull/34) [`9079b9b`](https://github.com/HiDeoo/starlight-obsidian/commit/9079b9be67eb2efd68a3d8906068263657629974) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for Astro v5, drops support for Astro v4.

  ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now `0.30.0`.

  Please follow the [upgrade guide](https://github.com/withastro/starlight/releases/tag/%40astrojs/starlight%400.30.0) to update your project.
