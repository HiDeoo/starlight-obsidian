import { katex as satteriKatex } from '@nullpinter/satteri-katex'
import type { AstroConfig } from 'astro'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import type { StarlightObsidianConfig } from '..'

import { throwPluginError } from './error'
import { rehypeStarlightObsidian } from './rehype'
import { satteriStarlightObsidian } from './satteri'

export function applyMarkdownPlugin(processor: MarkdownProcessor, config: StarlightObsidianConfig) {
  if (isSatteriProcessor(processor)) {
    processor.options.features ??= {}
    processor.options.features.math = {
      ...(typeof processor.options.features.math === 'object' ? processor.options.features.math : {}),
      singleDollarTextMath: config.math.singleDollarTextMath,
    }

    processor.options.mdastPlugins.push(satteriKatex())
    processor.options.hastPlugins.push(satteriStarlightObsidian)
  } else if (isUnifiedProcessor(processor)) {
    processor.options.remarkPlugins.push([remarkMath, { singleDollarTextMath: config.math.singleDollarTextMath }])
    processor.options.rehypePlugins.push([rehypeStarlightObsidian], [rehypeKatex])
  } else {
    throwPluginError("The configured 'markdown.processor' is not supported by the starlight-obsidian plugin.")
  }
}

function isSatteriProcessor(processor: unknown): processor is SatteriMarkdownProcessor {
  if (typeof processor !== 'object' || processor === null) return false
  const candidate = processor as { name?: unknown; options?: { hastPlugins?: unknown; mdastPlugins?: unknown[] } }
  return (
    candidate.name === 'satteri' &&
    Array.isArray(candidate.options?.hastPlugins) &&
    Array.isArray(candidate.options.mdastPlugins)
  )
}

function isUnifiedProcessor(processor: unknown): processor is UnifiedMarkdownProcessor {
  if (typeof processor !== 'object' || processor === null) return false
  const candidate = processor as { name?: unknown; options?: { rehypePlugins?: unknown; remarkPlugins?: unknown[] } }
  return (
    candidate.name === 'unified' &&
    Array.isArray(candidate.options?.rehypePlugins) &&
    Array.isArray(candidate.options.remarkPlugins)
  )
}

type MarkdownProcessor = NonNullable<AstroConfig['markdown']['processor']>

interface SatteriMarkdownProcessor {
  name: string
  options: { features?: SatteriFeatures; hastPlugins: unknown[]; mdastPlugins: unknown[] }
}

interface SatteriFeatures {
  math?:
    | boolean
    | {
        singleDollarTextMath?: boolean
      }
}

interface UnifiedMarkdownProcessor {
  name: string
  options: { rehypePlugins: unknown[]; remarkPlugins: unknown[] }
}
