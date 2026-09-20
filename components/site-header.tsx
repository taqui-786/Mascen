"use client"

import Link from "next/link"
import Image from "next/image"
import {
  GithubIcon,
  NewTwitterIcon,
  NpmIcon,
  PaintBoardIcon,
  Settings02Icon,
  SparklesIcon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StudioMode = "interactive" | "logo"

interface SiteHeaderProps {
  studioMode?: StudioMode
  onOpenSettings?: () => void
  providerName?: string
  hasApiKey?: boolean
  variant?: "default" | "landing"
}

export function SiteHeader({
  studioMode,
  onOpenSettings,
  providerName = "openai",
  hasApiKey = false,
  variant = "default",
}: SiteHeaderProps) {
  const isLanding = variant === "landing"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div
        className={cn(
          "flex h-14 sm:h-16 w-full items-center justify-between gap-2 sm:gap-4",
          isLanding
            ? "mx-auto max-w-7xl px-6 sm:px-10 lg:px-12"
            : "px-4 sm:px-8 lg:px-12"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" aria-current={!studioMode ? "page" : undefined} className="flex items-center gap-2.5 group">
            <div className="relative size-8 sm:size-9.5 rounded-xl overflow-hidden shadow-2xs transition-transform duration-200 group-hover:scale-105 flex items-center justify-center border border-border/40 bg-muted/20">
              <Image
                src="/mascenLogo.jpg"
                alt="Mascen logo"
                width={48}
                height={48}
                className="size-full object-cover"
                priority
              />
            </div>
            <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground">
              Mascen
            </span>
          </Link>
        </div>

        {/* Studio Mode Switcher (Tactile Segmented Switcher) */}
        {variant !== "landing" && (
          <nav
            aria-label="Studio Mode"
            className="flex items-center rounded-full border border-border/60 bg-muted/60 p-1 shadow-2xs backdrop-blur-md"
          >
            <Link
              href="/mascot-character"
              aria-current={studioMode === "interactive" ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium cursor-pointer select-none",
                "transition-colors duration-150 active:scale-[0.96] transition-transform duration-100 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                studioMode === "interactive"
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent"
              )}
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                className={cn(
                  "size-3.5 shrink-0 transition-colors duration-150",
                  studioMode === "interactive"
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="hidden sm:inline">Interactive Mascot</span>
              <span className="sm:hidden">Interactive</span>
            </Link>

            <Link
              href="/mascot-logo"
              aria-current={studioMode === "logo" ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium cursor-pointer select-none",
                "transition-colors duration-150 active:scale-[0.96] transition-transform duration-100 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                studioMode === "logo"
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent"
              )}
            >
              <HugeiconsIcon
                icon={PaintBoardIcon}
                className={cn(
                  "size-3.5 shrink-0 transition-colors duration-150",
                  studioMode === "logo"
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="hidden sm:inline">Mascot Logo Maker</span>
              <span className="sm:hidden">Logo Maker</span>
            </Link>
          </nav>
        )}

        {/* Actions & Links */}
        <div className="flex items-center gap-2 shrink-0">
          {variant === "landing" ? (
            <>
              <a
                href="https://x.com/taqui_786"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on X / Twitter"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl   px-3 sm:px-3.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40 transition-all active:scale-[0.96] "
              >
                <HugeiconsIcon icon={NewTwitterIcon} className="size-4 text-foreground" />
                <span className="hidden sm:inline">Twitter / X</span>
              </a>

              <a
                href="https://github.com/taqui-786/mascot"
                target="_blank"
                rel="noreferrer"
                aria-label="Star on GitHub"
                className="group inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-[0.96] shadow-2xs"
              >
                <HugeiconsIcon icon={GithubIcon} className="size-4" />
                <span className="hidden sm:inline">Star on GitHub</span>
                <span className="sm:hidden">Star</span>
              </a>
            </>
          ) : (
            <>
              {onOpenSettings && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenSettings}
                  className="h-8 gap-1.5 rounded-xl border-border/80 bg-card px-2.5 text-xs font-medium cursor-pointer active:scale-[0.96] transition-transform duration-100 ease-out"
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

              <div className="hidden items-center gap-0.5 sm:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground active:scale-[0.96] transition-transform duration-100 ease-out"
                  nativeButton={false}
                  render={
                    <a
                      href="https://github.com/taqui-786/mascot"
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
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground active:scale-[0.96] transition-transform duration-100 ease-out"
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}
