"use client"

import { useState, useRef, useEffect } from "react"
import {
  Download01Icon,
  Copy01Icon,
  Tick02Icon,
  PaintBoardIcon,
  Settings02Icon,
  Maximize02Icon,
  Compass01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type { MascotExample } from "@/lib/examples"

interface MascotLogoStudioProps {
  mascot: MascotExample
}

type Angle = {
  id: number
  label: string
  col: number
  row: number
}

const ANGLES: Angle[] = [
  { id: 0, label: "Up Left", col: 0, row: 0 },
  { id: 1, label: "Up", col: 1, row: 0 },
  { id: 2, label: "Up Right", col: 2, row: 0 },
  { id: 3, label: "Left", col: 0, row: 1 },
  { id: 4, label: "Center", col: 1, row: 1 },
  { id: 5, label: "Right", col: 2, row: 1 },
  { id: 6, label: "Down Left", col: 0, row: 2 },
  { id: 7, label: "Down", col: 1, row: 2 },
  { id: 8, label: "Down Right", col: 2, row: 2 },
]

const REACTIONS = [
  { id: 0, label: "Serene", note: "Calm closed arcs", col: 0, row: 0 },
  { id: 1, label: "Love", note: "Heart floating", col: 1, row: 0 },
  { id: 2, label: "Sparkle", note: "Stars floating", col: 2, row: 0 },
  { id: 3, label: "Gasp", note: "Surprised round eyes", col: 0, row: 1 },
  { id: 4, label: "Starstruck", note: "Star eyes & grin", col: 1, row: 1 },
  { id: 5, label: "Blush", note: "Rosy warm cheeks", col: 2, row: 1 },
  { id: 6, label: "Sleepy", note: "Zzz floating", col: 0, row: 2 },
  { id: 7, label: "Dizzy", note: "Spiral swirl eyes", col: 1, row: 2 },
  { id: 8, label: "Grin", note: "Joyful wide grin", col: 2, row: 2 },
]

type BgType = "transparent" | "solid" | "gradient"
type RadiusOption = "none" | "sm" | "md" | "lg" | "full"

const COLOR_PRESETS = [
  "#09090b", // Zinc 950
  "#ffffff", // Pure White
  "#27272a", // Charcoal
  "#1e293b", // Slate
  "#0f766e", // Teal
  "#2563eb", // Royal Blue
  "#7c3aed", // Violet
  "#e11d48", // Rose
  "#ea580c", // Amber Orange
  "#16a34a", // Emerald
]

const GRADIENT_PRESETS = [
  { name: "Sunset", value: "linear-gradient(135deg, #f97316, #e11d48)" },
  { name: "Aurora", value: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
  { name: "Emerald", value: "linear-gradient(135deg, #10b981, #047857)" },
  { name: "Midnight", value: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { name: "Velvet", value: "linear-gradient(135deg, #18181b, #27272a)" },
  { name: "Pastel", value: "linear-gradient(135deg, #fbcfe8, #fed7aa)" },
]

const SIZE_PRESETS = [
  { label: "64px", size: 64, desc: "Icon" },
  { label: "128px", size: 128, desc: "Badge" },
  { label: "256px", size: 256, desc: "Avatar" },
  { label: "512px", size: 512, desc: "HD Logo" },
]

export function MascotLogoStudio({ mascot }: MascotLogoStudioProps) {
  // Mode: Angle (directions sheet) or Reaction (reactions sheet)
  const [sheetType, setSheetType] = useState<"direction" | "reaction">("direction")
  const [selectedAngle, setSelectedAngle] = useState<number>(4) // 4 = Center
  const [selectedReaction, setSelectedReaction] = useState<number>(4) // 4 = Starstruck

  // Background state
  const [bgType, setBgType] = useState<BgType>("solid")
  const [solidColor, setSolidColor] = useState<string>("#18181b")
  const [gradient, setGradient] = useState<string>(GRADIENT_PRESETS[0].value)

  // Styling state
  const [radius, setRadius] = useState<RadiusOption>("lg")
  const [scale, setScale] = useState<number>(100) // %
  const [outputSize, setOutputSize] = useState<number>(256)
  const [copied, setCopied] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Determine current active sprite sheet and coordinates
  const activeSheet = sheetType === "direction" ? mascot.directions : mascot.reactions
  const activeCoord =
    sheetType === "direction"
      ? { col: selectedAngle % 3, row: Math.floor(selectedAngle / 3) }
      : { col: selectedReaction % 3, row: Math.floor(selectedReaction / 3) }

  // Draw logo to offscreen/preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = activeSheet

    img.onload = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // 1. Calculate clipping path with border radius
      ctx.save()
      let r = 0
      if (radius === "sm") r = w * 0.12
      else if (radius === "md") r = w * 0.22
      else if (radius === "lg") r = w * 0.32
      else if (radius === "full") r = w / 2

      ctx.beginPath()
      if (radius === "full") {
        ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
      } else if (r > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(0, 0, w, h, r)
      } else if (r > 0) {
        ctx.moveTo(r, 0)
        ctx.lineTo(w - r, 0)
        ctx.quadraticCurveTo(w, 0, w, r)
        ctx.lineTo(w, h - r)
        ctx.quadraticCurveTo(w, h, w - r, h)
        ctx.lineTo(r, h)
        ctx.quadraticCurveTo(0, h, 0, h - r)
        ctx.lineTo(0, r)
        ctx.quadraticCurveTo(0, 0, r, 0)
      } else {
        ctx.rect(0, 0, w, h)
      }
      ctx.clip()

      // 2. Render background
      if (bgType === "solid") {
        ctx.fillStyle = solidColor
        ctx.fillRect(0, 0, w, h)
      } else if (bgType === "gradient") {
        const match = gradient.match(/#[0-9a-fA-F]{3,8}/g)
        if (match && match.length >= 2) {
          const grad = ctx.createLinearGradient(0, 0, w, h)
          grad.addColorStop(0, match[0])
          grad.addColorStop(1, match[1])
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, w, h)
        } else {
          ctx.fillStyle = "#18181b"
          ctx.fillRect(0, 0, w, h)
        }
      }

      // 3. Draw Character Tile from 3x3 Atlas
      const cellW = img.naturalWidth / 3
      const cellH = img.naturalHeight / 3
      const sx = activeCoord.col * cellW
      const sy = activeCoord.row * cellH

      const zoomFactor = scale / 100
      const drawW = w * zoomFactor
      const drawH = h * zoomFactor
      const dx = (w - drawW) / 2
      const dy = (h - drawH) / 2

      ctx.drawImage(img, sx, sy, cellW, cellH, dx, dy, drawW, drawH)
      ctx.restore()
    }
  }, [activeSheet, activeCoord.col, activeCoord.row, bgType, solidColor, gradient, radius, scale, outputSize])

  // Download high-resolution PNG
  async function handleDownloadPNG() {
    setIsExporting(true)
    try {
      const exportCanvas = document.createElement("canvas")
      exportCanvas.width = outputSize
      exportCanvas.height = outputSize
      const ctx = exportCanvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = activeSheet

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const w = outputSize
      const h = outputSize

      ctx.save()
      let r = 0
      if (radius === "sm") r = w * 0.12
      else if (radius === "md") r = w * 0.22
      else if (radius === "lg") r = w * 0.32
      else if (radius === "full") r = w / 2

      ctx.beginPath()
      if (radius === "full") {
        ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
      } else if (r > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(0, 0, w, h, r)
      } else if (r > 0) {
        ctx.moveTo(r, 0)
        ctx.lineTo(w - r, 0)
        ctx.quadraticCurveTo(w, 0, w, r)
        ctx.lineTo(w, h - r)
        ctx.quadraticCurveTo(w, h, w - r, h)
        ctx.lineTo(r, h)
        ctx.quadraticCurveTo(0, h, 0, h - r)
        ctx.lineTo(0, r)
        ctx.quadraticCurveTo(0, 0, r, 0)
      } else {
        ctx.rect(0, 0, w, h)
      }
      ctx.clip()

      if (bgType === "solid") {
        ctx.fillStyle = solidColor
        ctx.fillRect(0, 0, w, h)
      } else if (bgType === "gradient") {
        const match = gradient.match(/#[0-9a-fA-F]{3,8}/g)
        if (match && match.length >= 2) {
          const grad = ctx.createLinearGradient(0, 0, w, h)
          grad.addColorStop(0, match[0])
          grad.addColorStop(1, match[1])
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, w, h)
        } else {
          ctx.fillStyle = "#18181b"
          ctx.fillRect(0, 0, w, h)
        }
      }

      const cellW = img.naturalWidth / 3
      const cellH = img.naturalHeight / 3
      const sx = activeCoord.col * cellW
      const sy = activeCoord.row * cellH

      const zoomFactor = scale / 100
      const drawW = w * zoomFactor
      const drawH = h * zoomFactor
      const dx = (w - drawW) / 2
      const dy = (h - drawH) / 2

      ctx.drawImage(img, sx, sy, cellW, cellH, dx, dy, drawW, drawH)
      ctx.restore()

      exportCanvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${mascot.id}-logo-${outputSize}x${outputSize}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, "image/png")
    } catch (err) {
      console.error("Export error:", err)
    } finally {
      setIsExporting(false)
    }
  }

  // Copy PNG DataURI
  async function handleCopyDataUri() {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    await navigator.clipboard.writeText(dataUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {/* 1. HERO LOGO STAGE (ANTIGRAVITY FLOATING CANVAS) */}
      <div className="relative flex min-h-[380px] w-full flex-col items-center justify-center rounded-3xl border border-border/50 bg-radial-[at_50%_40%] from-muted/30 via-background to-background p-8 shadow-inner overflow-hidden">
        {/* Subtle grid backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-15" />

        {/* Floating Logo Badge Preview */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="group relative transition-transform duration-300 ease-out hover:scale-[1.03]">
            {/* Ambient soft glow */}
            <div
              className="absolute -inset-4 rounded-full opacity-35 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
              style={{
                background: bgType === "solid" ? solidColor : gradient,
              }}
            />

            {/* Render Canvas */}
            <canvas
              ref={previewCanvasRef}
              width={256}
              height={256}
              className={cn(
                "relative size-56 sm:size-64 shadow-2xl transition-all duration-200",
                bgType === "transparent" && "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:12px_12px]"
              )}
            />
          </div>

          {/* Quick Actions Under Stage */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-4" />
              <span>{isExporting ? "Rendering..." : `Download PNG (${outputSize}px)`}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDataUri}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted/40 active:scale-[0.98]"
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className={cn("size-4", copied && "text-emerald-500")} />
              <span>{copied ? "Copied Data URI" : "Copy Data URI"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FLOATING CONTROL DECK (INTEGRATED TOOLBAR) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* PANEL A: POSE & EXPRESSION */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <HugeiconsIcon icon={Compass01Icon} className="size-4 text-primary" />
              <span>Pose & Expression</span>
            </div>
            {/* Sheet Mode Switcher */}
            <div className="flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setSheetType("direction")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  sheetType === "direction" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Angles
              </button>
              <button
                type="button"
                onClick={() => setSheetType("reaction")}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  sheetType === "reaction" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Reactions
              </button>
            </div>
          </div>

          {sheetType === "direction" ? (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-[11px] text-muted-foreground self-start">
                Select head tilt ({ANGLES[selectedAngle].label}):
              </p>
              <div className="grid grid-cols-3 gap-1.5 w-full max-w-[190px]">
                {ANGLES.map((angle) => {
                  const isSelected = selectedAngle === angle.id
                  return (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => setSelectedAngle(angle.id)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold transition-all active:scale-95",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30"
                      )}
                      title={angle.label}
                    >
                      {angle.id === 4 ? "•" : angle.id === 0 ? "↖" : angle.id === 1 ? "↑" : angle.id === 2 ? "↗" : angle.id === 3 ? "←" : angle.id === 5 ? "→" : angle.id === 6 ? "↙" : angle.id === 7 ? "↓" : "↘"}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {REACTIONS.map((react) => {
                const isSelected = selectedReaction === react.id
                return (
                  <button
                    key={react.id}
                    type="button"
                    onClick={() => setSelectedReaction(react.id)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border p-1.5 text-center transition-all active:scale-95",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                        : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <span className="text-[11px] font-semibold">{react.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* PANEL B: BACKGROUND ENGINE */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <HugeiconsIcon icon={PaintBoardIcon} className="size-4 text-primary" />
              <span>Background</span>
            </div>
            {/* Background Type Toggle */}
            <div className="flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setBgType("transparent")}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                  bgType === "transparent" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setBgType("solid")}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                  bgType === "solid" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Color
              </button>
              <button
                type="button"
                onClick={() => setBgType("gradient")}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                  bgType === "gradient" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Grad
              </button>
            </div>
          </div>

          {bgType === "transparent" ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center">
              <span className="text-xs text-muted-foreground">Transparent backdrop. Perfect for stickers and UI badges.</span>
            </div>
          ) : bgType === "solid" ? (
            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSolidColor(color)}
                    className={cn(
                      "size-7 rounded-lg border border-border/40 transition-transform hover:scale-105 active:scale-95",
                      solidColor === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {/* Custom Hex input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  className="size-7 cursor-pointer rounded-md border border-border bg-transparent"
                />
                <input
                  type="text"
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  className="h-7 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {GRADIENT_PRESETS.map((grad) => (
                <button
                  key={grad.name}
                  type="button"
                  onClick={() => setGradient(grad.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg border border-border/40 p-2 text-center transition-all hover:scale-102 active:scale-95",
                    gradient === grad.value && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{ background: grad.value }}
                >
                  <span className="text-[10px] font-semibold text-white drop-shadow-md">{grad.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PANEL C: SHAPE & CORNER RADIUS */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <HugeiconsIcon icon={Settings02Icon} className="size-4 text-primary" />
            <span>Badge Geometry</span>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">Corner Radius:</span>
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { id: "none", label: "Square" },
                  { id: "sm", label: "Soft" },
                  { id: "md", label: "Smooth" },
                  { id: "lg", label: "Squircle" },
                  { id: "full", label: "Circle" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRadius(opt.id)}
                  className={cn(
                    "rounded-lg border py-1.5 text-center text-[10px] font-medium transition-all active:scale-95",
                    radius === opt.id
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                      : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scale / Padding Slider */}
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Mascot Zoom:</span>
              <span className="font-mono font-medium text-foreground">{scale}%</span>
            </div>
            <input
              type="range"
              min={75}
              max={135}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
          </div>
        </div>

        {/* PANEL D: EXPORT RESOLUTION */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <HugeiconsIcon icon={Maximize02Icon} className="size-4 text-primary" />
            <span>Output Resolution</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {SIZE_PRESETS.map((preset) => {
              const isSelected = outputSize === preset.size
              return (
                <button
                  key={preset.size}
                  type="button"
                  onClick={() => setOutputSize(preset.size)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all active:scale-95",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                      : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span className="font-mono text-xs font-bold text-foreground">{preset.label}</span>
                  <span className="text-[10px] text-muted-foreground">{preset.desc}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-auto flex items-center justify-between rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
            <span>Target:</span>
            <span className="font-mono font-medium text-foreground">{outputSize}×{outputSize} px PNG</span>
          </div>
        </div>
      </div>
    </div>
  )
}
