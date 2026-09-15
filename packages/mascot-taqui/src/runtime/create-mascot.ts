import {
  atlasIndex,
  BOOP_PAYOFFS,
  cellPosition,
  cssUrl,
  EXPRESSIONS,
  LOAD_GREETING,
  LOOKS,
  type Expression,
  type Look,
} from './atlas'
import { browserEnv, type MascotEnv } from './env'
import { lookFromKey, resolveLook } from './look'

export type MascotOptions = {
  directions: string
  reactions: string
  size?: number
  label?: string
  expressionOnLoad?: boolean
  idleBlink?: boolean
  followPointer?: boolean
  disabled?: boolean
  env?: MascotEnv
  onBoop?: () => void
  onLook?: (look: Look) => void
  onExpression?: (expression: Expression | null) => void
}

export type MascotHandle = {
  destroy(): void
  boop(): void
  glance(look: Look): void
  setSize(px: number): void
  pause(): void
  resume(): void
  update(partial: Partial<Omit<MascotOptions, 'env'>>): void
}

const LAYER: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  inset: '0',
  backgroundSize: '300% 300%',
  backgroundRepeat: 'no-repeat',
}

const SQUASH: Keyframe[] = [
  { transform: 'rotate(0deg) scale(1, 1)' },
  { transform: 'rotate(-5deg) scale(1.07, 0.9)', offset: 0.2 },
  { transform: 'rotate(4deg) scale(0.93, 1.08)', offset: 0.46 },
  { transform: 'rotate(-1.5deg) scale(1.03, 0.97)', offset: 0.72 },
  { transform: 'rotate(0deg) scale(1, 1)' },
]

const BOOP_BLINK_MS = 110
const BOOP_PAYOFF_MS = 420
const DIZZY_AFTER = 4
const DIZZY_WINDOW_MS = 1600
const DIZZY_HOLD_MS = 1000
const GREET_BEAT_MS = 120
const BLINK_HOLD_MS = 140
const IDLE_MIN_MS = 4000
const IDLE_SPAN_MS = 4000
const SQUASH_MS = 360

type Step = { expression: Expression | null; ms: number }

