import { expect, test, vi } from 'vitest'

import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig, transformFixtureMdFile } from './utils'

test('highlights text', async () => {
  const result = await transformFixtureMdFile('basics', 'Basic syntax (highlights).md')

  expect(result.content).toMatchInlineSnapshot(`
    "<mark class="sl-obs-highlight">Highlighted text 1</mark>

    <mark class="sl-obs-highlight">Highlighted text 2</mark>

    <mark class="sl-obs-highlight">Highlighted = text 3</mark>

    <mark class="sl-obs-highlight">Highlighted</mark> text 4 and <mark class="sl-obs-highlight">Highlighted text 5</mark>

    \`==Highlighted text in code==\`
    "
  `)
})

test('strips out comments', async () => {
  const result = await transformFixtureMdFile('basics', 'Basic syntax (comments).md')

  expect(result.content).toMatchInlineSnapshot(`
    "This is an  comment.

    This is an  comment and another  comment.

    "
  `)
})

test('sets the proper title', async () => {
  let result = await transformFixtureMdFile('basics', 'Random.md', { includeFrontmatter: true })

  expect(result.content).toMatch(/^title: Random$/m)

  result = await transformFixtureMdFile('basics', 'Basic syntax (comments).md', { includeFrontmatter: true })

  expect(result.content).toMatch(/^title: Basic syntax \(comments\)$/m)

  result = await transformFixtureMdFile('basics', '2024-08-19.md', { includeFrontmatter: true })

  expect(result.content).toMatch(/^title: "2024-08-19"$/m)
})

test('disables edit links', async () => {
  const result = await transformFixtureMdFile('basics', 'Random.md', { includeFrontmatter: true })

  expect(result.content).toMatch(/^editUrl: false$/m)
})

test('renders tables', async () => {
  const result = await transformFixtureMdFile('basics', 'Tables.md')

  expect(result.content).toMatchInlineSnapshot(`
    "| First name | Last name |
    | ---------- | --------- |
    | Max        | Planck    |
    | Marie      | Curie     |

    | First name | Last name |
    | ---------- | --------- |
    | Max        | Planck    |
    | Marie      | Curie     |

    | First column                        | Second column                                       |
    | ----------------------------------- | --------------------------------------------------- |
    | [Link to file](/notes/basic-syntax) | ![An image.png](../../../assets/notes/an-image.png) |

    | Left-aligned text | Center-aligned text | Right-aligned text |
    | :---------------- | :-----------------: | -----------------: |
    | Content           |       Content       |            Content |
    "
  `)
})

test('renders math and includes katex styles', async () => {
  const result = await transformFixtureMdFile('basics', 'Math.md', { includeFrontmatter: true })

  expect(result.content).toMatchInlineSnapshot(`
    "---
    title: Math
    editUrl: false
    head:
      - tag: link
        attrs:
          rel: stylesheet
          href: https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css
    ---

    Test

    $$
    \\begin{vmatrix}a & b\\\\
    c & d
    \\end{vmatrix}=ad-bc
    $$

    This is an inline math expression $e^{2i\\pi} = 1$.

    This is a sentence with some dollar signs, e.g. from $5 to maybe $10.
    "
  `)
})

test('renders math without single dollar text math support', async () => {
  const vault = await getVault(getFixtureConfig('basics'))
  const paths = await getObsidianPaths(vault)
  const files = getObsidianVaultFiles(vault, paths)

  // Reset the modules registry so that re-importing `./utils` re-evaluates the module and reset
  // any cached processor. Re-importing the module is necessary because top-level imports
  // cannot be re-evaluated.
  vi.resetModules()
  // Re-import the module to re-evaluate it.
  const { transformFixtureMdFile } = await import('./utils')

  const result = await transformFixtureMdFile('basics', 'Math (no-single-dollar).md', {
    includeFrontmatter: false,
    context: { copyFrontmatter: 'none', files, output: 'notes', singleDollarTextMath: false, vault },
  })

  expect(result.content).toMatchInlineSnapshot(`
    "Test

    $$
    \\begin{vmatrix}a & b\\\\
    c & d
    \\end{vmatrix}=ad-bc
    $$

    This is an inline math expression $$e^{2i\\pi} = 1$$.

    This is a sentence with some dollar signs, e.g. from $5 to maybe $10.
    "
  `)
})

test('does not include katex styles if not needed', async () => {
  const result = await transformFixtureMdFile('basics', 'Random.md', { includeFrontmatter: true })

  expect(result.content).not.toMatch(/katex/)
})

test('parses and flags files with the `publish` property set to `true`', async () => {
  let result = await transformFixtureMdFile('basics', 'Basic syntax.md')

  expect(result.skip).toBe(false)

  result = await transformFixtureMdFile('basics', 'Private file.md')

  expect(result.skip).toBe(true)
})
