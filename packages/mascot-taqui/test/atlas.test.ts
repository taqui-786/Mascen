import { describe, expect, it } from 'vitest'
import { atlasIndex, cellPosition, cssUrl, EXPRESSIONS, LOOKS } from '../src/runtime/atlas'

describe('atlas', () => {
  it('maps the center look to the middle cell', () => {
    expect(atlasIndex('center', LOOKS)).toBe(4)
    expect(cellPosition(4)).toBe('50% 50%')
  })

  it('steps the 3×3 grid in 50% increments', () => {
    expect(cellPosition(0)).toBe('0% 0%')
    expect(cellPosition(2)).toBe('100% 0%')
    expect(cellPosition(8)).toBe('100% 100%')
  })

  it('quotes css urls so query strings and spaces survive', () => {
    expect(cssUrl('/mascots/taqui-directions.webp')).toBe(
      'url("/mascots/taqui-directions.webp")',
    )
    expect(cssUrl('/foo bar.webp?x=1')).toBe('url("/foo bar.webp?x=1")')
    expect(cssUrl('a"b')).toBe('url("a%22b")')
  })

  it('keeps the expression sheet contract at nine cells', () => {
    expect(LOOKS).toHaveLength(9)
    expect(EXPRESSIONS).toHaveLength(9)
    expect(EXPRESSIONS[0]).toBe('blink')
    expect(EXPRESSIONS[8]).toBe('delighted')
  })
})
