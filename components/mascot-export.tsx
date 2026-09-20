"use client"

import { useState } from "react"
import {
  CheckmarkCircle01Icon,
  Copy01Icon,
  Download01Icon,
  Folder01Icon,
  Image01Icon,
  Link01Icon,
  Package01Icon,
  SourceCodeIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

type MascotExportProps = {
  label: string
  slug: string
  directions: string
  reactions: string
}

type TabType = "cli" | "react" | "html" | "urls" | "spec"

export function MascotExport({
  label,
  slug,
  directions,
  reactions,
}: MascotExportProps) {
  const [tab, setTab] = useState<TabType>("cli")
  const [copied, setCopied] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [pkgRunner, setPkgRunner] = useState<"npx" | "pnpm dlx" | "bunx">("npx")
  const [cliFramework, setCliFramework] = useState<
    "nextjs" | "react" | "vue" | "svelte" | "angular" | "astro" | "html"
  >("nextjs")

  const cleanSlug = (slug || label || "mascot")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")

  const cliCode = `${pkgRunner} mascot-taqui add ${cleanSlug} --${cliFramework}`

  const reactCode = `import { Mascot } from "mascot-taqui/react"

export function MyMascot() {
  return (
    <Mascot
      label="${label}"
      directions="${directions}"
      reactions="${reactions}"
      size={180}
      followPointer
      idleBlink
      onLook={(look) => console.log("Looking:", look)}
    />
  )
}`

  const htmlCode = `<!-- Vanilla HTML / Web Component -->
<script type="module" src="https://esm.sh/mascot-taqui"></script>

<mascot-taqui
  label="${label}"
  directions="${directions}"
  reactions="${reactions}"
  size="180"
  follow-pointer
  idle-blink
></mascot-taqui>`

  const urlsCode = `// Direct High-Resolution Atlas URLs
export const MASCOT_ASSETS = {
  name: "${label}",
  slug: "${cleanSlug}",
  directions: "${directions}",
  reactions: "${reactions}",
  format: "webp",
  resolution: "1080x1080",
  tileResolution: "360x360",
}`

  const specCode = `// Sprite Atlas Technical Specification
Atlas Format: Google WebP (Lossless Alpha Cutout)
Canvas Size:  1080px × 1080px
Tile Count:   9 tiles per sheet (3 columns × 3 rows)
Tile Size:    360px × 360px per glance / expression

Directions Matrix (Col, Row):
  [0,0] Up-Left   [1,0] Up    [2,0] Up-Right
  [0,1] Left      [1,1] Center[2,1] Right
  [0,2] Down-Left [1,2] Down  [2,2] Down-Right

Reactions Matrix (Col, Row):
  [0,0] Heart     [1,0] Sparkle   [2,0] Wink
  [0,1] Surprise  [1,1] Delight   [2,1] Bashful
  [0,2] Sleepy    [1,2] Dizzy     [2,2] Blink`

  const currentCode =
    tab === "cli"
      ? cliCode
      : tab === "react"
      ? reactCode
      : tab === "html"
      ? htmlCode
      : tab === "urls"
      ? urlsCode
      : specCode

  async function handleCopy(textToCopy = currentCode, key = "main") {
    try {
      await navigator.clipboard.writeText(textToCopy)
      if (key === "main") {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 2000)
      }
      toast.add({
        type: "success",
        title: "Copied to clipboard",
        description: "Ready to paste into your codebase.",
      })
    } catch {
      toast.add({
        type: "error",
        title: "Copy failed",
        description: "Clipboard access was denied.",
      })
    }
  }

  function handleDownload(url: string, suffix: "directions" | "reactions") {
    const a = document.createElement("a")
    a.href = url
    a.download = `${cleanSlug}-${suffix}.webp`
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.add({
      type: "success",
      title: "Download Started",
      description: `Saving ${cleanSlug}-${suffix}.webp`,
    })
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
            <HugeiconsIcon icon={SourceCodeIcon} className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold tracking-tight text-foreground">
                Developer Integration & Assets
              </h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Production Ready
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Integrate <strong className="text-foreground">{label}</strong> into any React, Next.js, or HTML site, or download raw 360° sprite sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5">
            <HugeiconsIcon icon={SparklesIcon} className="size-3 text-primary" />
            WebP Alpha
          </span>
          <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5">
            1080 × 1080 px
          </span>
        </div>
      </div>

      {/* 2. DIRECT ASSET CARDS (DETAILED DOWNLOAD CARDS) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Directions Atlas Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-muted/15 p-4 transition-all hover:border-border hover:bg-muted/25">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-background border border-border/80 shadow-2xs">
                <HugeiconsIcon icon={Image01Icon} className="size-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-sm font-semibold text-foreground">
                  Directions Sprite Sheet
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {cleanSlug}-directions.webp
                </span>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
              9 Head Angles
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Full 3×3 grid of 360° gaze directions with center anchor. Anti-aliased alpha transparency and edge-fade matting.
          </p>

          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleDownload(directions, "directions")}
              className="flex-1 h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
              <span>Download Directions</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(directions, "dir-url")}
              className="h-8 gap-1 rounded-xl text-xs"
              title="Copy Asset CDN URL"
            >
              <HugeiconsIcon
                icon={copiedKey === "dir-url" ? CheckmarkCircle01Icon : Link01Icon}
                className={cn("size-3.5", copiedKey === "dir-url" && "text-emerald-500")}
              />
              <span className="hidden sm:inline">Copy URL</span>
            </Button>
          </div>
        </div>

        {/* Reactions Atlas Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-muted/15 p-4 transition-all hover:border-border hover:bg-muted/25">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-background border border-border/80 shadow-2xs">
                <HugeiconsIcon icon={SparklesIcon} className="size-5 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-sm font-semibold text-foreground">
                  Reactions Sprite Sheet
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {cleanSlug}-reactions.webp
                </span>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
              9 Expressions
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Full 3×3 grid of emotional reactions (Heart, Sparkle, Wink, Surprise, Delight, Bashful, Sleepy, Dizzy, Blink).
          </p>

          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleDownload(reactions, "reactions")}
              className="flex-1 h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-2xs"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
              <span>Download Reactions</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(reactions, "react-url")}
              className="h-8 gap-1 rounded-xl text-xs"
              title="Copy Asset CDN URL"
            >
              <HugeiconsIcon
                icon={copiedKey === "react-url" ? CheckmarkCircle01Icon : Link01Icon}
                className={cn("size-3.5", copiedKey === "react-url" && "text-emerald-500")}
              />
              <span className="hidden sm:inline">Copy URL</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. CODE SNIPPET INTEGRATION ENGINE */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Integration Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setTab("cli")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                tab === "cli"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={Package01Icon} className="size-3.5" />
              <span>CLI Add</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("react")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                tab === "react"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              React / Next.js
            </button>
            <button
              type="button"
              onClick={() => setTab("html")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                tab === "html"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              HTML Web Component
            </button>
            <button
              type="button"
              onClick={() => setTab("urls")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                tab === "urls"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Asset URLs
            </button>
            <button
              type="button"
              onClick={() => setTab("spec")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                tab === "spec"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sprite Spec
            </button>
          </div>

          {/* Package Runner & Framework Toggles (When on CLI tab) */}
          {tab === "cli" && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Runner:</span>
                {(["npx", "pnpm dlx", "bunx"] as const).map((runner) => (
                  <button
                    key={runner}
                    type="button"
                    onClick={() => setPkgRunner(runner)}
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-colors",
                      pkgRunner === runner
                        ? "bg-foreground text-background shadow-2xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {runner}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px]">Framework:</span>
                {(
                  [
                    { id: "nextjs", label: "Next.js" },
                    { id: "react", label: "React" },
                    { id: "vue", label: "Vue" },
                    { id: "svelte", label: "Svelte" },
                    { id: "astro", label: "Astro" },
                    { id: "angular", label: "Angular" },
                    { id: "html", label: "HTML" },
                  ] as const
                ).map((fw) => (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => setCliFramework(fw.id)}
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-colors",
                      cliFramework === fw.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Output Block */}
        <div className="relative flex items-center justify-between overflow-x-auto rounded-xl border border-border/80 bg-muted/20 p-4 font-mono text-xs">
          <pre className="text-foreground select-all whitespace-pre leading-relaxed pr-24 font-mono text-[11px] sm:text-xs">
            {currentCode}
          </pre>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleCopy()}
            className="absolute top-3.5 right-3.5 shrink-0 gap-1.5 rounded-xl shadow-xs"
          >
            <HugeiconsIcon
              icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
              className={cn("size-3.5", copied && "text-emerald-400")}
            />
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>

        {tab === "cli" && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">CLI Action:</span>
            <span>
              Copies <strong>{cleanSlug}</strong> direction & reaction WebP sprite sheets into your static directory, generates a pre-bound <strong>&lt;Mascot /&gt;</strong> component, and installs <code className="font-mono text-primary">mascot-taqui</code>.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
