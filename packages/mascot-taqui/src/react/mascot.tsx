'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { CSSProperties, Ref } from 'react'
import { createMascot, type MascotHandle } from '../runtime/create-mascot'
import type { Expression, Look } from '../runtime/atlas'

export const DEFAULT_DIRECTIONS = '/mascots/taqui-directions.webp'
export const DEFAULT_REACTIONS = '/mascots/taqui-reactions.webp'

export type { MascotHandle }

export type MascotProps = {
  directions?: string
  reactions?: string
  size?: number
  label?: string
  className?: string
  style?: CSSProperties
  goToSleep?: boolean
  reaction?: Expression | null
  look?: Look
  idleBlink?: boolean
  followPointer?: boolean
  disabled?: boolean
  ref?: Ref<MascotHandle>
  onBoop?: () => void
  onLook?: (look: Look) => void
  onExpression?: (expression: Expression | null) => void
}

export const Mascot = forwardRef<MascotHandle, MascotProps>(function Mascot(
  {
    directions = DEFAULT_DIRECTIONS,
    reactions = DEFAULT_REACTIONS,
    size = 240,
    label = 'Taqui',
    className,
    style,
    goToSleep = false,
    reaction = null,
    look,
    idleBlink = false,
    followPointer = true,
    disabled = false,
    onBoop,
    onLook,
    onExpression,
  },
  ref
) {
  const hostRef = useRef<HTMLButtonElement>(null)
  const handleRef = useRef<MascotHandle | null>(null)
  const callbacks = useRef({ onBoop, onLook, onExpression })
  callbacks.current = { onBoop, onLook, onExpression }

  useImperativeHandle(
    ref,
    () => ({
      destroy: () => handleRef.current?.destroy(),
      boop: () => handleRef.current?.boop(),
      glance: (l: Look) => handleRef.current?.glance(l),
      react: (expr: Expression, holdMs?: number) => handleRef.current?.react(expr, holdMs),
      sleep: () => handleRef.current?.sleep(),
      wake: () => handleRef.current?.wake(),
      setSize: (px: number) => handleRef.current?.setSize(px),
      pause: () => handleRef.current?.pause(),
      resume: () => handleRef.current?.resume(),
      update: (partial) => handleRef.current?.update(partial),
    }),
    []
  )

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const handle = createMascot(host, {
      directions,
      reactions,
      size,
      label,
      goToSleep,
      reaction,
      look,
      idleBlink,
      followPointer,
      disabled,
      onBoop: () => callbacks.current.onBoop?.(),
      onLook: (l) => callbacks.current.onLook?.(l),
      onExpression: (value) => callbacks.current.onExpression?.(value),
    })
    handleRef.current = handle
    return () => {
      handle.destroy()
      handleRef.current = null
    }
  }, [directions, reactions, size, label, goToSleep, reaction, look, idleBlink, followPointer, disabled])

  return (
    <button
      ref={hostRef}
      type="button"
      className={className}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        padding: 0,
        border: 0,
        appearance: 'none',
        flexShrink: 0,
        display: 'block',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        ...style,
      }}
    />
  )
})

