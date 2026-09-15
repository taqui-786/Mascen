import { LOOK_GRID, type Look } from './atlas'

export const DEAD_RATIO = 0.42
export const MARGIN_RATIO = 0.12

export type Axis = 0 | 1 | 2

export function lookToCell(look: Look): { col: Axis; row: Axis } {
  for (let row = 0; row < 3; row++) {
    const col = LOOK_GRID[row]!.indexOf(look)
    if (col !== -1) return { col: col as Axis, row: row as Axis }
  }
  return { col: 1, row: 1 }
}

/**
 * 3-way axis with hysteresis. The current bucket stays sticky until the
 * pointer crosses a margin into a neighbour — no angular wrap, no pie slices.
 */
export function axisIndex(v: number, dead: number, margin: number, current: Axis): Axis {
  const lo = -dead
  const hi = dead
  if (current === 0) {
    if (v > hi) return 2
    if (v > lo + margin) return 1
    return 0
  }
  if (current === 2) {
    if (v < lo) return 0
    if (v < hi - margin) return 1
    return 2
  }
  if (v < lo) return 0
  if (v > hi) return 2
  return 1
}

export type LookOptions = {
  deadRatio?: number
  marginRatio?: number
}

/**
 * Map a pointer offset (mascot-local, y-down) onto the 3×3 look pad.
 * `size` is the rendered square; the center dead zone scales with it.
 */
export function resolveLook(
  dx: number,
  dy: number,
  size: number,
  current: Look,
  options: LookOptions = {},
): Look {
  const dead = Math.max(8, size * (options.deadRatio ?? DEAD_RATIO))
  const margin = Math.max(4, size * (options.marginRatio ?? MARGIN_RATIO))
  const { col, row } = lookToCell(current)
  const nextCol = axisIndex(dx, dead, margin, col)
  const nextRow = axisIndex(dy, dead, margin, row)
  return LOOK_GRID[nextRow]![nextCol]!
}

const ARROW_LOOK: Record<string, Look> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Home: 'up-left',
  End: 'down-left',
  PageUp: 'up-right',
  PageDown: 'down-right',
}

export function lookFromKey(key: string): Look | null {
  return ARROW_LOOK[key] ?? null
}
