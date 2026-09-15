import { describe, expect, it } from 'vitest'
import { axisIndex, lookFromKey, resolveLook } from '../src/runtime/look'

describe('resolveLook', () => {
  const size = 100
  // dead = 42, margin = 12

  it('stays on center while the pointer is inside the scaled dead zone', () => {
    expect(resolveLook(0, 0, size, 'center')).toBe('center')
    expect(resolveLook(20, 10, size, 'center')).toBe('center')
    expect(resolveLook(-40, 0, size, 'center')).toBe('center')
  })

  it('looks right / left / down / up once the pointer leaves the dead zone', () => {
    expect(resolveLook(80, 0, size, 'center')).toBe('right')
    expect(resolveLook(-80, 0, size, 'center')).toBe('left')
    expect(resolveLook(0, 80, size, 'center')).toBe('down')
    expect(resolveLook(0, -80, size, 'center')).toBe('up')
  })

  it('uses the 3×3 pad for diagonals, not pie slices', () => {
    expect(resolveLook(80, -80, size, 'center')).toBe('up-right')
    expect(resolveLook(-80, 80, size, 'center')).toBe('down-left')
  })

  it('holds the current cell until the pointer crosses a margin', () => {
    // Currently looking right. A pointer just inside the right threshold
    // (dx = 40, dead = 42) must stay right because of hysteresis.
    expect(resolveLook(40, 0, size, 'right')).toBe('right')
    // Past the inner margin (42 - 12 = 30) it returns to center.
    expect(resolveLook(20, 0, size, 'right')).toBe('center')
  })

  it('scales the dead zone with size', () => {
    expect(resolveLook(50, 0, 80, 'center')).toBe('right') // dead = 33.6
    expect(resolveLook(50, 0, 200, 'center')).toBe('center') // dead = 84
  })
})

describe('axisIndex', () => {
  it('jumps from left to right without stopping on center when the pointer teleports', () => {
    expect(axisIndex(80, 42, 12, 0)).toBe(2)
    expect(axisIndex(-80, 42, 12, 2)).toBe(0)
  })
})

describe('lookFromKey', () => {
  it('maps arrows onto the pad', () => {
    expect(lookFromKey('ArrowLeft')).toBe('left')
    expect(lookFromKey('ArrowUp')).toBe('up')
    expect(lookFromKey('a')).toBeNull()
  })
})
