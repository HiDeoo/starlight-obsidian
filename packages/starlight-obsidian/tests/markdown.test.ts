import { expect, test } from 'vitest'

import { transformFixtureMdFile } from './utils'

test('highlights text', async () => {
  const md = await transformFixtureMdFile('basics', 'Basic syntax (highlights).md')

  expect(md).toMatchInlineSnapshot(`
    "<mark class="sl-obs-highlight">Highlighted text 1</mark>

    <mark class="sl-obs-highlight">Highlighted text 2</mark>

    <mark class="sl-obs-highlight">Highlighted = text 3</mark>

    <mark class="sl-obs-highlight">Highlighted</mark> text 4 and <mark class="sl-obs-highlight">Highlighted text 5</mark>

    \`==Highlighted text in code==\`
    "
  `)
})

test('strips out comments', async () => {
  const md = await transformFixtureMdFile('basics', 'Basic syntax (comments).md')

  expect(md).toMatchInlineSnapshot(`
    "This is an  comment.

    This is an  comment and another  comment.

    "
  `)
})

test('sets the proper title', async () => {
  let md = await transformFixtureMdFile('basics', 'Random.md', { includeFrontmatter: true })

  expect(md).toMatch(/^title: Random$/m)

  md = await transformFixtureMdFile('basics', 'Basic syntax (comments).md', { includeFrontmatter: true })

  expect(md).toMatch(/^title: Basic syntax \(comments\)$/m)
})

test('renders tables', async () => {
  const md = await transformFixtureMdFile('basics', 'Tables.md')

  expect(md).toMatchInlineSnapshot(`
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

test('renders math', async () => {
  const md = await transformFixtureMdFile('basics', 'Math.md')

  expect(md).toMatchInlineSnapshot(`
    "Test

    $$
    \\begin{vmatrix}a & b\\\\
    c & d
    \\end{vmatrix}=ad-bc
    $$

    This is an inline math expression $e^{2i\\pi} = 1$.
    "
  `)
})
