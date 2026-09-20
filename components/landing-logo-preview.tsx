"use client"

import { useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react"
import Image from "next/image"

interface LogoVariant {
  id: string
  label: string
  styleName: string
  image: string
}

export interface LogoCollection {
  id: string
  title: string
  shortLabel: string
  badge: string
  variants: LogoVariant[]
}

const FOUNDER_COLLECTION: LogoCollection = {
  id: "founder-mascot",
  title: "Founder 3D Mascot",
  shortLabel: "3D Mascot (New)",
  badge: "Photo-to-Mascot",
  variants: [
    {
      id: "founder-sig",
      label: "Signature",
      styleName: "3D Signature Mascot (Front)",
      image: "/logos/mascen-founder-signature.png",
    },
    {
      id: "founder-angle",
      label: "3/4 Angle",
      styleName: "3/4 Angle Mascot Icon",
      image: "/logos/mascen-founder-angle.png",
    },
    {
      id: "founder-warm",
      label: "Warm Edition",
      styleName: "Signature Orange Monotone",
      image: "/logos/mascen-founder-warm.png",
    },
    {
      id: "founder-contrast",
      label: "Silhouette",
      styleName: "High-Contrast Silhouette Mark",
      image: "/logos/mascen-founder-contrast.png",
    },
    {
      id: "founder-emblem",
      label: "Emblem",
      styleName: "Stylized Logo Emblem",
      image: "/logos/mascen-founder-emblem.png",
    },
  ],
}

const CURSOR_COLLECTION: LogoCollection = {
  id: "cursor-brand",
  title: "Geometric Pointer",
  shortLabel: "Brand Mark",
  badge: "Interactive Cursor",
  variants: [
    {
      id: "cursor-sig",
      label: "Primary",
      styleName: "Sculpted Brand Icon",
      image: "/logos/mascen-signature.png",
    },
    {
      id: "cursor-contrast",
      label: "Contrast",
      styleName: "Contrast Brand Mark",
      image: "/logos/mascen-contrast.png",
    },
    {
      id: "cursor-app",
      label: "App Icon",
      styleName: "Squircle App Icon",
      image: "/logos/mascen-app-icon.png",
    },
    {
      id: "cursor-emblem",
      label: "Emblem",
      styleName: "Circular Emblem Crest",
      image: "/logos/mascen-emblem.png",
    },
  ],
}

const COLLECTIONS: LogoCollection[] = [FOUNDER_COLLECTION, CURSOR_COLLECTION]

export function LandingLogoPreview() {
  const [activeCollection, setActiveCollection] = useState<LogoCollection>(FOUNDER_COLLECTION)
  const [activeVariant, setActiveVariant] = useState<LogoVariant>(FOUNDER_COLLECTION.variants[0])
  const stageRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Antigravity 3D cursor tilt physics
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 260, damping: 24 })
  const mouseY = useSpring(y, { stiffness: 260, damping: 24 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["12deg", "-12deg"])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-12deg", "12deg"])
  const shadowX = useTransform(mouseX, [-0.5, 0.5], [-8, 8])
  const shadowY = useTransform(mouseY, [-0.5, 0.5], [6, -6])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const mouseXPos = (e.clientX - rect.left) / rect.width - 0.5
    const mouseYPos = (e.clientY - rect.top) / rect.height - 0.5
    x.set(mouseXPos)
    y.set(mouseYPos)
  }

  const handlePointerLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative flex flex-col items-center justify-center py-2 select-none [perspective:1000px]"
    >
      {/* Collection Switcher Pills */}
      <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 p-1 mb-2 backdrop-blur-sm shadow-2xs">
        {COLLECTIONS.map((c) => {
          const isCurrent = activeCollection.id === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCollection(c)
                setActiveVariant(c.variants[0])
              }}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isCurrent
                  ? "bg-background text-foreground shadow-xs scale-102"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{c.shortLabel}</span>
              {isCurrent && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
      {/* Floating 3D Logo Stage with interactive spatial tilt */}
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
        style={
          reduceMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
        }
        className="relative z-10 flex flex-col items-center cursor-pointer will-change-transform"
      >
        <div className="relative flex size-48 sm:size-56 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeVariant.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, rotateY: -15 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 25,
              }}
              className="relative size-44 sm:size-52 flex items-center justify-center transition-transform duration-200 hover:scale-105"
            >
              <Image
                src={activeVariant.image}
                alt={`${activeVariant.styleName} logo for Mascen`}
                width={260}
                height={260}
                className="size-full object-contain filter drop-shadow-xl"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic floor contact shadow reacting to 3D tilt and float */}
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
          style={
            reduceMotion
              ? undefined
              : {
                  x: shadowX,
                  y: shadowY,
                }
          }
          className="mt-2 h-3.5 w-40 rounded-[100%] bg-foreground/15 blur-md dark:bg-black/50"
          aria-hidden
        />
      </motion.div>

      {/* Tactile Variant Swatch Tiles */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 p-1 flex-wrap justify-center">
          {activeCollection.variants.map((v) => {
            const isSelected = activeVariant.id === v.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVariant(v)}
                className={`relative flex size-12 sm:size-14 items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-primary/80 bg-primary/10 shadow-sm scale-105 ring-2 ring-primary/30"
                    : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60 hover:scale-102"
                }`}
                title={v.styleName}
              >
                <div className="size-8 sm:size-9 overflow-hidden">
                  <Image
                    src={v.image}
                    alt={v.label}
                    width={40}
                    height={40}
                    className="size-full object-contain"
                  />
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span className="size-1.5 rounded-full bg-primary/70" />
          <span>{activeVariant.styleName} · 9 variations available</span>
        </div>
      </div>
    </div>
  )
}
