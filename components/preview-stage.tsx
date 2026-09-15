"use client"

import { useRef, useState } from "react"
import {
  AiSparklesIcon,
  ArrowDown01Icon,
  ArrowDownLeft01Icon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpLeft01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  Compass01Icon,
  ComputerTerminal01Icon,
  Copy01Icon,
  Cursor01Icon,
  Download01Icon,
  EyeClosedIcon,
  EyeIcon,
  FavouriteIcon,
  Folder01Icon,
  Moon02Icon,
  Package01Icon,
  SlidersHorizontalIcon,
  SmileDizzyIcon,
  SmileIcon,
  SourceCodeIcon,
  SparklesIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Mascot, type MascotHandle } from "@/components/mascot"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
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

type CanvasTone = "default" | "slate" | "amber" | "emerald" | "dark"
type RightPanelTab = "reactions" | "export"
type ExportSubtab = "cli" | "manual" | "assets"
type PackageManager = "npx" | "pnpm dlx" | "bunx"
type InstallManager = "pnpm" | "npm" | "bun"
type Framework = "nextjs" | "react" | "vue" | "svelte" | "astro"

type PreviewStageProps = {
  label: string
  slug: string
  directions: string
  reactions: string
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
  slug,
  directions,
  reactions,
}: PreviewStageProps) {
  const mascotRef = useRef<MascotHandle>(null)

  // Interactive controls
  const [followPointer, setFollowPointer] = useState(true)
  const [idleBlink, setIdleBlink] = useState(false)
  const [size, setSize] = useState(200)
  const [canvasTone, setCanvasTone] = useState<CanvasTone>("default")
  const [currentLook, setCurrentLook] = useState<string>("center")
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null)

  // Right panel tabs & export options
  const [rightTab, setRightTab] = useState<RightPanelTab>("reactions")
  const [exportSubtab, setExportSubtab] = useState<ExportSubtab>("cli")
  const [pkgRunner, setPkgRunner] = useState<PackageManager>("npx")
  const [installManager, setInstallManager] = useState<InstallManager>("pnpm")
  const [framework, setFramework] = useState<Framework>("nextjs")
  const [copyOnly, setCopyOnly] = useState(false)
  const [manualLang, setManualLang] = useState<"react" | "html">("react")

  // Copy states
  const [copiedCli, setCopiedCli] = useState(false)
  const [copiedManual, setCopiedManual] = useState(false)
  const [copiedInstall, setCopiedInstall] = useState(false)

  const cleanSlug = (slug || label || "mascot").toLowerCase().replace(/[^a-z0-9-]/g, "-")

  // Formatted CLI Command
  const cliCommand = `${pkgRunner} mascot-taqui add ${cleanSlug} --${framework}${
    copyOnly ? " --copy-only" : ""
  }`

  // Package installation command for manual mode
  const installCmd =
    installManager === "pnpm"
      ? "pnpm add mascot-taqui"
      : installManager === "bun"
      ? "bun add mascot-taqui"
      : "npm install mascot-taqui"

  // Manual component snippet
  const manualSnippet =
    manualLang === "react"
      ? `import { Mascot } from "mascot-taqui/react"

export function CharacterBadge() {
  return (
    <Mascot
      label="${label}"
      directions="${directions}"
      reactions="${reactions}"
      size={${size}}
      followPointer={${followPointer}}
    />
  )
}`
      : `<!-- Web Component -->
<script type="module" src="https://esm.sh/mascot-taqui"></script>

<mascot-taqui
  label="${label}"
  directions="${directions}"
  reactions="${reactions}"
  size="${size}"
  ${followPointer ? "follow-pointer" : ""}
></mascot-taqui>`

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

  async function copyToClipboard(text: string, type: "cli" | "manual" | "install") {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "cli") {
        setCopiedCli(true)
        setTimeout(() => setCopiedCli(false), 1800)
        toast.add({
          type: "success",
          title: "CLI command copied",
          description: "Paste and run in your project root.",
        })
      } else if (type === "install") {
        setCopiedInstall(true)
        setTimeout(() => setCopiedInstall(false), 1800)
        toast.add({
          type: "success",
          title: "Install command copied",
          description: `${text}`,
        })
      } else {
        setCopiedManual(true)
        setTimeout(() => setCopiedManual(false), 1800)
        toast.add({
          type: "success",
          title: "Snippet copied",
          description: "Ready to paste into your component file.",
        })
      }
    } catch {
      toast.add({
        type: "error",
        title: "Copy failed",
        description: "Clipboard permission was denied.",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 divide-y divide-border border-b border-border bg-background lg:grid-cols-[200px_minmax(0,1fr)_340px] lg:divide-x lg:divide-y-0 xl:grid-cols-[210px_minmax(0,1fr)_370px]">
      {/* 1. LEFT PANEL: Controls & Angle Compass */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Controls
            </span>
            <span className="text-[10px] text-muted-foreground">Live</span>
          </div>

          {/* Behavior Toggles */}
          <div className="flex flex-col gap-1.5">
            {/* Follow Pointer */}
            <button
              type="button"
              onClick={() => setFollowPointer((prev) => !prev)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all active:scale-[0.98]",
                followPointer
                  ? "border-primary/40 bg-primary/5 text-foreground shadow-2xs"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Cursor01Icon} className="size-3.5" />
                <span className="font-medium">Follow Pointer</span>
              </div>
              <span
                className={cn(
                  "size-2 rounded-full transition-colors",
                  followPointer ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
              />
            </button>

            {/* Idle Blink */}
            <button
              type="button"
              onClick={() => setIdleBlink((prev) => !prev)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all active:scale-[0.98]",
                idleBlink
                  ? "border-primary/40 bg-primary/5 text-foreground shadow-2xs"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={EyeIcon} className="size-3.5" />
                <span className="font-medium">Idle Blink</span>
              </div>
              <span
                className={cn(
                  "size-2 rounded-full transition-colors",
                  idleBlink ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
              />
            </button>
          </div>

          {/* Size Pills */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1">
            <span className="text-[11px] font-medium text-foreground">Size</span>
            <div className="flex gap-1">
              {[150, 200, 250].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all active:scale-95",
                    size === s
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Look Angle Compass */}
        <div className="mt-3 flex flex-col gap-1.5 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Glance Angle
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {currentLook}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mx-auto w-full max-w-[130px] rounded-lg border border-border/60 bg-muted/20 p-1">
            {COMPASS_GRID.map((item) => {
              const isSelected = currentLook === item.look
              return (
                <button
                  key={item.look}
                  type="button"
                  onClick={() => triggerGlance(item.look)}
                  title={item.label}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md border transition-all active:scale-90",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                      : "border-border/30 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} className="size-3" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE PANEL: Pure Mascot Stage (No messy top badge or duplicate buttons) */}
      <div
        className={cn(
          "relative flex flex-col justify-between p-3.5 transition-colors duration-300 sm:p-4",
          canvasTone === "default" && "bg-muted/15",
          canvasTone === "slate" && "bg-slate-100/90 dark:bg-slate-900/40",
          canvasTone === "amber" && "bg-amber-500/10 dark:bg-amber-950/20",
          canvasTone === "emerald" && "bg-emerald-500/10 dark:bg-emerald-950/20",
          canvasTone === "dark" && "bg-zinc-950 text-zinc-100"
        )}
      >
        {/* Ambient radial glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              canvasTone === "dark"
                ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)"
                : "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.04) 0%, transparent 60%)",
          }}
          aria-hidden
        />

        {/* Mascot Center Display */}
        <div className="relative my-auto flex flex-col items-center justify-center py-2">
          <Mascot
            ref={mascotRef}
            key={`${directions}-${size}`}
            size={size}
            label={label}
            directions={directions}
            reactions={reactions}
            expressionOnLoad
            idleBlink={idleBlink}
            followPointer={followPointer}
            onLook={(look) => setCurrentLook(look)}
            className="transition-transform duration-150 active:scale-95"
          />
          <p
            className={cn(
              "mt-2 font-heading text-sm font-semibold tracking-tight",
              canvasTone === "dark" ? "text-zinc-100" : "text-foreground"
            )}
          >
            {label}
          </p>
        </div>

        {/* Stage Bottom Bar: Backdrop Tone Switcher */}
        <div className="z-10 flex w-full items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px]">
          <span
            className={cn(
              "text-[10px] font-semibold tracking-wider uppercase",
              canvasTone === "dark" ? "text-zinc-500" : "text-muted-foreground"
            )}
          >
            Backdrop
          </span>
          <div className="flex items-center gap-1">
            {(
              [
                { id: "default", label: "Clean" },
                { id: "slate", label: "Slate" },
                { id: "amber", label: "Warm" },
                { id: "emerald", label: "Mint" },
                { id: "dark", label: "Dark" },
              ] as const
            ).map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => setCanvasTone(tone.id)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                  canvasTone === tone.id
                    ? "bg-foreground text-background shadow-2xs"
                    : canvasTone === "dark"
                    ? "text-zinc-400 hover:text-zinc-100"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL: Reactions & Rich Export */}
      <div className="flex flex-col justify-between p-3.5 sm:p-4">
        {/* Right Panel Main Tabs */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setRightTab("reactions")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tracking-tight transition-all active:scale-[0.98]",
                rightTab === "reactions"
                  ? "bg-muted text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={SlidersHorizontalIcon} className="size-3" />
              Reactions
            </button>
            <button
              type="button"
              onClick={() => setRightTab("export")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tracking-tight transition-all active:scale-[0.98]",
                rightTab === "export"
                  ? "bg-muted text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={Download01Icon} className="size-3" />
              Install & Export
            </button>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {rightTab === "reactions" ? "9 reactions" : "Drop-in"}
          </span>
        </div>

        {/* Tab Body */}
        <div className="my-auto py-2">
          {rightTab === "reactions" ? (
            /* 9 Custom Reaction Chips */
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-1.5">
                {REACTIONS.map((item) => {
                  const isActive = activeReactionId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => triggerReaction(item.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition-all active:scale-[0.96]",
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/40"
                          : "border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/40"
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
              <p className="text-[10px] text-muted-foreground leading-tight">
                Click any button to trigger the reaction animation live on the mascot.
              </p>
            </div>
          ) : (
            /* DETAILED EXPORT & INSTALL SECTION */
            <div className="flex flex-col gap-2.5">
              {/* 3 Export Subtabs: CLI | Manual | Assets */}
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setExportSubtab("cli")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium transition-all active:scale-95",
                    exportSubtab === "cli"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon icon={ComputerTerminal01Icon} className="size-3" />
                  CLI
                </button>
                <button
                  type="button"
                  onClick={() => setExportSubtab("manual")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium transition-all active:scale-95",
                    exportSubtab === "manual"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon icon={SourceCodeIcon} className="size-3" />
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setExportSubtab("assets")}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium transition-all active:scale-95",
                    exportSubtab === "assets"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon icon={Download01Icon} className="size-3" />
                  Sheets
                </button>
              </div>

              {/* A. CLI SUBTAB */}
              {exportSubtab === "cli" && (
                <div className="flex flex-col gap-2">
                  {/* Framework & Runner Selectors */}
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <div className="flex items-center gap-1">
                      {(["nextjs", "react", "vue", "svelte", "astro"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFramework(f)}
                          className={cn(
                            "rounded px-1.5 py-0.5 font-medium transition-all",
                            framework === f
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {f === "nextjs" ? "Next" : f}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-0.5 rounded border border-border/60 bg-muted/20 px-1 py-0.5 font-mono text-[9px]">
                      {(["npx", "pnpm dlx", "bunx"] as const).map((runner) => (
                        <button
                          key={runner}
                          type="button"
                          onClick={() => setPkgRunner(runner)}
                          className={cn(
                            "rounded px-1 py-0.5 transition-all",
                            pkgRunner === runner
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {runner.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Command Box */}
                  <div className="group relative flex items-center justify-between rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="select-all overflow-x-auto text-foreground truncate pr-2">
                      {cliCommand}
                    </span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => copyToClipboard(cliCommand, "cli")}
                      className="size-6 shrink-0 transition-transform active:scale-90"
                      aria-label="Copy CLI command"
                    >
                      <HugeiconsIcon
                        icon={copiedCli ? CheckmarkCircle01Icon : Copy01Icon}
                        className={cn(
                          "size-3.5 transition-colors",
                          copiedCli ? "text-emerald-500" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>

                  {/* Flags Toggle */}
                  <div className="flex items-center justify-between text-[10px]">
                    <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={copyOnly}
                        onChange={(e) => setCopyOnly(e.target.checked)}
                        className="rounded border-border size-3 accent-primary"
                      />
                      <span>--copy-only (assets only)</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Auto-detects routes
                    </span>
                  </div>

                  {/* Step Breakdown */}
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <HugeiconsIcon icon={Package01Icon} className="size-3" />
                      <span>1-Command Setup:</span>
                    </div>
                    <p className="mt-0.5">
                      Installs package, saves sprite sheets to <code className="font-mono text-foreground">public/mascots/</code>, and creates the component.
                    </p>
                  </div>
                </div>
              )}

              {/* B. MANUAL CODE SUBTAB */}
              {exportSubtab === "manual" && (
                <div className="flex flex-col gap-2">
                  {/* Step 1: Package Install */}
                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1 font-mono text-[9px]">
                        {(["pnpm", "npm", "bun"] as const).map((mgr) => (
                          <button
                            key={mgr}
                            type="button"
                            onClick={() => setInstallManager(mgr)}
                            className={cn(
                              "rounded px-1 py-0.5",
                              installManager === mgr
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {mgr}
                          </button>
                        ))}
                      </div>
                      <span className="font-mono text-foreground">{installCmd}</span>
                    </div>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => copyToClipboard(installCmd, "install")}
                      className="size-5 shrink-0"
                    >
                      <HugeiconsIcon
                        icon={copiedInstall ? CheckmarkCircle01Icon : Copy01Icon}
                        className={cn(
                          "size-3",
                          copiedInstall ? "text-emerald-500" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>

                  {/* Step 2: Component Code */}
                  <div className="flex flex-col rounded-lg border border-border bg-muted/40 p-2">
                    <div className="flex items-center justify-between pb-1 border-b border-border/40 text-[10px]">
                      <div className="flex gap-1">
                        {(["react", "html"] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setManualLang(lang)}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                              manualLang === lang
                                ? "bg-foreground text-background font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {lang === "react" ? "React / Next" : "Web Component"}
                          </button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => copyToClipboard(manualSnippet, "manual")}
                        className="h-5 gap-1 px-1.5 text-[10px]"
                      >
                        <HugeiconsIcon
                          icon={copiedManual ? CheckmarkCircle01Icon : Copy01Icon}
                          className={cn(
                            "size-3",
                            copiedManual ? "text-emerald-500" : "text-muted-foreground"
                          )}
                        />
                        {copiedManual ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <pre className="mt-1.5 overflow-x-auto font-mono text-[10px] leading-tight text-foreground">
                      <code>{manualSnippet}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* C. ASSETS DOWNLOAD SUBTAB */}
              {exportSubtab === "assets" && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Directions Sheet */}
                    <div className="flex flex-col justify-between rounded-lg border border-border/70 bg-muted/20 p-2 text-[10px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <HugeiconsIcon icon={Compass01Icon} className="size-3.5" />
                          <span>Directions</span>
                        </div>
                        <span className="rounded bg-muted px-1 py-0.2 font-mono text-[9px]">
                          3×3
                        </span>
                      </div>
                      <p className="my-1 text-[9px] text-muted-foreground truncate">
                        {cleanSlug}-directions.webp
                      </p>
                      <Button
                        variant="outline"
                        size="xs"
                        nativeButton={false}
                        render={
                          <a
                            href={directions}
                            download={`${cleanSlug}-directions.webp`}
                          />
                        }
                        className="h-6 w-full gap-1 text-[10px] font-medium active:scale-95"
                      >
                        <HugeiconsIcon icon={Download01Icon} className="size-3" />
                        Download
                      </Button>
                    </div>

                    {/* Reactions Sheet */}
                    <div className="flex flex-col justify-between rounded-lg border border-border/70 bg-muted/20 p-2 text-[10px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <HugeiconsIcon icon={AiSparklesIcon} className="size-3.5" />
                          <span>Reactions</span>
                        </div>
                        <span className="rounded bg-muted px-1 py-0.2 font-mono text-[9px]">
                          3×3
                        </span>
                      </div>
                      <p className="my-1 text-[9px] text-muted-foreground truncate">
                        {cleanSlug}-reactions.webp
                      </p>
                      <Button
                        variant="outline"
                        size="xs"
                        nativeButton={false}
                        render={
                          <a
                            href={reactions}
                            download={`${cleanSlug}-reactions.webp`}
                          />
                        }
                        className="h-6 w-full gap-1 text-[10px] font-medium active:scale-95"
                      >
                        <HugeiconsIcon icon={Download01Icon} className="size-3" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Asset Path Reference */}
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[10px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <HugeiconsIcon icon={Folder01Icon} className="size-3 shrink-0" />
                      <span className="truncate font-mono text-[9px]">
                        public/mascots/{cleanSlug}-*.webp
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                      WebP Atlas
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footnote */}
        <div className="border-t border-border/40 pt-1.5 text-[10px] text-muted-foreground">
          {rightTab === "reactions"
            ? "Simulates user cursor clicks and boops"
            : "Drop sprite sheets into public/mascots/"}
        </div>
      </div>
    </div>
  )
}
