"use client"

import {
  GithubIcon,
  NpmIcon,
  PaintBoardIcon,
  Settings02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StudioMode = "interactive" | "logo"

interface SiteHeaderProps {
  studioMode?: StudioMode
  onStudioModeChange?: (mode: StudioMode) => void
  onOpenSettings?: () => void
  providerName?: string
  hasApiKey?: boolean
}

export function SiteHeader({
  studioMode = "interactive",
  onStudioModeChange,
  onOpenSettings,
  providerName = "openai",
  hasApiKey = false,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="flex h-14 w-full items-center justify-between gap-2 sm:gap-4 px-3 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a href="/" className="flex items-center gap-2 group">
            <span
              className="size-7 sm:size-8 rounded-xl bg-[url('/mascots/taqui-directions.webp')] bg-[length:300%_300%] bg-[position:50%_50%] shadow-2xs transition-transform duration-200 group-hover:scale-105"
              aria-hidden
            />
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-sm sm:text-base font-bold tracking-tight text-foreground">
                Mascen
              </span>
              <span className="hidden sm:inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Studio
              </span>
            </div>
          </a>
        </div>

        {/* Studio Mode Switcher (Highlighted Segmented Switcher) */}
        {onStudioModeChange && (
          <nav
            aria-label="Studio Mode"
            className="flex items-center rounded-2xl border border-border/80 bg-card/90 p-1 shadow-xs backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => onStudioModeChange("interactive")}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98]",
                studioMode === "interactive"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold ring-1 ring-primary/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                className={cn(
                  "size-3.5 shrink-0 transition-colors",
                  studioMode === "interactive" ? "text-primary-foreground" : "text-emerald-500"
                )}
              />
              <span className="hidden sm:inline">Interactive Mascot</span>
              <span className="sm:hidden">Interactive</span>
              {studioMode === "interactive" && (
                <span className="hidden md:inline-flex size-1.5 rounded-full bg-primary-foreground/90 ml-0.5 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onStudioModeChange("logo")}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98]",
                studioMode === "logo"
                  ? "bg-primary text-primary-foreground shadow-sm font-bold ring-1 ring-primary/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HugeiconsIcon
                icon={PaintBoardIcon}
                className={cn(
                  "size-3.5 shrink-0 transition-colors",
                  studioMode === "logo" ? "text-primary-foreground" : "text-amber-500"
                )}
              />
              <span className="hidden sm:inline">Mascot Logo Maker</span>
              <span className="sm:hidden">Logo Maker</span>
              {studioMode === "logo" && (
                <span className="hidden md:inline-flex size-1.5 rounded-full bg-primary-foreground/90 ml-0.5 animate-pulse" />
              )}
            </button>
          </nav>
        )}

        {/* Actions & Links */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenSettings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="h-8 gap-1.5 rounded-xl border-border/80 bg-card px-2.5 text-xs font-medium"
            >
              <HugeiconsIcon icon={Settings02Icon} className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline capitalize">{providerName}</span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  hasApiKey ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                )}
              />
            </Button>
          )}

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              nativeButton={false}
              render={
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                />
              }
            >
              <HugeiconsIcon icon={GithubIcon} className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              nativeButton={false}
              render={
                <a
                  href="https://www.npmjs.com/package/mascot-taqui"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="npm"
                />
              }
            >
              <HugeiconsIcon icon={NpmIcon} className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
