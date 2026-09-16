"use client"

import { useRef, useState } from "react"
import {
  AiSparklesIcon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowDownLeft01Icon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpLeft01Icon,
  ArrowUpRight01Icon,
  Cursor01Icon,
  Download01Icon,
  EyeClosedIcon,
  EyeIcon,
  FavouriteIcon,
  Moon02Icon,
  SmileDizzyIcon,
  SmileIcon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Mascot, type MascotHandle } from "@/components/mascot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type ExpressionType =
  | "heart"
  | "sparkle"
  | "wink"
  | "surprised"
  | "delighted"
  | "bashful"
  | "sleepy"
  | "dizzy"
  | "blink"

type LookType =
  | "up-left"
  | "up"
  | "up-right"
  | "left"
  | "center"
  | "right"
  | "down-left"
  | "down"
  | "down-right"

export type PreviewStageProps = {
  label: string
  slug: string
  directions: string
  reactions: string
  isGenerating?: boolean
  stepMessage?: string
  stepProgress?: number
  metrics?: {
    shift: number
    paletteMatch: number
    widthChange: number
  } | null
  error?: string | null
  onClearError?: () => void
  onScrollToDownload?: () => void
}

const REACTIONS: { id: ExpressionType; label: string; icon: typeof FavouriteIcon }[] = [
  { id: "heart", label: "Heart", icon: FavouriteIcon },
  { id: "sparkle", label: "Sparkle", icon: SparklesIcon },
  { id: "wink", label: "Wink", icon: EyeIcon },
  { id: "surprised", label: "Surprise", icon: SmileIcon },
  { id: "delighted", label: "Delight", icon: AiSparklesIcon },
  { id: "bashful", label: "Bashful", icon: SmileIcon },
  { id: "sleepy", label: "Sleepy", icon: Moon02Icon },
  { id: "dizzy", label: "Dizzy", icon: SmileDizzyIcon },
  { id: "blink", label: "Blink", icon: EyeClosedIcon },
]

const COMPASS_GRID: { look: LookType; label: string; icon: typeof ArrowUp01Icon }[] = [
  { look: "up-left", label: "Up Left", icon: ArrowUpLeft01Icon },
  { look: "up", label: "Up", icon: ArrowUp01Icon },
  { look: "up-right", label: "Up Right", icon: ArrowUpRight01Icon },
  { look: "left", label: "Left", icon: ArrowLeft01Icon },
  { look: "center", label: "Center", icon: Target01Icon },
  { look: "right", label: "Right", icon: ArrowRight01Icon },
  { look: "down-left", label: "Down Left", icon: ArrowDownLeft01Icon },
  { look: "down", label: "Down", icon: ArrowDown01Icon },
  { look: "down-right", label: "Down Right", icon: ArrowDownRight01Icon },
]

