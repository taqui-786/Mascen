import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addMascot } from '../src/cli/add'

describe('addMascot', () => {
  process.env.MASCEN_REGISTRY_URL = 'http://localhost:3000'

  it('copies Taqui sheets by default and writes a Next wrapper', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mascot-add-default-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo', dependencies: { next: '16.0.0' } }),
    )
    writeFileSync(join(dir, 'next.config.ts'), 'export default {}')
    mkdirSync(join(dir, 'app'), { recursive: true })

    await addMascot(dir, ['--nextjs', '--copy-only', '--force'])

    expect(existsSync(join(dir, 'public/mascots/taqui-directions.webp'))).toBe(true)
    expect(existsSync(join(dir, 'public/mascots/taqui-reactions.webp'))).toBe(true)
    const wrapper = readFileSync(join(dir, 'app/components/mascot.tsx'), 'utf8')
    expect(wrapper).toContain("'use client'")
    expect(wrapper).toContain("from 'mascot-taqui/react'")
    expect(wrapper).toContain('/mascots/taqui-directions.webp')
  })

  it('copies specific preset sprite sheets and writes custom pre-bound wrapper', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mascot-add-fox-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo', dependencies: { next: '16.0.0' } }),
    )
    writeFileSync(join(dir, 'next.config.ts'), 'export default {}')
    mkdirSync(join(dir, 'app'), { recursive: true })

    await addMascot(dir, ['fox', '--nextjs', '--copy-only', '--force'])

    expect(existsSync(join(dir, 'public/mascots/fox-directions.webp'))).toBe(true)
    expect(existsSync(join(dir, 'public/mascots/fox-reactions.webp'))).toBe(true)
    const wrapper = readFileSync(join(dir, 'app/components/mascot.tsx'), 'utf8')
    expect(wrapper).toContain("'use client'")
    expect(wrapper).toContain("from 'mascot-taqui/react'")
    expect(wrapper).toContain('Fox')
    expect(wrapper).toContain('/mascots/fox-directions.webp')
    expect(wrapper).toContain('/mascots/fox-reactions.webp')
  })
})
