import path from 'node:path'

import { expect, test } from 'vitest'

import { getVault } from '../libs/obsidian'

test('returns a vault with an absolute path', async () => {
  const vault = await getVault({ vault: '../../fixtures/basics' })

  expect(path.isAbsolute(vault.path)).toBe(true)
  expect(vault.path).toMatch(/fixtures\/basics$/)
})

test('throws if the specified vault path is not a directory', async () => {
  await expect(getVault({ vault: '../../fixtures/unknown' })).rejects.toThrowErrorMatchingInlineSnapshot(
    `[AstroUserError: The provided vault path is not a directory.]`,
  )
})

test('throws if the specified vault path is not a valid vault directory', async () => {
  await expect(getVault({ vault: '../../fixtures/not-a-vault' })).rejects.toThrowErrorMatchingInlineSnapshot(
    `[AstroUserError: The provided vault path is not a valid Obsidian vault directory.]`,
  )
})
