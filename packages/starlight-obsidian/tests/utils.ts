import fs from 'node:fs/promises'
import path from 'node:path'

import { slug } from 'github-slugger'

import type { StarlightObsidianConfig } from '..'
import { transformMarkdown, type TransformContext } from '../libs/markdown'
import { stripExtension } from '../libs/path'

const fixturesPath = '../../fixtures'

export function getFixtureConfig(
  fixtureName: string,
  config: Partial<StarlightObsidianConfig> = {},
): StarlightObsidianConfig {
  return {
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
): ReturnType<typeof transformMarkdown> {
  const md = await getFixtureFile(fixtureName, filePath)
  const fileName = path.basename(filePath)
  const transformedMd = await transformMarkdown(filePath, md, {
    files: options.context?.files ?? [
      {
        fileName,
        path: filePath,
        slug: slug(stripExtension(filePath)),
        stem: stripExtension(fileName),
        uniqueFileName: true,
      },
    ],
    output: options.context?.output ?? 'notes',
    vault: options.context?.vault ?? { options: { linkFormat: 'shortest', linkSyntax: 'wikilink' }, path: '' },
  })

  if (options.includeFrontmatter) {
    return transformedMd
  }

  return transformedMd.replace(/^---\n.*\n---\n\n/, '')
}
