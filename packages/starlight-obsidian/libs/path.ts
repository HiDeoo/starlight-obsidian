import path from 'node:path'

import { slug } from 'github-slugger'

export function getExtension(filePath: string) {
  return path.parse(filePath).ext
}

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

export function slugifyPath(filePath: string) {
  const segments = filePath.split('/')

  return segments
    .map((segment, index) => {
      const isLastSegment = index === segments.length - 1

      if (!isLastSegment) {
        return slug(segment)
      }

      const parsedPath = path.parse(segment)

      return `${slug(parsedPath.name)}${parsedPath.ext}`
    })
    .join('/')
}

// https://github.com/sindresorhus/slash
export function slashify(filePath: string) {
  const isExtendedLengthPath = filePath.startsWith('\\\\?\\')

  if (isExtendedLengthPath) {
    return filePath
  }

  return filePath.replaceAll('\\', '/')
}

export function osPath(filePath: string) {
  return filePath.replaceAll('/', path.sep)
}
