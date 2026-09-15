export type MediaQuery = { matches: boolean }

export type MascotEnv = {
  now(): number
  setTimeout(fn: () => void, ms: number): number
  clearTimeout(id: number): void
  requestAnimationFrame(fn: (time: number) => void): number
  cancelAnimationFrame(id: number): void
  matchMedia(query: string): MediaQuery
  random(): number
}

export function browserEnv(): MascotEnv {
  return {
    now: () => Date.now(),
    setTimeout: (fn, ms) => window.setTimeout(fn, ms) as unknown as number,
    clearTimeout: (id) => {
      window.clearTimeout(id)
    },
    requestAnimationFrame: (fn) => window.requestAnimationFrame(fn),
    cancelAnimationFrame: (id) => {
      window.cancelAnimationFrame(id)
    },
    matchMedia: (query) => window.matchMedia(query),
    random: () => Math.random(),
  }
}
