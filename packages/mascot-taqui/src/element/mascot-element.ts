import { createMascot, type MascotHandle } from '../runtime/create-mascot'

export const TAG = 'mascot-taqui'

function boolAttr(value: string | null, fallback: boolean): boolean {
  if (value == null) return fallback
  if (value === '' || value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function readOptions(el: MascotTaqui) {
  const sizeAttr = el.getAttribute('size')
  return {
    directions: el.getAttribute('directions') ?? '/mascots/taqui-directions.webp',
    reactions: el.getAttribute('reactions') ?? '/mascots/taqui-reactions.webp',
    size: sizeAttr ? Number(sizeAttr) || 140 : 140,
    label: el.getAttribute('label') ?? 'Taqui',
    expressionOnLoad: boolAttr(el.getAttribute('expression-on-load'), false),
    idleBlink: boolAttr(el.getAttribute('idle-blink'), true),
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
      'expression-on-load',
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
