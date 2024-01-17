import fs from 'node:fs/promises'
import path from 'node:path'

import type { StarlightObsidianConfig } from '..'

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
