import path from 'node:path'

export function stripExtension(filePath: string) {
  return path.parse(filePath).name
}

export function extractPathAndAnchor(filePathAndAnchor: string): [string, string | undefined] {
  const [filePath, fileAnchor] = filePathAndAnchor.split('#', 2)

  return [filePath as string, fileAnchor]
}

export function isAnchor(filePath: string): filePath is `#${string}` {
  return filePath.startsWith('#')
}