export function createMascot(host: HTMLElement, options: MascotOptions): MascotHandle {
  const env = options.env ?? browserEnv()
  let size = options.size ?? 140
  let label = options.label ?? 'Taqui'
  let directions = options.directions
  let reactions = options.reactions
  let expressionOnLoad = options.expressionOnLoad ?? false
  let idleBlink = options.idleBlink ?? false
  let followPointer = options.followPointer ?? true
  let disabled = options.disabled ?? false

  let look: Look = 'center'
  let expression: Expression | null = null
  let paused = false
  let destroyed = false
  let visible = true
  let pointer: { x: number; y: number } | null = null
  let raf = 0
  let idleTimer = 0
  const sequenceTimers: number[] = []
  let boopCount = 0
  let boopAt = 0

  const squash = document.createElement('span')
  const lookLayer = document.createElement('span')
  const exprLayer = document.createElement('span')

  squash.style.position = 'relative'
  squash.style.display = 'block'
  squash.style.width = '100%'
  squash.style.height = '100%'
  squash.style.transformOrigin = '50% 80%'

  Object.assign(lookLayer.style, LAYER)
  Object.assign(exprLayer.style, LAYER)

  squash.append(lookLayer, exprLayer)
  host.replaceChildren(squash)

  if (host instanceof HTMLButtonElement) host.type = 'button'

  applyHostChrome()
  applySheets()
  paint()

  function applyHostChrome() {
    const s = host.style
    s.position = 'relative'
    s.display = 'block'
    s.flexShrink = '0'
    s.width = `${size}px`
    s.height = `${size}px`
    s.padding = '0'
    s.border = '0'
    s.appearance = 'none'
    s.cursor = disabled ? 'default' : 'pointer'
    s.userSelect = 'none'
    // Do not set background — callers can paint it with className (Tailwind bg-*).
    host.setAttribute('aria-label', disabled ? label : `Boop ${label}`)
    if (disabled) host.setAttribute('aria-disabled', 'true')
    else host.removeAttribute('aria-disabled')
  }

  function applySheets() {
    lookLayer.style.backgroundImage = cssUrl(directions)
    exprLayer.style.backgroundImage = cssUrl(reactions)
  }

  function paint() {
    lookLayer.style.backgroundPosition = cellPosition(atlasIndex(look, LOOKS))
    exprLayer.style.backgroundPosition = cellPosition(
      atlasIndex(expression ?? 'blink', EXPRESSIONS),
    )
    lookLayer.style.opacity = expression ? '0' : '1'
    exprLayer.style.opacity = expression ? '1' : '0'
  }

  function setLook(next: Look) {
    if (look === next) return
    look = next
    paint()
    options.onLook?.(look)
  }

  function setExpression(next: Expression | null) {
    if (expression === next) return
    expression = next
    paint()
    options.onExpression?.(expression)
  }

  function reduceMotion() {
    return env.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function finePointer() {
    return env.matchMedia('(hover: hover) and (pointer: fine)').matches
  }

  function trackingOn() {
    return followPointer && !disabled && !paused && visible && finePointer()
  }

  function aim() {
    if (!trackingOn() || !pointer) return
    const box = host.getBoundingClientRect()
    const dx = pointer.x - (box.left + box.width / 2)
    const dy = pointer.y - (box.top + box.height / 2)
    setLook(resolveLook(dx, dy, size, look))
  }

  function requestAim() {
    if (raf || !trackingOn()) return
    raf = env.requestAnimationFrame(() => {
      raf = 0
      aim()
    })
  }

  function greetingSteps(): Step[] {
    return LOAD_GREETING.map((name) => ({ expression: name, ms: GREET_BEAT_MS }))
  }

  function clearSequence() {
    for (const id of sequenceTimers) env.clearTimeout(id)
    sequenceTimers.length = 0
  }

  function playSequence(steps: Step[]) {
    clearSequence()
    env.clearTimeout(idleTimer)
    let wait = 0
    for (const step of steps) {
      const apply = () => setExpression(step.expression)
      if (wait === 0) apply()
      else sequenceTimers.push(env.setTimeout(apply, wait))
      wait += step.ms
    }
    sequenceTimers.push(
      env.setTimeout(() => {
        setExpression(null)
        scheduleIdle()
      }, wait),
    )
  }

  function scheduleIdle() {
    env.clearTimeout(idleTimer)
    if (!idleBlink || disabled || paused || !visible || reduceMotion()) return
    const delay = IDLE_MIN_MS + env.random() * IDLE_SPAN_MS
    idleTimer = env.setTimeout(() => {
      if (expression !== null || disabled || paused || look !== 'center') {
        scheduleIdle()
        return
      }
      setExpression('blink')
      sequenceTimers.push(
        env.setTimeout(() => {
          setExpression(null)
          scheduleIdle()
        }, BLINK_HOLD_MS),
      )
    }, delay)
  }

  function boop() {
    if (disabled || paused) return
    options.onBoop?.()
    const now = env.now()
    boopCount = now - boopAt < DIZZY_WINDOW_MS ? boopCount + 1 : 1
    boopAt = now

    if (boopCount >= DIZZY_AFTER) {
      boopCount = 0
      playSequence([{ expression: 'dizzy', ms: DIZZY_HOLD_MS }])
    } else {
      const payoff = BOOP_PAYOFFS[(boopCount - 1) % BOOP_PAYOFFS.length]!
      playSequence([
        { expression: 'blink', ms: BOOP_BLINK_MS },
        { expression: payoff, ms: BOOP_PAYOFF_MS },
      ])
    }

    if (!reduceMotion() && typeof squash.animate === 'function') {
      squash.getAnimations?.().forEach((a) => a.cancel())
      squash.animate(SQUASH, { duration: SQUASH_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
    }
  }

  function glance(next: Look) {
    if (disabled) return
    setLook(next)
  }

  function onPointerMove(event: PointerEvent) {
    pointer = { x: event.clientX, y: event.clientY }
    scheduleIdle()
    requestAim()
  }

  function onScroll() {
    scheduleIdle()
    requestAim()
  }

  function onClick(event: Event) {
    event.preventDefault()
    boop()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return
    scheduleIdle()
    const next = lookFromKey(event.key)
    if (next) {
      event.preventDefault()
      glance(next)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      boop()
    }
  }

  function onResize() {
    requestAim()
  }

  const resizeObserver = new ResizeObserver(() => requestAim())
  const intersectionObserver = new IntersectionObserver((entries) => {
    const self = entries.find((entry) => entry.target === host)
    if (!self) return
    visible = self.isIntersecting
    if (visible) scheduleIdle()
    else env.clearTimeout(idleTimer)
  })

  function bind() {
    host.addEventListener('click', onClick)
    host.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    resizeObserver.observe(host)
    intersectionObserver.observe(host)
  }

  function unbind() {
    host.removeEventListener('click', onClick)
    host.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    if (raf) env.cancelAnimationFrame(raf)
    raf = 0
  }

  async function preload() {
    await Promise.all([decodeSheet(directions), decodeSheet(reactions)])
  }

  function decodeSheet(src: string) {
    return new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        env.clearTimeout(timer)
        resolve()
      }
      const timer = env.setTimeout(done, 100)
      const image = new Image()
      image.onload = () => {
        const decoded = image.decode?.()
        if (decoded) decoded.then(done).catch(done)
        else done()
      }
      image.onerror = done
      image.src = src
    })
  }

  function destroy() {
    if (destroyed) return
    destroyed = true
    unbind()
    clearSequence()
    env.clearTimeout(idleTimer)
    host.replaceChildren()
  }

  function setSize(px: number) {
    size = px
    applyHostChrome()
    requestAim()
  }

  function pause() {
    paused = true
    env.clearTimeout(idleTimer)
  }

  function resume() {
    paused = false
    scheduleIdle()
    requestAim()
  }

  function update(partial: Partial<Omit<MascotOptions, 'env'>>) {
    if (partial.size != null) size = partial.size
    if (partial.label != null) label = partial.label
    if (partial.directions != null) directions = partial.directions
    if (partial.reactions != null) reactions = partial.reactions
    if (partial.expressionOnLoad != null) expressionOnLoad = partial.expressionOnLoad
    if (partial.idleBlink != null) idleBlink = partial.idleBlink
    if (partial.followPointer != null) followPointer = partial.followPointer
    if (partial.disabled != null) disabled = partial.disabled
    if (partial.onBoop) options.onBoop = partial.onBoop
    if (partial.onLook) options.onLook = partial.onLook
    if (partial.onExpression) options.onExpression = partial.onExpression
    applyHostChrome()
    applySheets()
    paint()
    if (!idleBlink) env.clearTimeout(idleTimer)
    else scheduleIdle()
    requestAim()
  }

  bind()
  void preload().then(() => {
    if (destroyed || disabled) return
    if (expressionOnLoad && !reduceMotion()) playSequence(greetingSteps())
    else scheduleIdle()
  })

  return { destroy, boop, glance, setSize, pause, resume, update }
}
