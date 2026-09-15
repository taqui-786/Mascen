import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addMascot } from '../src/cli/add'

describe('addMascot', () => {
  it('copies Taqui sheets and writes a Next wrapper', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mascot-add-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo', dependencies: { next: '16.0.0' } }),
    )
    writeFileSync(join(dir, 'next.config.ts'), 'export default {}')
    mkdirSync(join(dir, 'app'), { recursive: true })

    addMascot(dir, ['--nextjs', '--copy-only', '--force'])

    expect(existsSync(join(dir, 'public/mascots/taqui-directions.webp'))).toBe(true)
    expect(existsSync(join(dir, 'public/mascots/taqui-reactions.webp'))).toBe(true)
    const wrapper = readFileSync(join(dir, 'app/components/mascot.tsx'), 'utf8')
    expect(wrapper).toContain("'use client'")
    expect(wrapper).toContain("from 'mascot-taqui/react'")
  })
})
