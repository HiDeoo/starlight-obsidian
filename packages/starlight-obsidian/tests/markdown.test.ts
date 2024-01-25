import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

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

    | First column                        | Second column                          |
    | ----------------------------------- | -------------------------------------- |
    | [Link to file](/notes/basic-syntax) | ![An image.png](</notes/An image.png>) |

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
    "
  `)
})

test('does not include katex styles if not needed', async () => {
  const result = await transformFixtureMdFile('basics', 'Random.md', { includeFrontmatter: true })

  expect(result.content).not.toMatch(/katex/)
})
