export const LOOKS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
] as const

export type Look = (typeof LOOKS)[number]

export const EXPRESSIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const

export type Expression = (typeof EXPRESSIONS)[number]

/** Row-major 3×3 matching the look sheet. */
export const LOOK_GRID: readonly (readonly Look[])[] = [
  ['up-left', 'up', 'up-right'],
  ['left', 'center', 'right'],
  ['down-left', 'down', 'down-right'],
]

export function atlasIndex(name: string, order: readonly string[]): number {
  const index = order.indexOf(name)
  return index === -1 ? 4 : index
}

/** `background-size: 300%` makes each cell land on 0% / 50% / 100%. */
export function cellPosition(index: number): string {
  const col = index % 3
  const row = Math.floor(index / 3)
  return `${col * 50}% ${row * 50}%`
}

/** Quote the URL so paths with spaces, queries, or parentheses stay valid CSS. */
export function cssUrl(path: string): string {
  const escaped = path.replace(/\\/g, '/').replace(/"/g, '%22')
  return `url("${escaped}")`
}

export const LOAD_GREETING: readonly Expression[] = [
  'wink',
  'sparkle',
  'surprised',
  'delighted',
  'bashful',
]

export const BOOP_PAYOFFS: readonly Expression[] = ['heart', 'sparkle', 'delighted']
