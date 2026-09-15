'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { createMascot } from '../runtime/create-mascot'
import type { Expression, Look } from '../runtime/atlas'

export const DEFAULT_DIRECTIONS = '/mascots/taqui-directions.webp'
export const DEFAULT_REACTIONS = '/mascots/taqui-reactions.webp'

export type MascotProps = {
  directions?: string
  reactions?: string
  size?: number
  label?: string
  className?: string
  style?: CSSProperties
  expressionOnLoad?: boolean
  idleBlink?: boolean
  followPointer?: boolean
  disabled?: boolean
  onBoop?: () => void
  onLook?: (look: Look) => void
  onExpression?: (expression: Expression | null) => void
}

export function Mascot({
  directions = DEFAULT_DIRECTIONS,
  reactions = DEFAULT_REACTIONS,
  size = 140,
  label = 'Taqui',
  className,
  style,
  expressionOnLoad = false,
  idleBlink = false,
  followPointer = true,
  disabled = false,
  onBoop,
  onLook,
  onExpression,
}: MascotProps) {
  const hostRef = useRef<HTMLButtonElement>(null)
  const callbacks = useRef({ onBoop, onLook, onExpression })
  callbacks.current = { onBoop, onLook, onExpression }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const handle = createMascot(host, {
      directions,
      reactions,
      size,
      label,
      expressionOnLoad,
      idleBlink,
      followPointer,
      disabled,
      onBoop: () => callbacks.current.onBoop?.(),
      onLook: (look) => callbacks.current.onLook?.(look),
      onExpression: (value) => callbacks.current.onExpression?.(value),
    })
    return () => handle.destroy()
  }, [directions, reactions, size, label, expressionOnLoad, idleBlink, followPointer, disabled])

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
}
