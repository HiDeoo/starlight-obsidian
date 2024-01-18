import path from 'node:path'

import { slug } from 'github-slugger'

export function slugifyPath(value: string) {
  const segments = value.split('/')

  return segments
    .map((segment, index) =>
      slug(decodeURIComponent(index === segments.length - 1 ? path.parse(segment).name : segment)),
    )
    .join('/')
}
