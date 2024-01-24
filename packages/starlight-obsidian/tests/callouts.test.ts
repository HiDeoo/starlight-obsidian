import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('transforms callouts', async () => {
  const md = await transformFixtureMdFile('basics', 'Callouts.md')

  expect(md).toMatchInlineSnapshot(`
    "This is a sentence.

    :::note
    Here's a callout block.
    It supports **Markdown**, [Wikilinks](/notes/math), and embeds!
    ![An image.png](</notes/An image.png>)
    :::

    :::tip[Callouts can have custom titles]
    Like this one.
    :::

    :::tip[Title-only callout] 
    :::

    :::caution[Are callouts foldable?]
    Not in Starlight
    :::

    :::caution[Can callouts be nested?]


    :::note[Yes!, they can.]


    :::tip[You can even use multiple layers of nesting.] 
    :::

    :::

    :::
    "
  `)
})

test('supports all callout types', async () => {
  const md = await transformFixtureMdFile('basics', 'Callouts types.md')

  expect(md).toMatchInlineSnapshot(`
    ":::note
    Note callout
    :::

    :::note
    Unsupported callout
    :::

    :::tip
    Abstract callout
    :::

    :::tip
    Summary callout
    :::

    :::tip
    TLDR callout
    :::

    :::note
    Info callout
    :::

    :::note
    Todo callout
    :::

    :::tip
    Tip callout
    :::

    :::tip
    Hint callout
    :::

    :::tip
    Important callout
    :::

    :::note
    Success callout
    :::

    :::note
    Check callout
    :::

    :::note
    Done callout
    :::

    :::caution
    Question callout
    :::

    :::caution
    Help callout
    :::

    :::caution
    FAQ callout
    :::

    :::caution
    Warning callout
    :::

    :::caution
    Caution callout
    :::

    :::caution
    Attention callout
    :::

    :::danger
    Failure callout
    :::

    :::danger
    Fail callout
    :::

    :::danger
    Missing callout
    :::

    :::danger
    Danger callout
    :::

    :::danger
    Error callout
    :::

    :::danger
    Bug callout
    :::

    :::tip
    Example callout
    :::

    :::note
    Quote callout
    :::

    :::note
    Cite callout
    :::
    "
  `)
})
