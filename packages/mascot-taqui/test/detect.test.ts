import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectFramework, detectPackageManager, parseFrameworkFlag } from '../src/cli/detect'

function tempProject(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'mascot-taqui-'))
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(dir, name), contents)
  }
  return dir
}

describe('detect', () => {
  it('reads next from next.config and the lockfile for the package manager', () => {
    const dir = tempProject({
      'next.config.ts': 'export default {}',
      'package.json': JSON.stringify({ dependencies: { next: '16.0.0' } }),
      'pnpm-lock.yaml': '',
    })
    expect(detectFramework(dir)).toBe('nextjs')
    expect(detectPackageManager(dir)).toBe('pnpm')
  })

  it('parses explicit flags', () => {
    expect(parseFrameworkFlag(['add', '--vue'])).toBe('vue')
    expect(parseFrameworkFlag(['--html'])).toBe('html')
    expect(parseFrameworkFlag(['add'])).toBeNull()
  })
})