export function PreviewStage({
  label,
  directions,
  reactions,
  isGenerating = false,
  stepMessage = "",
  stepProgress = 0,
  metrics,
  error,
  onClearError,
  onScrollToDownload,
}: PreviewStageProps) {
  const mascotRef = useRef<MascotHandle>(null)

  // Interactive controls
  const [followPointer, setFollowPointer] = useState(true)
  const [idleBlink, setIdleBlink] = useState(false)
  const [goToSleep, setGoToSleep] = useState(false)
  const [size, setSize] = useState(240)
  const [currentLook, setCurrentLook] = useState<string>("center")
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null)

  function triggerReaction(expr: ExpressionType) {
    setActiveReactionId(expr)
    mascotRef.current?.react(expr, 900)
    setTimeout(() => {
      setActiveReactionId((prev) => (prev === expr ? null : prev))
    }, 900)
  }

  function triggerGlance(look: LookType) {
    mascotRef.current?.glance(look)
    setCurrentLook(look)
  }

  return (
    <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0">
      {/* 1. LEFT/CENTER: Interactive Mascot Viewport or Generation Chamber */}
      <div className="relative flex min-h-[400px] flex-col justify-between p-4 sm:p-6 bg-muted/15 transition-colors duration-200">
        {/* Viewport Header: Mascot Name & Status */}
        <div className="z-10 flex items-center justify-between border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
              {label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              · Interactive Stage
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full transition-colors",
                goToSleep ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
              )}
            />
            <span>{goToSleep ? "Sleeping" : `${size}px`}</span>
          </div>
        </div>

        {/* Generation Chamber State */}
        {isGenerating ? (
          <div className="my-auto flex flex-col items-center justify-center gap-6 py-8">
            {/* Animated character pulse silhouette */}
            <div className="relative flex size-40 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-primary/15 animate-ping opacity-25" />
              <div className="relative flex size-32 items-center justify-center rounded-2xl border border-primary/25 bg-primary/5 shadow-2xs">
                <HugeiconsIcon icon={SparklesIcon} className="size-10 text-primary animate-pulse" />
              </div>
            </div>

            {/* Step and Progress Info */}
            <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <Spinner className="size-3.5 text-primary" />
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  Synthesizing {label || "Mascot"}
                </span>
                <span className="font-mono text-xs font-bold text-primary">{stepProgress}%</span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted border border-border/40">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground leading-tight">
                {stepMessage || "Preparing geometric slices and expressions..."}
              </p>
            </div>
          </div>
        ) : error ? (
          /* Inline Generation Error State */
          <div className="my-auto flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
            </div>
            <h4 className="font-heading text-sm font-semibold text-foreground">
              Generation Encountered an Issue
            </h4>
            <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
              {error}
            </p>
            {onClearError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearError}
                className="mt-2 text-xs"
              >
                Dismiss & Resume Preview
              </Button>
            )}
          </div>
        ) : (
          /* Live Interactive Mascot */
          <div className="relative my-auto flex flex-col items-center justify-center py-4">
            <Mascot
              ref={mascotRef}
              key={`${directions}-${size}`}
              size={size}
              label={label}
              directions={directions}
              reactions={reactions}
              goToSleep={goToSleep}
              idleBlink={idleBlink}
              followPointer={followPointer}
              onLook={(look) => setCurrentLook(look)}
              className="cursor-pointer transition-transform duration-150 active:scale-95"
            />
          </div>
        )}

        {/* Viewport Footer: Highlighted Download Button & Physics Metrics */}
        <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs">
          {/* Highlighted Primary Download Button */}
          {onScrollToDownload ? (
            <button
              type="button"
              onClick={onScrollToDownload}
              className="flex items-center gap-1.5 rounded-xl border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 shadow-2xs group"
              title="Jump to Download & Asset Integration"
            >
              <HugeiconsIcon
                icon={Download01Icon}
                className="size-3.5 text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-primary-foreground"
              />
              <span>Download & Assets</span>
            </button>
          ) : (
            <div />
          )}

          {/* Metrics Pill Bar */}
          {metrics && (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
              <Badge variant={metrics.shift <= 2 ? "outline" : "destructive"} className="text-[10px]">
                Shift: {metrics.shift}px
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Palette: {metrics.paletteMatch}%
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Shoulder: {metrics.widthChange}%
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT RAIL: Live Inspection Deck (Reactions & Glances) */}
      <div className="flex flex-col justify-between p-4 sm:p-5 gap-5 bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <span className="text-xs font-semibold tracking-tight text-foreground">
            Expressions & Glances
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            9 Angles · 9 Emotions
          </span>
        </div>

        {/* Emotion Trigger Grid */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Trigger Reaction
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {REACTIONS.map((item) => {
              const isActive = activeReactionId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => triggerReaction(item.id)}
                  disabled={isGenerating}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition-all active:scale-[0.96]",
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/40"
                      : "border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/40",
                    isGenerating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    className={cn(
                      "size-3 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Glance Angle Compass */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Glance Angle
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{currentLook}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 mx-auto w-full max-w-[130px] rounded-lg border border-border/60 bg-muted/20 p-1">
            {COMPASS_GRID.map((item) => {
              const isSelected = currentLook === item.look
              return (
                <button
                  key={item.look}
                  type="button"
                  onClick={() => triggerGlance(item.look)}
                  disabled={isGenerating}
                  title={item.label}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border transition-all active:scale-90",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                      : "border-border/30 bg-background text-muted-foreground hover:border-border hover:text-foreground",
                    isGenerating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} className="size-3" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Behavior & Size Toggles */}
        <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
          <div className="grid grid-cols-3 gap-1.5">
            {/* Follow Pointer */}
            <button
              type="button"
              onClick={() => setFollowPointer((prev) => !prev)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs transition-all active:scale-[0.96] cursor-pointer",
                followPointer
                  ? "border-primary/40 bg-primary/5 text-foreground shadow-2xs"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={Cursor01Icon} className="size-3 text-primary" />
                <span className="text-[10px] sm:text-[11px] font-medium">Follow</span>
              </div>
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  followPointer ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            </button>

            {/* Idle Blink */}
            <button
              type="button"
              onClick={() => setIdleBlink((prev) => !prev)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs transition-all active:scale-[0.96] cursor-pointer",
                idleBlink
                  ? "border-primary/40 bg-primary/5 text-foreground shadow-2xs"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={EyeIcon} className="size-3 text-primary" />
                <span className="text-[10px] sm:text-[11px] font-medium">Blink</span>
              </div>
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  idleBlink ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            </button>

            {/* Sleep Mode */}
            <button
              type="button"
              onClick={() => setGoToSleep((prev) => !prev)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs transition-all active:scale-[0.96] cursor-pointer",
                goToSleep
                  ? "border-primary/40 bg-primary/10 text-primary shadow-2xs font-semibold ring-1 ring-primary/40"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={Moon02Icon} className="size-3 text-primary" />
                <span className="text-[10px] sm:text-[11px] font-medium">Sleep</span>
              </div>
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  goToSleep ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                )}
              />
            </button>
          </div>

          {/* Size Pills */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1">
            <span className="text-[10px] font-medium text-muted-foreground">Size</span>
            <div className="flex gap-1">
              {[160, 200, 240, 280].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors active:scale-[0.96] transition-transform duration-100 ease-out",
                    size === s
                      ? "bg-foreground text-background shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
