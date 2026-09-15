import { afterEach, describe, expect, it } from 'vitest'
import { createMascot } from '../src/runtime/create-mascot'
import type { MascotEnv } from '../src/runtime/env'
import type { Expression } from '../src/runtime/atlas'

function createClock(media: Record<string, boolean> = {}) {
  let now = 0
  let nextId = 1
  const timers = new Map<number, { fn: () => void; at: number }>()

  const env: MascotEnv = {
    now: () => now,
    setTimeout(fn, ms) {
      const id = nextId++
      timers.set(id, { fn, at: now + ms })
      return id
    },
    clearTimeout(id) {
      timers.delete(id)
    },
    requestAnimationFrame(fn) {
      const id = nextId++
      timers.set(id, { fn: () => fn(now), at: now })
      return id
    },
    cancelAnimationFrame(id) {
      timers.delete(id)
    },
    matchMedia(query) {
      if (query in media) return { matches: media[query]! }
      if (query.includes('hover') && query.includes('pointer: fine')) return { matches: true }
      return { matches: false }
    },
    random: () => 0,
  }

  function flush(ms = 0) {
    now += ms
    let safety = 0
    while (safety++ < 100) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= now)
      if (due.length === 0) break
      for (const [id, timer] of due) {
        timers.delete(id)
        timer.fn()
      }
    }
  }

  return { env, flush, get now() { return now } }
}

function layers(host: HTMLElement) {
  const squash = host.firstElementChild as HTMLElement
  const look = squash.children[0] as HTMLElement
  const expr = squash.children[1] as HTMLElement
  return { look, expr }
}

describe('createMascot', () => {
  const hosts: HTMLElement[] = []

  afterEach(() => {
    for (const host of hosts) host.remove()
    hosts.length = 0
  })

  function mount(env: MascotEnv, extra: Record<string, unknown> = {}) {
    const host = document.createElement('button')
    document.body.append(host)
    hosts.push(host)
    const expressions: Array<Expression | null> = []
    const handle = createMascot(host, {
      directions: '/d.webp',
      reactions: '/r.webp',
      size: 100,
      idleBlink: false,
      expressionOnLoad: false,
      env,
      onExpression: (value) => expressions.push(value),
      ...extra,
    })
    return { host, handle, expressions }
  }

  it('quotes sheet urls and paints the center cell', () => {
    const { env } = createClock()
    const { host } = mount(env)
    const { look, expr } = layers(host)
    expect(look.style.backgroundImage).toBe('url("/d.webp")')
    expect(expr.style.backgroundImage).toBe('url("/r.webp")')
    expect(look.style.backgroundPosition).toBe('50% 50%')
    expect(look.style.opacity).toBe('1')
    expect(expr.style.opacity).toBe('0')
  })

  it('does not paint an inline background so className colors can show through', () => {
    const { env } = createClock()
    const { host } = mount(env)
    expect(host.style.background).toBe('')
    expect(host.style.backgroundColor).toBe('')
  })

  it('plays blink then a payoff on boop, then rests', () => {
    const clock = createClock()
    const { handle, expressions } = mount(clock.env)
    handle.boop()
    expect(expressions[0]).toBe('blink')
    clock.flush(110)
    expect(expressions.at(-1)).toBe('heart')
    clock.flush(420)
    expect(expressions.at(-1)).toBeNull()
  })

  it('goes dizzy after four rapid boops', () => {
    const clock = createClock()
    const { handle, expressions } = mount(clock.env)
    handle.boop()
    handle.boop()
    handle.boop()
    handle.boop()
    expect(expressions.at(-1)).toBe('dizzy')
  })

  it('scales look tracking off a 3×3 pad', () => {
    const clock = createClock()
    const looks: string[] = []
    const { host, handle } = mount(clock.env, { onLook: (look: string) => looks.push(look) })
    host.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON() {} })
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 400, clientY: 50 }),
    )
    clock.flush(0)
    expect(looks).toContain('right')
    handle.destroy()
  })

  it('destroy unhooks timers and empties the host', () => {
    const clock = createClock()
    const { host, handle } = mount(clock.env)
    handle.boop()
    handle.destroy()
    expect(host.childNodes).toHaveLength(0)
    clock.flush(5000)
  })

  it('glances from the keyboard map', () => {
    const clock = createClock()
    const looks: string[] = []
    const { handle } = mount(clock.env, { onLook: (look: string) => looks.push(look) })
    handle.glance('up-left')
    expect(looks).toEqual(['up-left'])
  })

  it('does not blink periodically by default', () => {
    const clock = createClock()
    const { expressions } = mount(clock.env)
    clock.flush(10000)
    expect(expressions).toHaveLength(0)
  })

  it('only blinks on idle when looking center, and avoids interrupting directed looks', async () => {
    const clock = createClock()
    const { handle, expressions } = mount(clock.env, { idleBlink: true })
    clock.flush(150)
    await new Promise((r) => setTimeout(r, 10))
    handle.glance('up-right')
    // At up-right, it should not blink even after 5s
    clock.flush(5000)
    expect(expressions).not.toContain('blink')

    // Once glanced back to center, idle blink triggers
    handle.glance('center')
    clock.flush(5000)
    expect(expressions).toContain('blink')
  })

  it('resets idle timer when pointer moves', async () => {
    const clock = createClock()
    const { host, expressions } = mount(clock.env, { idleBlink: true })
    host.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON() {} })
    clock.flush(150)
    await new Promise((r) => setTimeout(r, 10))
    // Active mouse moves in center dead-zone every 2s
    clock.flush(2000)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }))
    clock.flush(2000)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }))
    clock.flush(2000)
    // No blink should have fired while actively moving within the idle window
    expect(expressions).not.toContain('blink')
    // After resting for 5s at center, it blinks
    clock.flush(5000)
    expect(expressions).toContain('blink')
  })
})
