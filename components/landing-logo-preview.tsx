"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import Image from "next/image"

interface LogoVariant {
  id: string
  label: string
  styleName: string
  image: string
}

const VARIANTS: LogoVariant[] = [
  {
    id: "signature",
    label: "3D Character",
    styleName: "Signature 3D",
    image: "/logos/mascen-signature.png",
  },
  {
    id: "contrast",
    label: "Contrast",
    styleName: "Contrast Emphasis",
    image: "/logos/mascen-contrast.png",
  },
  {
    id: "app-icon",
    label: "App Icon",
    styleName: "Modern Squircle",
    image: "/logos/mascen-app-icon.png",
  },
  {
    id: "emblem",
    label: "Emblem",
    styleName: "Circular Crest",
    image: "/logos/mascen-emblem.png",
  },
  {
    id: "sticker",
    label: "Sticker",
    styleName: "Die-Cut Badge",
    image: "/logos/mascen-sticker.png",
  },
  {
    id: "wink",
    label: "Wink",
    styleName: "Playful Wink",
    image: "/logos/mascen-wink.png",
  },
]

export function LandingLogoPreview() {
  const [activeVariant, setActiveVariant] = useState<LogoVariant>(VARIANTS[0])
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none">
      {/* Ambient radial atmosphere */}
      <div
        className="pointer-events-none absolute size-64 sm:size-80 rounded-full bg-amber-500/15 blur-3xl transition-opacity duration-500"
        aria-hidden
      />

      {/* Floating 3D Logo Stage */}
      <motion.div
        animate={
          reduceMotion
            ? {}
            : {
                y: [0, -7, 0],
              }
        }
        transition={{
          duration: 4.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative flex size-48 sm:size-56 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeVariant.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -8 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 26,
              }}
              className="relative size-44 sm:size-52 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <Image
                src={activeVariant.image}
                alt={`${activeVariant.styleName} logo for Mascen`}
                width={260}
                height={260}
                className="size-full object-contain drop-shadow-xl"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic floor contact shadow reacting to logo float */}
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
            duration: 4.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mt-2 h-3.5 w-40 rounded-[100%] bg-foreground/15 blur-md dark:bg-black/50"
          aria-hidden
        />
      </motion.div>

      {/* Tactile Variant Selector Bar */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-muted/60 p-1.5 border border-border/50 backdrop-blur-md shadow-2xs">
          {VARIANTS.map((variant) => {
            const isSelected = activeVariant.id === variant.id
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setActiveVariant(variant)}
                className="group relative flex items-center gap-2 rounded-full px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium cursor-pointer transition-all active:scale-[0.96]"
                title={variant.styleName}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-logo-variant"
                    className="absolute inset-0 rounded-full bg-background shadow-xs border border-border/60"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
                <div className="relative z-10 size-4.5 sm:size-5 shrink-0 overflow-hidden rounded-full border border-black/10 dark:border-white/10">
                  <Image
                    src={variant.image}
                    alt=""
                    width={28}
                    height={28}
                    className="size-full object-contain"
                  />
                </div>
                <span
                  className={`relative z-10 text-xs sm:text-[13px] transition-colors ${
                    isSelected
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {variant.label}
                </span>
              </button>
            )
          })}
        </div>

        <span className="text-xs sm:text-[13px] text-muted-foreground/80 font-medium">
          {activeVariant.styleName} · 9 prompt variations
        </span>
      </div>
    </div>
  )
}
