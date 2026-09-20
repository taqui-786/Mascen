"use client"

import { useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Mascot } from "@/components/mascot"
import type { MascotHandle } from "@/components/mascot"

export function LandingMascotPreview() {
  const mascotRef = useRef<MascotHandle>(null)
  const reduceMotion = useReducedMotion()
  const [, setClickCount] = useState(0)

  const handleMascotClick = () => {
    setClickCount((c) => c + 1)
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none">
      {/* Floating character wrapper with spring micro-physics */}
      <motion.div
        animate={
          reduceMotion
            ? {}
            : {
                y: [0, -8, 0],
              }
        }
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 flex flex-col items-center cursor-pointer"
        onClick={handleMascotClick}
      >
        <Mascot
          ref={mascotRef}
          size={240}
          label="Taqui, Mascen interactive cursor companion"
          directions="/mascots/taqui-directions.webp"
          reactions="/mascots/taqui-reactions.webp"
          className="transition-transform duration-150 active:scale-95"
        />

        {/* Dynamic floor contact shadow reacting to float */}
        <motion.div
          animate={
            reduceMotion
              ? {}
              : {
                  scaleX: [1, 0.88, 1],
                  scaleY: [1, 0.82, 1],
                  opacity: [0.45, 0.25, 0.45],
                }
          }
          transition={{
            duration: 4.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mt-2 h-4 w-44 rounded-[100%] bg-foreground/15 blur-md dark:bg-black/50"
          aria-hidden
        />
      </motion.div>

      {/* Refined micro-interaction hint */}
      <div className="mt-4 flex items-center gap-2 text-xs sm:text-[13px] text-muted-foreground/80 font-medium">
        <span className="size-2 rounded-full bg-emerald-500/90 animate-pulse" />
        <span>Tracks pointer · Click to react</span>
      </div>
    </div>
  )
}
