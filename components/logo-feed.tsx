"use client"

import { useState } from "react"
import {
  FavouriteIcon,
  Download01Icon,
  SparklesIcon,
  PaintBoardIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { useMascotLogos, useLikeMascotLogo } from "@/lib/queries/logos"
import type { MascotLogo } from "@/lib/db/schema"
import { toast } from "@/components/ui/toast"

interface LogoFeedProps {
  onSelectLogo?: (logo: {
    id: string
    title: string
    prompt: string
    image: string
    style?: string
    tagline?: string
  }) => void
}

const SEED_LOGOS: Array<{
  id: string
  name: string
  tagline: string
  style: string
  imageUrl: string
  likesCount: number
  prompt: string
}> = [
  {
    id: "mascen-founder",
    name: "Mascen Founder (3D Mascot)",
    tagline: "Primary Studio Identity",
    style: "modern-3d",
    imageUrl: "/logos/mascen-founder-logo-sheet.png",
    likesCount: 412,
    prompt: "stylized 3D claymorphic mascot logo portrait with styled black hair, manicured beard and mustache, warm friendly eyes, in modern tech blazer with vibrant warm burnt orange (#ca3500) collar accent",
  },
  {
    id: "mascen-brand",
    name: "Mascen (Geometric Cursor)",
    tagline: "Interactive Pointer Identity",
    style: "modern-3d",
    imageUrl: "/logos/mascen-logo-sheet.png",
    likesCount: 284,
    prompt: "sleek modern geometric brand identity combining an interactive pointer cursor with an energetic spark of motion and primary brand orange accent",
  },
  {
    id: "brewy-owl",
    name: "Brewy",
    tagline: "Artisan Coffee Roasters",
    style: "modern-3d",
    imageUrl: "/mascots/fox-directions.webp",
    likesCount: 142,
    prompt: "a cute chubby coffee owl with warm caramel feathers and round copper spectacles",
  },
  {
    id: "taqui-studio",
    name: "Taqui",
    tagline: "Cursor-Tracking Companion",
    style: "flat-vector",
    imageUrl: "/mascots/taqui-directions.webp",
    likesCount: 98,
    prompt: "a chibi man with neat beard, dark hair, and navy suit",
  },
  {
    id: "otter-tech",
    name: "Otterly",
    tagline: "Fluid Cloud Computing",
    style: "minimal-badge",
    imageUrl: "/mascots/fox-riso-directions.webp",
    likesCount: 76,
    prompt: "a joyful chibi river otter with sleek brown fur and friendly smile",
  },
  {
    id: "gearbot-ai",
    name: "GearBot",
    tagline: "Autonomous Agent Core",
    style: "cyber-esports",
    imageUrl: "/mascots/fox-ink-directions.webp",
    likesCount: 64,
    prompt: "a retro-futuristic robot with brass gears, glowing circular cyan eye",
  },
  {
    id: "pixel-fox",
    name: "VoxelFox",
    tagline: "Indie Game Studio",
    style: "vintage-retro",
    imageUrl: "/mascots/fox-pixel-directions.webp",
    likesCount: 89,
    prompt: "a 16-bit pixel art fox with bushy tail and bold outlines",
  },
]

const STYLE_FILTERS = [
  { id: "all", label: "All Styles" },
  { id: "modern-3d", label: "3D Clay" },
  { id: "flat-vector", label: "Flat Vector" },
  { id: "minimal-badge", label: "Minimal Badge" },
  { id: "vintage-retro", label: "Vintage Retro" },
  { id: "cyber-esports", label: "Cyber Esports" },
  { id: "duotone-stamp", label: "Duotone Stamp" },
]

export function LogoFeed({ onSelectLogo }: LogoFeedProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>("all")
  const { data: dbLogos = [] } = useMascotLogos()
  const likeMutation = useLikeMascotLogo()

  const combinedLogos = [
    ...dbLogos.map((l) => ({
      id: l.id,
      name: l.name,
      tagline: l.tagline || "Mascot Brand Identity",
      style: l.style,
      imageUrl: l.imageUrl,
      likesCount: l.likesCount,
      prompt: l.prompt,
    })),
    ...SEED_LOGOS.filter((s) => !dbLogos.some((d) => d.id === s.id)),
  ]

  const filteredLogos =
    selectedStyle === "all"
      ? combinedLogos
      : combinedLogos.filter((l) => l.style === selectedStyle)

  function handleLike(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    likeMutation.mutate(id)
    toast.add({
      type: "success",
      title: "Liked!",
      description: "Added to popular logo designs.",
    })
  }

  function handleDownloadDirect(e: React.MouseEvent, logo: typeof combinedLogos[0]) {
    e.stopPropagation()
    const a = document.createElement("a")
    a.href = logo.imageUrl
    a.download = `${logo.name.toLowerCase().replace(/\s+/g, "-")}-logo.png`
    a.click()
    toast.add({
      type: "success",
      title: "Downloading Logo",
      description: `Downloading ${logo.name} brand asset.`,
    })
  }

  return (
    <section className="flex w-full flex-col gap-6 pt-4">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Mascot Logo Feed
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary tabular-nums">
              {filteredLogos.length} Designs
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-0.5">
            Discover community-created mascot logos, brand marks, and variant sheets.
          </p>
        </div>

        {/* Style Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STYLE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedStyle(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-[background-color,border-color,color] active:scale-[0.96]",
                selectedStyle === f.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "border border-border/70 bg-card text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredLogos.map((logo) => (
          <div
            key={logo.id}
            onClick={() =>
              onSelectLogo?.({
                id: logo.id,
                title: logo.name,
                prompt: logo.prompt,
                image: logo.imageUrl,
                style: logo.style,
                tagline: logo.tagline,
              })
            }
            className="group relative flex flex-col rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md cursor-pointer select-none"
          >
            {/* Logo Image Preview Stage */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/30 border border-black/5 dark:border-white/5 flex items-center justify-center p-4">
              <img
                src={logo.imageUrl}
                alt={logo.name}
                className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Quick Action Overlay on Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-150 group-hover:opacity-100 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectLogo?.({
                      id: logo.id,
                      title: logo.name,
                      prompt: logo.prompt,
                      image: logo.imageUrl,
                      style: logo.style,
                      tagline: logo.tagline,
                    })
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-md transition-transform active:scale-[0.96] hover:bg-zinc-100"
                >
                  <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
                  <span>Open Studio</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDownloadDirect(e, logo)}
                  className="flex size-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform active:scale-[0.96] hover:bg-white/30"
                  title="Direct Download"
                >
                  <HugeiconsIcon icon={Download01Icon} className="size-4" />
                </button>
              </div>
            </div>

            {/* Logo Metadata */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col truncate pr-2">
                <span className="font-heading text-sm font-bold text-foreground truncate">
                  {logo.name}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {logo.tagline}
                </span>
              </div>

              {/* Like Button */}
              <button
                type="button"
                onClick={(e) => handleLike(e, logo.id)}
                className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-rose-500 hover:border-rose-500/30 active:scale-[0.96]"
              >
                <HugeiconsIcon icon={FavouriteIcon} className="size-3.5 text-rose-500" />
                <span className="tabular-nums font-mono">{logo.likesCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
