import { describe, expect, it } from 'vitest'

import { humanFileSize } from './fileDetails'
import { getExtension, getRawExtension } from './getFileIcon'
import { getLanguageByFileName, getPreviewType, preview } from './getPreviewType'
import { getReadablePath } from './getReadablePath'

describe('preview type detection', () => {
  it('distinguishes TypeScript source from TS video', () => {
    expect(getPreviewType('ts')).toBe(preview.code)
    expect(getPreviewType('ts', { video: true })).toBe(preview.video)
  })

  it('recognises common preview formats', () => {
    expect(getPreviewType('pdf')).toBe(preview.pdf)
    expect(getPreviewType('md')).toBe(preview.markdown)
    expect(getPreviewType('avif')).toBe(preview.image)
    expect(getPreviewType('mp3')).toBe(preview.audio)
    expect(getPreviewType('epub')).toBe(preview.epub)
  })

  it('returns undefined for unknown extensions', () => {
    expect(getPreviewType('unknown')).toBeUndefined()
  })
})

describe('file name helpers', () => {
  it('extracts the last extension and lower-cases it', () => {
    expect(getRawExtension('archive.tar.gz')).toBe('gz')
    expect(getExtension('README.PDF')).toBe('pdf')
  })

  it('returns an empty extension for extensionless names', () => {
    expect(getRawExtension('README')).toBe('')
    expect(getRawExtension(undefined)).toBe('')
  })

  it('maps source languages for the syntax highlighter', () => {
    expect(getLanguageByFileName('src/main.ts')).toBe('typescript')
    expect(getLanguageByFileName('config.yml')).toBe('yaml')
    expect(getLanguageByFileName('script.py')).toBe('python')
  })
})

describe('display helpers', () => {
  it('formats sizes with binary units', () => {
    expect(humanFileSize(0)).toBe('0 B')
    expect(humanFileSize(1024)).toBe('1.00 KB')
    expect(humanFileSize(1024 * 1024)).toBe('1.00 MB')
  })

  it('keeps Unicode readable while encoding URL-sensitive characters', () => {
    expect(getReadablePath('/中文 目录/file name.txt')).toBe('/中文%20目录/file%20name.txt')
  })
})
