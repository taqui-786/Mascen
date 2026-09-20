"use client"

import { useState, useRef, useEffect, useCallback, useId, type ComponentProps } from "react"
import {
  Download01Icon,
  Copy01Icon,
  Tick02Icon,
  PaintBoardIcon,
  Settings02Icon,
  Maximize02Icon,
  SparklesIcon,
  Image01Icon,
  SourceCodeIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import {
  MASCEN_FOUNDER_LOGO,
  MASCEN_CURSOR_LOGO,
  type MascotExample,
} from "@/lib/examples"
import { toast } from "@/components/ui/toast"

import { LogoGeneratorForm } from "@/components/logo-generator-form"

interface MascotLogoStudioProps {
  mascot: MascotExample
  singleImage?: boolean
  generatorProps: ComponentProps<typeof LogoGeneratorForm>
  onSelectLogo?: (logo: {
    id: string
    title: string
    prompt: string
    image: string
    style?: string
    tagline?: string
  }) => void
}

type BgType = "transparent" | "solid" | "gradient"
type RadiusOption = "none" | "sm" | "md" | "lg" | "pill" | "full"
type ExportFormat = "png" | "webp" | "jpeg" | "svg"
type LockupLayout = "icon-only" | "stacked" | "horizontal"
type FontChoice = "sans" | "serif" | "mono" | "rounded"
type StudioView = "editor" | "mockups" | "code"
type StageBackdrop = "studio" | "dark" | "light" | "grid"

const BADGE_RADIUS_CSS: Record<RadiusOption, string> = {
  none: "0px",
  sm: "12%",
  md: "22%",
  lg: "32%",
  pill: "44%",
  full: "9999px",
}

const COLOR_PRESETS = [
  "#09090b",
  "#ffffff",
  "#27272a",
  "#1e293b",
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#e11d48",
  "#ea580c",
  "#16a34a",
  "#f59e0b",
  "#06b6d4",
  "#db2777",
  "#4f46e5",
  "#fbcfe8",
  "#fed7aa",
]

const GRADIENT_PRESETS = [
  { name: "Sunset", value: "linear-gradient(135deg, #f97316, #e11d48)" },
  { name: "Aurora", value: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
  { name: "Emerald", value: "linear-gradient(135deg, #10b981, #047857)" },
  { name: "Midnight", value: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { name: "Velvet", value: "linear-gradient(135deg, #18181b, #27272a)" },
  { name: "Pastel", value: "linear-gradient(135deg, #fbcfe8, #fed7aa)" },
  { name: "Neon Cyber", value: "linear-gradient(135deg, #00f2fe, #4facfe)" },
  { name: "Warm Amber", value: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { name: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #1e3a8a)" },
  { name: "Orchid", value: "linear-gradient(135deg, #c084fc, #db2777)" },
  { name: "Forest", value: "linear-gradient(135deg, #84cc16, #166534)" },
  { name: "Peach", value: "linear-gradient(135deg, #fed7aa, #fb7185)" },
  { name: "Lavender", value: "linear-gradient(135deg, #ddd6fe, #a5b4fc)" },
  { name: "Lagoon", value: "linear-gradient(135deg, #99f6e4, #0891b2)" },
  { name: "Flame", value: "linear-gradient(135deg, #facc15, #dc2626)" },
  { name: "Graphite", value: "linear-gradient(135deg, #64748b, #0f172a)" },
]

const RESOLUTION_PRESETS = [
  { label: "256px", size: 256, desc: "Standard App Icon", tier: "Standard" },
  { label: "512px", size: 512, desc: "HD Retina & Avatar", tier: "HD" },
  { label: "1024px", size: 1024, desc: "2K Ultra HD / Print", tier: "2K" },
  { label: "2048px", size: 2048, desc: "4K Master Studio Quality", tier: "4K Master" },
]

export function MascotLogoStudio({
  mascot,
  singleImage = false,
  generatorProps,
  onSelectLogo,
}: MascotLogoStudioProps) {
  const generatorFormId = useId()
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState({ col: 1, row: 1 })
  const [source, setSource] = useState(mascot.directions)
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const [activeTab, setActiveTab] = useState<StudioView>("editor")
  const [stageBackdrop, setStageBackdrop] = useState<StageBackdrop>("studio")

  const [scale, setScale] = useState<number>(100)
  const [offsetX, setOffsetX] = useState<number>(0)
  const [offsetY, setOffsetY] = useState<number>(0)
  const [rotation, setRotation] = useState<number>(0)
  const [flipX, setFlipX] = useState<boolean>(false)

  const [bgType, setBgType] = useState<BgType>("solid")
  const [solidColor, setSolidColor] = useState<string>("#ffffff")
  const [gradient, setGradient] = useState<string>(GRADIENT_PRESETS[0].value)
  const [showChecker, setShowChecker] = useState<boolean>(true)
  const [glowEffect, setGlowEffect] = useState<boolean>(true)

  const [radius, setRadius] = useState<RadiusOption>("lg")
  const [borderWidth, setBorderWidth] = useState<number>(0)
  const [borderColor, setBorderColor] = useState<string>("#e4e4e7")

  const [brandName, setBrandName] = useState<string>(mascot.title || "Brand")
  const [tagline, setTagline] = useState<string>("Modern Mascot Studio")
  const [lockupLayout, setLockupLayout] = useState<LockupLayout>("icon-only")
  const [fontChoice, setFontChoice] = useState<FontChoice>("sans")
  const [textColor, setTextColor] = useState<string>("#09090b")

  const [outputSize, setOutputSize] = useState<number>(512)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png")
  const [qualityLevel, setQualityLevel] = useState<number>(1.0)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [copiedDataUri, setCopiedDataUri] = useState<boolean>(false)

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>("")

  if (source !== mascot.directions) {
    setSource(mascot.directions)
    setBrandName(mascot.title)
    setSelectedVariant({ col: 1, row: 1 })
  }

  const activeSheet = mascot.directions
  const activeCoord = singleImage ? { col: 0, row: 0 } : selectedVariant

  // Draw logo to canvas
  const renderLogoOnCanvas = useCallback(
    (canvas: HTMLCanvasElement, targetW: number, targetH: number, forExport = false) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = activeSheet

      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.save()
          ctx.clearRect(0, 0, targetW, targetH)
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"

          const hasText = lockupLayout !== "icon-only" && brandName.trim().length > 0

          let badgeX = 0
          let badgeY = 0
          let badgeW = targetW
          let badgeH = targetH

          if (hasText && lockupLayout === "stacked") {
            badgeW = targetW * 0.72
            badgeH = badgeW
            badgeX = (targetW - badgeW) / 2
            badgeY = targetH * 0.04
          } else if (hasText && lockupLayout === "horizontal") {
            badgeW = targetW * 0.42
            badgeH = badgeW
            badgeX = targetW * 0.06
            badgeY = (targetH - badgeH) / 2
          }

          let r = 0
          if (radius === "sm") r = badgeW * 0.12
          else if (radius === "md") r = badgeW * 0.22
          else if (radius === "lg") r = badgeW * 0.32
          else if (radius === "pill") r = badgeW * 0.44
          else if (radius === "full") r = badgeW / 2

          if (forExport || hasText) {
            ctx.beginPath()
            if (radius === "full") {
              ctx.arc(badgeX + badgeW / 2, badgeY + badgeH / 2, badgeW / 2, 0, Math.PI * 2)
            } else if (r > 0 && typeof ctx.roundRect === "function") {
              ctx.roundRect(badgeX, badgeY, badgeW, badgeH, r)
            } else {
              ctx.rect(badgeX, badgeY, badgeW, badgeH)
            }
          }

          if (bgType !== "transparent") {
            ctx.save()
            if (forExport || hasText) {
              ctx.clip()
            }

            if (bgType === "solid") {
              ctx.fillStyle = solidColor
              ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
            } else if (bgType === "gradient") {
              const match = gradient.match(/#[0-9a-fA-F]{3,8}/g)
              if (match && match.length >= 2) {
                const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH)
                grad.addColorStop(0, match[0])
                grad.addColorStop(1, match[1])
                ctx.fillStyle = grad
                ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
              } else {
                ctx.fillStyle = "#18181b"
                ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
              }
            }
            ctx.restore()
          }

          ctx.save()
          ctx.beginPath()
          if (radius === "full") {
            ctx.arc(badgeX + badgeW / 2, badgeY + badgeH / 2, badgeW / 2, 0, Math.PI * 2)
          } else if (r > 0 && typeof ctx.roundRect === "function") {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, r)
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH)
          }
          ctx.clip()

          const isSingle = singleImage
          const cellW = isSingle ? img.naturalWidth : img.naturalWidth / 3
          const cellH = isSingle ? img.naturalHeight : img.naturalHeight / 3
          const sx = isSingle ? 0 : activeCoord.col * cellW
          const sy = isSingle ? 0 : activeCoord.row * cellH

          const zoomFactor = scale / 100
          const drawW = badgeW * zoomFactor
          const drawH = badgeH * zoomFactor

          const centerX = badgeX + badgeW / 2 + (offsetX / 100) * badgeW
          const centerY = badgeY + badgeH / 2 + (offsetY / 100) * badgeH

          ctx.translate(centerX, centerY)
          if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180)
          }
          if (flipX) {
            ctx.scale(-1, 1)
          }

          ctx.drawImage(img, sx, sy, cellW, cellH, -drawW / 2, -drawH / 2, drawW, drawH)
          ctx.restore()

          if (forExport && borderWidth > 0) {
            ctx.save()
            ctx.beginPath()
            const strokeOffset = borderWidth / 2
            if (radius === "full") {
              ctx.arc(
                badgeX + badgeW / 2,
                badgeY + badgeH / 2,
                badgeW / 2 - strokeOffset,
                0,
                Math.PI * 2
              )
            } else if (r > 0 && typeof ctx.roundRect === "function") {
              ctx.roundRect(
                badgeX + strokeOffset,
                badgeY + strokeOffset,
                badgeW - borderWidth,
                badgeH - borderWidth,
                Math.max(0, r - strokeOffset)
              )
            } else {
              ctx.rect(
                badgeX + strokeOffset,
                badgeY + strokeOffset,
                badgeW - borderWidth,
                badgeH - borderWidth
              )
            }
            ctx.lineWidth = borderWidth * (targetW / 256)
            ctx.strokeStyle = borderColor
            ctx.stroke()
            ctx.restore()
          }

          if (hasText) {
            ctx.save()
            const fontStack =
              fontChoice === "serif"
                ? "Georgia, Cambria, serif"
                : fontChoice === "mono"
                  ? "ui-monospace, monospace"
                  : fontChoice === "rounded"
                    ? "'Nunito', 'Quicksand', system-ui, sans-serif"
                    : "system-ui, -apple-system, sans-serif"

            if (lockupLayout === "stacked") {
              const textY = badgeY + badgeH + targetH * 0.08
              ctx.textAlign = "center"
              ctx.fillStyle = textColor
              ctx.font = `bold ${targetW * 0.085}px ${fontStack}`
              ctx.fillText(brandName, targetW / 2, textY)

              if (tagline.trim()) {
                ctx.fillStyle = textColor + "B3"
                ctx.font = `500 ${targetW * 0.045}px ${fontStack}`
                ctx.fillText(tagline, targetW / 2, textY + targetW * 0.065)
              }
            } else if (lockupLayout === "horizontal") {
              const textX = badgeX + badgeW + targetW * 0.06
              const textY = targetH / 2 - (tagline.trim() ? targetH * 0.02 : 0)
              ctx.textAlign = "left"
              ctx.fillStyle = textColor
              ctx.font = `bold ${targetW * 0.085}px ${fontStack}`
              ctx.fillText(brandName, textX, textY)

              if (tagline.trim()) {
                ctx.fillStyle = textColor + "B3"
                ctx.font = `500 ${targetW * 0.042}px ${fontStack}`
                ctx.fillText(tagline, textX, textY + targetW * 0.065)
              }
            }
            ctx.restore()
          }

          ctx.restore()
          resolve()
        }
        img.onerror = reject
      })
    },
    [
      singleImage,
      activeSheet,
      activeCoord.col,
      activeCoord.row,
      scale,
      offsetX,
      offsetY,
      rotation,
      flipX,
      bgType,
      solidColor,
      gradient,
      radius,
      borderWidth,
      borderColor,
      brandName,
      tagline,
      lockupLayout,
      fontChoice,
      textColor,
    ]
  )

  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    renderLogoOnCanvas(canvas, 512, 512)?.then(() => {
      try {
        setCanvasDataUrl(canvas.toDataURL("image/png"))
      } catch {}
    })
  }, [renderLogoOnCanvas])

  async function handleDownload() {
    setIsExporting(true)
    try {
      const exportCanvas = document.createElement("canvas")
      exportCanvas.width = outputSize
      exportCanvas.height = outputSize

      await renderLogoOnCanvas(exportCanvas, outputSize, outputSize, true)

      if (exportFormat === "svg") {
        const dataUrl = exportCanvas.toDataURL("image/png")
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${outputSize}" height="${outputSize}" viewBox="0 0 ${outputSize} ${outputSize}" xmlns="http://www.w3.org/2000/svg">
  <title>${brandName} Mascot Logo</title>
  <image href="${dataUrl}" width="${outputSize}" height="${outputSize}" />
</svg>`
        const blob = new Blob([svgContent], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${mascot.id}-logo-${outputSize}px.svg`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const mimeType =
          exportFormat === "webp" ? "image/webp" : exportFormat === "jpeg" ? "image/jpeg" : "image/png"
        exportCanvas.toBlob(
          (blob) => {
            if (!blob) return
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${mascot.id}-logo-${outputSize}px.${exportFormat}`
            a.click()
            URL.revokeObjectURL(url)
          },
          mimeType,
          qualityLevel
        )
      }

      toast.add({
        type: "success",
        title: "Export Complete",
        description: `Exported ${outputSize}×${outputSize}px ${exportFormat.toUpperCase()} at highest fidelity.`,
      })
    } catch (err) {
      console.error("Export error:", err)
      toast.add({
        type: "error",
        title: "Export Failed",
        description: "Could not export logo asset. Please try again.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  async function handleCopyClipboard() {
    try {
      const canvas = previewCanvasRef.current
      if (!canvas) return
      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
        setCopiedDataUri(true)
        setTimeout(() => setCopiedDataUri(false), 2000)
        toast.add({
          type: "success",
          title: "Copied to Clipboard",
          description: "High-resolution PNG image copied directly to clipboard.",
        })
      })
    } catch {
      if (canvasDataUrl) {
        await navigator.clipboard.writeText(canvasDataUrl)
        setCopiedDataUri(true)
        setTimeout(() => setCopiedDataUri(false), 2000)
        toast.add({
          type: "info",
          title: "Copied Data URI",
          description: "Base64 image string copied to clipboard.",
        })
      }
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-3 shadow-2xs">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">Make Mascot Logo</h1>
          <p className="text-xs text-muted-foreground">Describe your character, choose a variant, and make it your brand.</p>
        </div>
        <button
          type="submit"
          form={generatorFormId}
          disabled={isGenerating}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <HugeiconsIcon icon={SparklesIcon} className="size-4" />
          {isGenerating ? "Creating your sheet…" : "Generate mascot logo"}
        </button>

        <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.96]",
              activeTab === "editor"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
            <span>Logo Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mockups")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.96]",
              activeTab === "mockups"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
            <span>Context Mockups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.96]",
              activeTab === "code"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={SourceCodeIcon} className="size-3.5" />
            <span>Code & Snippets</span>
          </button>
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="min-w-0" aria-label="Character description and generator options">
          <LogoGeneratorForm {...generatorProps} formId={generatorFormId} onGeneratingChange={setIsGenerating} />
        </aside>
        <div className="flex min-w-0 flex-col gap-4">
          <div className={cn("grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]", activeTab !== "editor" && "hidden")}>
        <div className="flex min-w-0 flex-col gap-4">
          <div
            className={cn(
              "relative flex min-h-[440px] w-full flex-col items-center justify-center rounded-3xl border border-border/70 p-8 shadow-inner overflow-hidden transition-colors duration-200",
              stageBackdrop === "studio" &&
                "bg-gradient-to-b from-zinc-100 via-zinc-100/90 to-zinc-200/80 dark:from-zinc-900/60 dark:via-zinc-950 dark:to-zinc-950",
              stageBackdrop === "dark" && "bg-zinc-950 text-white",
              stageBackdrop === "light" && "bg-zinc-50",
              stageBackdrop === "grid" &&
                "bg-background bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:28px_28px]"
            )}
          >
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-xl border border-border/70 bg-background/85 p-1 backdrop-blur-md shadow-xs">
              <div className="flex items-center gap-0.5 pr-1 border-r border-border/60">
                {(
                  [
                    { id: "studio", label: "Studio" },
                    { id: "dark", label: "Dark" },
                    { id: "light", label: "Light" },
                    { id: "grid", label: "Grid" },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setStageBackdrop(b.id)}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors active:scale-[0.96]",
                      stageBackdrop === b.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFlipX(!flipX)}
                title="Flip Horizontal"
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs font-medium transition-colors active:scale-[0.96]",
                  flipX ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                ⇄
              </button>
              <button
                type="button"
                onClick={() => {
                  setScale(100)
                  setOffsetX(0)
                  setOffsetY(0)
                  setRotation(0)
                  setFlipX(false)
                }}
                title="Reset Transform"
                className="flex size-7 items-center justify-center rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors active:scale-[0.96]"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={() => setShowChecker(!showChecker)}
                title="Toggle Checkerboard"
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs transition-colors active:scale-[0.96]",
                  showChecker ? "text-primary" : "text-muted-foreground"
                )}
              >
                ▦
              </button>
              <button
                type="button"
                onClick={() => setGlowEffect(!glowEffect)}
                title="Toggle Ambient Glow"
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs transition-colors active:scale-[0.96]",
                  glowEffect ? "text-amber-500" : "text-muted-foreground"
                )}
              >
                ✧
              </button>
            </div>

            <div className="relative z-10 flex w-full min-w-0 flex-col items-center gap-5">
              <div className="group relative w-full max-w-80">
                {glowEffect && bgType !== "transparent" && (
                  <div
                    className="pointer-events-none absolute -inset-4 opacity-35 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
                    style={{
                      borderRadius: BADGE_RADIUS_CSS[radius],
                      background: bgType === "solid" ? solidColor : gradient,
                    }}
                  />
                )}

                <div
                  className={cn(
                    "relative transition-[transform,border-radius,box-shadow] duration-200",
                    bgType === "transparent"
                      ? [
                          showChecker &&
                            "bg-[radial-gradient(#9ca3af_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#4b5563_1.5px,transparent_1.5px)] bg-[size:12px_12px]",
                          "filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)]",
                        ]
                      : "shadow-xl shadow-black/15"
                  )}
                  style={{
                    borderRadius: BADGE_RADIUS_CSS[radius],
                    overflow: "hidden",
                    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                  }}
                >
                  <canvas
                    ref={previewCanvasRef}
                    width={512}
                    height={512}
                    aria-label="Logo preview. Drag to move; use Scale and Position sliders to resize or move with the keyboard."
                    onPointerDown={(e) => {
                      if (!e.isPrimary || e.button !== 0) return
                      e.currentTarget.setPointerCapture(e.pointerId)
                      dragRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, offsetX, offsetY }
                    }}
                    onPointerMove={(e) => {
                      const drag = dragRef.current
                      if (!drag || drag.pointerId !== e.pointerId) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const badgeRatio = lockupLayout === "icon-only" || !brandName.trim() ? 1 : lockupLayout === "stacked" ? 0.72 : 0.42
                      setOffsetX(Math.max(-50, Math.min(50, drag.offsetX + (e.clientX - drag.x) / (rect.width * badgeRatio) * 100)))
                      setOffsetY(Math.max(-50, Math.min(50, drag.offsetY + (e.clientY - drag.y) / (rect.height * badgeRatio) * 100)))
                    }}
                    onPointerUp={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
                      dragRef.current = null
                    }}
                    onPointerCancel={() => { dragRef.current = null }}
                    onLostPointerCapture={() => { dragRef.current = null }}
                    className="block aspect-square w-full touch-none cursor-grab active:cursor-grabbing"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md shadow-2xs">
                <span className="font-semibold text-foreground">
                  {radius === "full"
                    ? "Circle"
                    : radius === "lg"
                      ? "Squircle"
                      : radius === "pill"
                        ? "Pill"
                        : radius === "md"
                          ? "Smooth"
                          : radius === "sm"
                            ? "Soft"
                            : "Square"}
                </span>
                <span>•</span>
                <span>
                  {bgType === "transparent"
                    ? "Transparent Cutout"
                    : bgType === "solid"
                      ? "Solid Color"
                      : "Gradient"}
                </span>
                <span>•</span>
                <span className="font-mono tabular-nums">{outputSize}×{outputSize}px</span>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">Drag to move. Resize with the Scale slider.</p>
            </div>
          </div>

          <section
            aria-label={singleImage ? "Selected Logo Mark" : "9 Exploration Variants"}
            className="flex min-w-0 flex-col gap-3.5 rounded-3xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {singleImage ? "Selected Logo Mark" : "9 Exploration Variants"}
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {singleImage ? "Single Asset" : "3×3 Grid"}
                </span>
              </div>

              {onSelectLogo && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-muted-foreground font-medium">Walkthrough:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectLogo({
                        id: MASCEN_FOUNDER_LOGO.id,
                        title: MASCEN_FOUNDER_LOGO.title,
                        prompt: MASCEN_FOUNDER_LOGO.prompt,
                        image: MASCEN_FOUNDER_LOGO.image,
                        style: "modern-3d",
                      })
                    }
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all border cursor-pointer",
                      mascot.id === "mascen-founder"
                        ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/20"
                        : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    3D Mascot
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectLogo({
                        id: MASCEN_CURSOR_LOGO.id,
                        title: MASCEN_CURSOR_LOGO.title,
                        prompt: MASCEN_CURSOR_LOGO.prompt,
                        image: MASCEN_CURSOR_LOGO.image,
                        style: "modern-3d",
                      })
                    }
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all border cursor-pointer",
                      mascot.id === "mascen-cursor" || mascot.id === "mascen"
                        ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/20"
                        : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Cursor Mark
                  </button>
                </div>
              )}
            </div>

            <div
              className={cn(
                "grid gap-2.5 sm:gap-3",
                singleImage ? "grid-cols-1 max-w-44 mx-auto" : "grid-cols-3"
              )}
            >
              {Array.from({ length: singleImage ? 1 : 9 }, (_, index) => {
                const col = index % 3
                const row = Math.floor(index / 3)
                const isCurrent = activeCoord.col === col && activeCoord.row === row
                return (
                  <button
                    key={index}
                    type="button"
                    aria-label={singleImage ? "Select logo" : `Select variant ${index + 1}`}
                    aria-pressed={isCurrent}
                    onClick={() => setSelectedVariant({ col, row })}
                    className={cn(
                      "group relative aspect-square w-full rounded-2xl border bg-card/80 p-2 flex items-center justify-center transition-all cursor-pointer overflow-hidden",
                      isCurrent
                        ? "border-primary ring-2 ring-primary/40 bg-primary/5 shadow-xs scale-102"
                        : "border-border/70 hover:border-primary/50 hover:bg-muted/40 hover:scale-101"
                    )}
                  >
                    <div
                      className="size-full bg-no-repeat transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(${JSON.stringify(activeSheet)})`,
                        backgroundSize: singleImage ? "100% 100%" : "300% 300%",
                        backgroundPosition: `${col * 50}% ${row * 50}%`,
                      }}
                    />
                    {!singleImage && (
                      <span
                        className={cn(
                          "absolute top-2 left-2 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold backdrop-blur-md transition-colors",
                          isCurrent
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-background/80 text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        V{index + 1}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
          <aside aria-label="Logo tools" className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
              <h3 className="text-xs font-semibold text-foreground">Scale & Position</h3>
              <div className="flex flex-col gap-2">
                {([
                  { label: "Horizontal position", value: offsetX, setValue: setOffsetX },
                  { label: "Vertical position", value: offsetY, setValue: setOffsetY },
                ]).map((control) => (
                  <label key={control.label} className="flex flex-col gap-2 text-[11px] text-muted-foreground">
                    <span className="flex justify-between gap-2">
                      {control.label}
                      <span className="font-mono tabular-nums">{Math.round(control.value)}%</span>
                    </span>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={control.value}
                      onChange={(e) => control.setValue(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                  </label>
                ))}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Scale Zoom:</span>
                  <span className="font-mono tabular-nums font-medium text-foreground">{scale}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={140}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-muted-foreground">Rotation:</span>
                  <span className="font-mono tabular-nums font-medium text-foreground">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <HugeiconsIcon icon={PaintBoardIcon} className="size-4 text-primary" />
                  <span>Background</span>
                </div>

                <div className="flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setBgType("transparent")}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors active:scale-[0.96]",
                      bgType === "transparent" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgType("solid")}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors active:scale-[0.96]",
                      bgType === "solid" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgType("gradient")}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors active:scale-[0.96]",
                      bgType === "gradient" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Grad
                  </button>
                </div>
              </div>

              {bgType === "transparent" ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">Transparent Cutout</span>
                  <span className="text-[11px] text-muted-foreground">
                    No background surface. The mascot floats with clean alpha transparency.
                  </span>
                </div>
              ) : bgType === "solid" ? (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSolidColor(color)}
                        className={cn(
                          "size-7 rounded-lg border border-black/10 dark:border-white/10 transition-transform active:scale-[0.96]",
                          solidColor === color && "ring-2 ring-primary ring-offset-1"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      className="size-8 cursor-pointer rounded-lg border border-border bg-transparent"
                    />
                    <input
                      type="text"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {GRADIENT_PRESETS.map((grad) => (
                    <button
                      key={grad.name}
                      type="button"
                      onClick={() => setGradient(grad.value)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border border-border/40 p-2 text-center transition-[transform,box-shadow] active:scale-[0.96]",
                        gradient === grad.value && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ background: grad.value }}
                    >
                      <span className="text-[11px] font-semibold text-white drop-shadow-md">
                        {grad.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={Settings02Icon} className="size-4 text-primary" />
                <span>Badge Framing</span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground">Badge Shape:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "none", label: "Square" },
                      { id: "sm", label: "Soft (12%)" },
                      { id: "md", label: "Smooth (22%)" },
                      { id: "lg", label: "Squircle" },
                      { id: "pill", label: "Pill" },
                      { id: "full", label: "Circle" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRadius(opt.id)}
                      className={cn(
                        "rounded-xl border py-1.5 text-center text-[11px] font-medium transition-[background-color,border-color,transform] active:scale-[0.96]",
                        radius === opt.id
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold"
                          : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Border Outline:</span>
                  <span className="font-mono tabular-nums font-medium text-foreground">{borderWidth}px</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 4].map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => setBorderWidth(width)}
                      className={cn(
                        "rounded-lg border py-1 text-center text-[10px] font-medium transition-colors active:scale-[0.96]",
                        borderWidth === width
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border/80 bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {width === 0 ? "None" : `${width}px`}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between text-[11px] text-muted-foreground">
                Border color
                <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="size-8 cursor-pointer rounded-lg border border-border bg-transparent" />
              </label>
            </div>

            <details className="flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
              <summary className="cursor-pointer text-xs font-semibold text-foreground">Brand typography</summary>
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                  Layout
                  <select value={lockupLayout} onChange={(e) => setLockupLayout(e.target.value as LockupLayout)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground">
                    <option value="icon-only">Icon only</option>
                    <option value="stacked">Stacked</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                  Brand name
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-xs text-foreground" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                  Tagline
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-xs text-foreground" />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                  Font
                  <select value={fontChoice} onChange={(e) => setFontChoice(e.target.value as FontChoice)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground">
                    <option value="sans">Sans</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Mono</option>
                    <option value="rounded">Rounded</option>
                  </select>
                </label>
                <label className="flex items-center justify-between text-[11px] text-muted-foreground">
                  Text color
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="size-8 cursor-pointer rounded-lg border border-border bg-transparent" />
                </label>
              </div>
            </details>
            <div className="flex flex-col gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={Maximize02Icon} className="size-4 text-primary" />
                <span>Export</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {RESOLUTION_PRESETS.map((preset) => {
                  const isSelected = outputSize === preset.size
                  return (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => setOutputSize(preset.size)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-2 text-left transition-[background-color,border-color,transform] active:scale-[0.96]",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                          : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-mono tabular-nums text-xs font-bold text-foreground">
                          {preset.label}
                        </span>
                        <span className="text-[9px] font-semibold uppercase text-primary">
                          {preset.tier}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {preset.desc}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground">Asset Format:</span>
                <div className="grid grid-cols-4 gap-1">
                  {(["png", "webp", "jpeg", "svg"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={cn(
                        "rounded-lg border py-1 text-center text-[10px] font-bold uppercase transition-colors active:scale-[0.96]",
                        exportFormat === fmt
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/80 bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Fidelity:</span>
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    {Math.round(qualityLevel * 100)}% ({qualityLevel === 1 ? "Lossless" : "Balanced"})
                  </span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.0}
                  step={0.05}
                  value={qualityLevel}
                  onChange={(e) => setQualityLevel(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <HugeiconsIcon icon={Download01Icon} className="size-4" />
                  <span>{isExporting ? "Rendering..." : `Download ${exportFormat.toUpperCase()} (${outputSize}px)`}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  <HugeiconsIcon icon={copiedDataUri ? Tick02Icon : Copy01Icon} className={cn("size-4", copiedDataUri && "text-emerald-500")} />
                  <span>{copiedDataUri ? "Copied!" : "Copy Image"}</span>
                </button>
              </div>
            </div>
          </aside>
      </div>
      {activeTab === "mockups" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <span className="text-xs font-semibold text-foreground">Mobile App Icon Context</span>
            <div className="relative flex aspect-9/16 w-56 flex-col items-center justify-between rounded-4xl border-4 border-zinc-800 bg-linear-to-b from-zinc-900 to-black p-4 shadow-2xl">
              <div className="h-4 w-20 rounded-full bg-zinc-950 shadow-inner" />

              <div className="grid grid-cols-3 gap-4 w-full pt-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="size-11 rounded-xl bg-blue-500 shadow-sm" />
                  <span className="text-[9px] text-zinc-400">Mail</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="size-11 overflow-hidden rounded-xl shadow-lg ring-2 ring-primary/60">
                    {canvasDataUrl ? (
                      <img src={canvasDataUrl} alt="Logo" className="size-full object-cover" />
                    ) : (
                      <div className="size-full bg-primary" />
                    )}
                  </div>
                  <span className="text-[9px] font-semibold text-white line-clamp-1">{brandName}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="size-11 rounded-xl bg-emerald-500 shadow-sm" />
                  <span className="text-[9px] text-zinc-400">Photos</span>
                </div>
              </div>

              <div className="flex w-full items-center justify-around rounded-2xl bg-zinc-800/80 p-2.5 backdrop-blur-md">
                <div className="size-9 rounded-xl bg-green-500" />
                <div className="size-9 rounded-xl bg-blue-600" />
                <div className="size-9 rounded-xl bg-zinc-700" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <span className="text-xs font-semibold text-foreground">Browser Favicon Context</span>
            <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-md">
              <div className="flex items-center gap-2 border-b border-border/70 bg-card px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-400" />
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-1 shadow-2xs">
                  {canvasDataUrl && (
                    <img src={canvasDataUrl} alt="Favicon" className="size-4 rounded-sm object-cover" />
                  )}
                  <span className="text-xs font-medium text-foreground">{brandName} App</span>
                </div>
              </div>
              <div className="flex h-40 items-center justify-center bg-background/50 p-6 text-center">
                <span className="text-xs text-muted-foreground">Crisp 16px - 32px Favicon clarity</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <span className="text-xs font-semibold text-foreground">Social Profile Avatar</span>
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="size-14 overflow-hidden rounded-full border-2 border-primary shadow-md">
                  {canvasDataUrl ? (
                    <img src={canvasDataUrl} alt="Avatar" className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-primary" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-foreground">{brandName}</span>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5 text-blue-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">@{brandName.toLowerCase().replace(/\s+/g, "")}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{tagline || "Official mascot brand identity."}</p>
            </div>
          </div>
        </div>
      ) : activeTab === "code" ? (
        <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Embeddable Code & Integrations</h3>
              <p className="text-xs text-muted-foreground">
                Copy ready-to-use snippets for React components, raw CSS, or data URIs.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>React Component Snippet:</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`<img src="${canvasDataUrl || mascot.directions}" alt="${brandName} Logo" width={${outputSize}} height={${outputSize}} className="rounded-2xl shadow-lg" />`)
                  toast.add({ type: "success", title: "Copied Snippet", description: "JSX code copied to clipboard." })
                }}
                className="text-xs text-primary hover:underline"
              >
                Copy JSX
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-border/70 bg-muted/40 p-4 font-mono text-xs text-foreground">
              {`<img
  src="${canvasDataUrl ? "[data-uri-exported-image]" : mascot.directions}"
  alt="${brandName} Logo"
  width={${outputSize}}
  height={${outputSize}}
  className="${radius === "full" ? "rounded-full" : radius === "lg" ? "rounded-2xl" : "rounded-lg"} shadow-lg"
/>`}
            </pre>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>CSS Background Specification:</span>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-border/70 bg-muted/40 p-4 font-mono text-xs text-foreground">
              {`background: ${bgType === "solid" ? solidColor : gradient};\nborder-radius: ${BADGE_RADIUS_CSS[radius]};\nborder: ${borderWidth}px solid ${borderColor};`}
            </pre>
          </div>
        </div>
      ) : null}
        </div>
      </div>
    </div>
  )
}
