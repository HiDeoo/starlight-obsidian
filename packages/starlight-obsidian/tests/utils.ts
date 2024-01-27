import fs from 'node:fs/promises'
import path from 'node:path'

import { slug } from 'github-slugger'

import type { StarlightObsidianConfig } from '..'
import { transformMarkdownToString } from '../libs/markdown'
import { stripExtension } from '../libs/path'
import type { TransformContext } from '../libs/remark'

export const linkSyntaxAndFormats = [
  ['markdown', 'absolute'],
  ['markdown', 'relative'],
  ['markdown', 'shortest'],
  ['wikilink', 'absolute'],
  ['wikilink', 'relative'],
  ['wikilink', 'shortest'],
]

const fixturesPath = '../../fixtures'

export function getFixtureConfig(
  fixtureName: string,
  config: Partial<StarlightObsidianConfig> = {},
): StarlightObsidianConfig {
  return {
    configFolder: '.obsidian',
    output: 'notes',
    vault: getFixturePath(fixtureName),
    ...config,
  }
}

export function getFixtureFile(fixtureName: string, filePath: string) {
  const fixtureFilePath = path.join(getFixturePath(fixtureName), filePath)

  return fs.readFile(fixtureFilePath, 'utf8')
}

function getFixturePath(fixtureName: string) {
  return path.join(fixturesPath, fixtureName)
}

export async function transformFixtureMdFile(
  fixtureName: string,
  filePath: string,
  options: { context?: TransformContext; includeFrontmatter?: boolean } = {},
): ReturnType<typeof transformMarkdownToString> {
  const fixtureFilePath = path.resolve(path.join(getFixturePath(fixtureName), filePath))
  const md = await getFixtureFile(fixtureName, filePath)
  const fileName = path.basename(filePath)
  const result = await transformMarkdownToString(fixtureFilePath, md, {
    files: options.context?.files ?? [
      {
        fileName,
        fsPath: filePath,
        path: filePath,
        slug: slug(stripExtension(filePath)),
        stem: stripExtension(fileName),
        type: 'content',
        uniqueFileName: true,
      },
    ],
    output: options.context?.output ?? 'notes',
    vault: options.context?.vault ?? { options: { linkFormat: 'shortest', linkSyntax: 'wikilink' }, path: '' },
  })

  if (!options.includeFrontmatter) {
    result.content = result.content.replace(/^---\n.*\n+---\n\n/, '')
  }

  return result
}
