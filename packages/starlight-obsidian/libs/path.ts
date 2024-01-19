import path from 'node:path'

export function stripExtension(filePath: string) {
  return path.parse(filePath).name
}
