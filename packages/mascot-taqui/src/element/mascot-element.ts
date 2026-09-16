import { createMascot, type MascotHandle } from '../runtime/create-mascot'
import type { Expression, Look } from '../runtime/atlas'

export const TAG = 'mascot-taqui'

function boolAttr(value: string | null, fallback: boolean): boolean {
  if (value == null) return fallback
  if (value === '' || value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function readOptions(el: MascotTaqui) {
  const sizeAttr = el.getAttribute('size')
  const reactionAttr = el.getAttribute('reaction') as Expression | null
  const lookAttr = el.getAttribute('look') as Look | null
  return {
    directions: el.getAttribute('directions') ?? '/mascots/taqui-directions.webp',
    reactions: el.getAttribute('reactions') ?? '/mascots/taqui-reactions.webp',
    size: sizeAttr ? Number(sizeAttr) || 140 : 140,
    label: el.getAttribute('label') ?? 'Taqui',
    goToSleep: boolAttr(el.getAttribute('go-to-sleep'), false),
    reaction: reactionAttr || null,
    look: lookAttr || undefined,
    idleBlink: boolAttr(el.getAttribute('idle-blink'), false),
    followPointer: boolAttr(el.getAttribute('follow-pointer'), true),
    disabled: boolAttr(el.getAttribute('disabled'), false),
  }
}

export class MascotTaqui extends HTMLElement {
  static get observedAttributes() {
    return [
      'size',
      'label',
      'directions',
      'reactions',
      'go-to-sleep',
      'reaction',
      'look',
      'idle-blink',
      'follow-pointer',
      'disabled',
    ]
  }

  #button: HTMLButtonElement | null = null
  #handle: MascotHandle | null = null

  connectedCallback() {
    this.style.display = this.style.display || 'inline-block'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = this.getAttribute('class') ?? ''
    this.replaceChildren(button)
    this.#button = button
    this.#mount()
  }

  disconnectedCallback() {
    this.#handle?.destroy()
    this.#handle = null
    this.#button = null
  }

  attributeChangedCallback() {
    if (!this.#handle) return
    this.#handle.update(readOptions(this))
  }

  boop() {
    this.#handle?.boop()
  }

  sleep() {
    this.#handle?.sleep()
  }

  wake() {
    this.#handle?.wake()
  }

  glance(look: Look) {
    this.#handle?.glance(look)
  }

  react(expression: Expression, holdMs?: number) {
    this.#handle?.react(expression, holdMs)
  }

  #mount() {
    if (!this.#button) return
    this.#handle?.destroy()
    this.#handle = createMascot(this.#button, readOptions(this))
  }
}

export function defineMascotElement(): void {
  if (typeof customElements === 'undefined') return
  if (customElements.get(TAG)) return
  customElements.define(TAG, MascotTaqui)
}
