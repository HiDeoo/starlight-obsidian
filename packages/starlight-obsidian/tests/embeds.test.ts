import { expect, test } from 'vitest'

import { getObsidianPaths, getObsidianVaultFiles, getVault } from '../libs/obsidian'

import { getFixtureConfig, linkSyntaxAndFormats, transformFixtureMdFile } from './utils'

const expectedCustomFileMd = `<audio class="sl-obs-embed-audio" controls src="/notes/A sound.mp3"></audio>

<audio class="sl-obs-embed-audio" controls src="/notes/folder/A sound.mp3"></audio>

<audio class="sl-obs-embed-audio" controls src="/notes/folder/nested-folder/A sound.mp3"></audio>

> <strong>duplicate file name</strong>
>
> ## test
>
> root content

> <strong>duplicate file name</strong>
>
> ## test
>
> content in folder

> <strong>duplicate file name</strong>
>
> ## test
>
> content in nested folder
`

function getExpectedAssetMd(depth: number) {
  // src/assets/notes/An image.png
  // src/content/docs/notes/file.md
  //     ^       ^
  const prefix = '../'.repeat(depth + 1 + 2)

  return `![An image](<${prefix}assets/notes/An image.png>)

![An image in folder](<${prefix}assets/notes/folder/An image in folder.png>)

![An image in nested folder](<${prefix}assets/notes/folder/nested-folder/An image in nested folder.png>)`
}

// This only tests image and audio embeds as the URL processing is the same for all embeds.
// The next test covers the node replacement logic.
test.each(linkSyntaxAndFormats)('transforms embed URLs in %s with the %s format', async (syntax, format) => {
  const fixtureName = `links-${syntax}-${format}`

  const vault = await getVault(getFixtureConfig(fixtureName))
  const paths = await getObsidianPaths(vault)
  const files = getObsidianVaultFiles(vault, paths)
  const options = { context: { files, output: 'notes', vault } }

  let result = await transformFixtureMdFile(fixtureName, 'root embeds.md', options)

  expect(result.content).toMatch(expectedCustomFileMd)
  expect(result.content).toMatch(getExpectedAssetMd(0))

  result = await transformFixtureMdFile(fixtureName, 'folder/embeds in folder.md', options)

  expect(result.content).toMatch(expectedCustomFileMd)
  expect(result.content).toMatch(getExpectedAssetMd(1))

  result = await transformFixtureMdFile(fixtureName, 'folder/nested folder/embeds in nested folder.md', options)

  expect(result.content).toMatch(expectedCustomFileMd)
  expect(result.content).toMatch(getExpectedAssetMd(2))
})

test('transforms supported embeds', async () => {
  const result = await transformFixtureMdFile('basics', 'Embeds.md')

  expect(result.content).toMatchInlineSnapshot(`
    "![An image.png](<../../../../../packages/starlight-obsidian/assets/notes/An image.png>)

    <audio class="sl-obs-embed-audio" controls src="/notes/A sound.mp3"></audio>

    <video class="sl-obs-embed-video" controls src="/notes/A Video.webm"></video>

    <iframe class="sl-obs-embed-pdf" src="/notes/A PDF.pdf"></iframe>

    <iframe src="https://example.org/" />
    "
  `)
})

test('transforms Youtube videos and tweets', async () => {
  const result = await transformFixtureMdFile('basics', 'Youtube video and tweet.md')

  expect(result.content).toMatchInlineSnapshot(`
    "import Twitter from 'starlight-obsidian/components/Twitter.astro'

    import Youtube from 'starlight-obsidian/components/Youtube.astro'

    This is the first sentence.

    <Youtube id="sYe8fW05-_4" />

    <Twitter id="https://twitter.com/astrodotbuild/status/1665720351261614082" />
    "
  `)
})
