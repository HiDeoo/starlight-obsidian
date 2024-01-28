---
title: Project Structure
description: Learn how the Starlight Obsidian plugin organizes your Obsidian vault pages.
---

This guide explains how the Starlight Obsidian plugin organizes your Obsidian vault pages.

The Starlight Obsidian plugin follows the same conventions used in Starlight projects regarding the file and directory structure.
See the [Starlight's project structure documentation](https://starlight.astro.build/guides/project-structure/) for more detail.

## Directories

- `src/content/docs/notes/` — Obsidian vault pages are generated in this directory by the Starlight Obsidian plugin which converts each vault file to an MDX file which will be turned into a page by Starlight and Astro.
- `src/assets/notes/` — Obsidian vault images are copied to this directory by the Starlight Obsidian plugin and will be automatically [optimized](https://docs.astro.build/en/guides/images/) by Astro when rendered in a page.
- `public/notes/` — [Assets](https://help.obsidian.md/Files+and+folders/Accepted+file+formats) (audio, video, and PDF files) are copied to this directory by the Starlight Obsidian plugin and will not be processed by Astro.

As every vault content is scoped to a specific directory (e.g. `notes/` in the above example), you can continue to use Starlight as you would normally do and [create](https://starlight.astro.build/getting-started/#add-pages) additional pages that would not make sense to manage in Obsidian.

:::note

The `notes` directory name used in the above examples can be modified using the [`output` configuration option](/configuration/#output).

:::
