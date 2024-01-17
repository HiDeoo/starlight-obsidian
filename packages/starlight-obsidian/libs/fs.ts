import fs from 'node:fs/promises'

export async function isDirectory(path: string) {
  try {
    const stats = await fs.stat(path)

    return stats.isDirectory()
  } catch {
    return false
  }
}

export async function isFile(path: string) {
  try {
    const stats = await fs.stat(path)

    return stats.isFile()
  } catch {
    return false
  }
}
