"use client"

import { useEffect, useRef, useState } from "react"
import {
  AiSparklesIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  ImageAdd01Icon,
  ImageUpload01Icon,
  PaintBoardIcon,
  SparklesIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { ExampleGallery } from "@/components/example-gallery"
import { MascotExport } from "@/components/mascot-export"
import { MascotLogoStudio } from "@/components/mascot-logo-studio"
import { PreviewStage } from "@/components/preview-stage"
import { ProviderDialog } from "@/components/provider-dialog"
import { SiteHeader, type StudioMode } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import {
  STYLES,
  TAQUI,
  type ExampleMode,
  type MascotExample,
  type StyleLook,
} from "@/lib/examples"
import {
  getProviderConfig,
  saveMascotLocally,
  type StoredMascot,
  type StoredProviderConfig,
} from "@/lib/storage/indexed-db"
import { useQueryClient } from "@tanstack/react-query"
import { mascotKeys } from "@/lib/queries/mascots"
import type { AgentSSEEvent } from "@/lib/agent/types"

type Mode = ExampleMode

const PROMPT_INSPIRATIONS = [
  "a chibi otter with chocolate-brown fur, cream muzzle and round glasses",
  "a fluffy red panda astronaut with tiny antenna and gold visor",
  "a cozy capybara drinking boba tea with floating citrus slices",
  "a cybernetic fox with holographic visor and geometric origami tails",
  "a chubby penguin barista wearing an apron and steam eyeglasses",
  "a smiling axolotl wizard holding a star bubble wand with rainbow sparkles",
]

export function Editor() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)

  // Studio Mode: "interactive" (360° runtime & generation) | "logo" (Logo Maker)
  const [studioMode, setStudioMode] = useState<StudioMode>("interactive")

  const [mode, setMode] = useState<Mode>("prompt")
  const [prompt, setPrompt] = useState("")
  const [label, setLabel] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [promptError, setPromptError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const [picked, setPicked] = useState(TAQUI)
  const [pickedStyle, setPickedStyle] = useState<string | null>(null)

  // Provider State
  const [providerConfig, setProviderConfig] = useState<StoredProviderConfig | null>(null)
  const [isProviderOpen, setIsProviderOpen] = useState(false)

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [stepMessage, setStepMessage] = useState("")
  const [stepProgress, setStepProgress] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<{
    shift: number
    paletteMatch: number
    widthChange: number
  } | null>(null)

  useEffect(() => {
    getProviderConfig().then((cfg) => {
      if (cfg) setProviderConfig(cfg)
    })
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("mode") === "logo" || window.location.hash === "#logo") {
        setStudioMode("logo")
      }
    }
  }, [])

  function handleStudioModeChange(nextMode: StudioMode) {
    setStudioMode(nextMode)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      if (nextMode === "logo") {
        url.searchParams.set("mode", "logo")
      } else {
        url.searchParams.delete("mode")
      }
      window.history.replaceState({}, "", url.toString())
    }
  }

  function applyExample(example: MascotExample) {
    setPicked(example)
    setPickedStyle(null)
    setMode(example.mode)
    setPrompt(example.prompt)
    setLabel(example.title)
    setPromptError(null)
    setPhotoError(null)
    setGenerationError(null)
    setMetrics(null)
    if (example.mode === "prompt") clearPhoto()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function applyStyle(style: StyleLook) {
    setPickedStyle(style.id)
    setPrompt(style.prompt)
    setPicked({
      id: style.id,
      title: style.title,
      prompt: style.prompt,
      mode: style.id === "photo" ? "photo" : "prompt",
      directions: style.directions,
      reactions: style.reactions,
      image: style.image,
    })
    setLabel(style.id === "photo" ? "Taqui" : "Fox")
    setMode(style.id === "photo" ? "photo" : "prompt")
    setPromptError(null)
    setGenerationError(null)
    setMetrics(null)
    if (style.id !== "photo") clearPhoto()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function makeYourOwn() {
    setStudioMode("interactive")
    setMode("prompt")
    setPicked(TAQUI)
    setPickedStyle(null)
    setLabel("")
    setPrompt("")
    setPromptError(null)
    setPhotoError(null)
    setGenerationError(null)
    setMetrics(null)
    clearPhoto()
    promptRef.current?.focus()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function clearPhoto() {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFile(null)
    setFilePreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function onPhotoChange(next: File | null) {
    if (filePreview) URL.revokeObjectURL(filePreview)
    if (!next) {
      clearPhoto()
      return
    }
    setFile(next)
    setFilePreview(URL.createObjectURL(next))
    setPhotoError(null)
  }

  function pickInspiration() {
    const current = prompt.trim()
    const pool = PROMPT_INSPIRATIONS.filter((p) => p !== current)
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    setPrompt(chosen)
    setPromptError(null)
    toast.add({
      type: "info",
      title: "Inspiration Applied",
      description: "Sample character description loaded.",
    })
  }

  function scrollToExport() {
    const el = document.getElementById("developer-integration")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  async function onGenerate(event?: React.FormEvent) {
    if (event) event.preventDefault()
    const trimmed = prompt.trim()
    let invalid = false
    if (!trimmed) {
      setPromptError("Write a short description of the character.")
      invalid = true
    } else {
      setPromptError(null)
    }
    if (mode === "photo" && !file) {
      setPhotoError("Attach a reference photo.")
      invalid = true
    } else {
      setPhotoError(null)
    }
    if (invalid) return

    // Verify provider is configured
    if (!providerConfig || !providerConfig.apiKey) {
      setIsProviderOpen(true)
      toast.add({
        type: "info",
        title: "Connect AI Provider",
        description: "Please configure your AI provider or API key to generate mascots.",
      })
      return
    }

    setIsGenerating(true)
    setStepMessage("Initializing mascot generation...")
    setStepProgress(5)
    setMetrics(null)
    setGenerationError(null)

    try {
      const formData = new FormData()
      formData.append("prompt", trimmed)
      const charName = label.trim() || (picked?.title ? `${picked.title}-custom` : "my-mascot")
      formData.append("name", charName)
      formData.append("style", pickedStyle || "colour")
      formData.append("mode", mode)
      if (mode === "photo" && file) {
        formData.append("reference", file)
      }

      const headers: Record<string, string> = {
        "x-provider": providerConfig.provider,
        "x-api-key": providerConfig.apiKey,
        "x-model": providerConfig.selectedModel,
      }
      if (providerConfig.baseURL) {
        headers["x-base-url"] = providerConfig.baseURL
      }

      const res = await fetch("/api/mascot/generate", {
        method: "POST",
        headers,
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("Unable to open event stream.")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m)
          if (!match) continue

          let event: AgentSSEEvent
          try {
            event = JSON.parse(match[1]) as AgentSSEEvent
          } catch (jsonErr: any) {
            console.warn("SSE JSON parse error:", jsonErr)
            continue
          }

          if (event.type === "step") {
            setStepMessage(event.message)
            setStepProgress(event.progress)
          } else if (event.type === "metrics") {
            setMetrics(event.data)
          } else if (event.type === "done") {
            const resObj = event.result
            const newMascot: MascotExample = {
              id: resObj.id || resObj.name,
              title: resObj.name,
              prompt: trimmed,
              mode,
              directions: resObj.directionsUrl,
              reactions: resObj.reactionsUrl,
              image: resObj.directionsUrl,
            }
            setPicked(newMascot)
            setPickedStyle(null)

            queryClient.setQueryData<MascotExample[]>(mascotKeys.all, (old = []) => [
              newMascot,
              ...old.filter((m) => m.id !== newMascot.id),
            ])
            await queryClient.invalidateQueries({ queryKey: mascotKeys.all })

            const stored: StoredMascot = {
              id: `${resObj.name}-${Date.now()}`,
              name: resObj.name,
              prompt: trimmed,
              style: pickedStyle || "colour",
              mode,
              provider: providerConfig.provider,
              model: providerConfig.selectedModel,
              directionsUrl: resObj.directionsUrl,
              reactionsUrl: resObj.reactionsUrl,
              metrics: resObj.metrics,
              createdAt: Date.now(),
            }
            await saveMascotLocally(stored)

            toast.add({
              type: "success",
              title: "Mascot Generated!",
              description: `${resObj.name} is ready for 360° interactive preview.`,
            })
          } else if (event.type === "error") {
            throw new Error(event.error)
          }
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err)
      setGenerationError(err.message || "Failed to generate mascot.")
      toast.add({
        type: "error",
        title: "Generation failed",
        description: err.message || "Failed to generate mascot.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function onReset() {
    setPrompt("")
    setLabel(TAQUI.title)
    setMode("prompt")
    setPromptError(null)
    setPhotoError(null)
    setPicked(TAQUI)
    setPickedStyle(null)
    setMetrics(null)
    setGenerationError(null)
    clearPhoto()
  }

  return (
    <div className="flex w-full flex-col min-h-screen">
      {/* 1. EDGE-TO-EDGE REACTIVE SITE HEADER */}
      <SiteHeader
        studioMode={studioMode}
        onStudioModeChange={handleStudioModeChange}
        onOpenSettings={() => setIsProviderOpen(true)}
        providerName={providerConfig?.provider}
        hasApiKey={Boolean(providerConfig?.apiKey)}
      />

      {/* 2. FULL-PAGE EDGE-TO-EDGE STUDIO WORKSPACE */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-6 flex flex-col gap-10">
        {studioMode === "interactive" ? (
          <>
            {/* CENTRAL SPATIAL STUDIO HERO: STAGE + FLOATING TACTILE COMMAND DECK */}
            <section className="flex flex-col rounded-3xl border border-border/70 bg-card shadow-sm overflow-hidden">
              {/* Live Mascot 360° Stage or Animated Synthesis Chamber */}
              <PreviewStage
                label={label || picked.title}
                slug={picked.id}
                directions={picked.directions}
                reactions={picked.reactions}
                isGenerating={isGenerating}
                stepMessage={stepMessage}
                stepProgress={stepProgress}
                metrics={metrics}
                error={generationError}
                onClearError={() => setGenerationError(null)}
                onScrollToDownload={scrollToExport}
              />

              {/* DOCKED TACTILE COMMAND DECK (CENTRAL, USER-FRIENDLY, NO SIDEBAR) */}
              <form
                onSubmit={onGenerate}
                className="border-t border-border/70 bg-muted/20 backdrop-blur-md p-4 sm:p-6 flex flex-col gap-4"
              >
                {/* Upper Control Bar: Mode Toggle, Style Chips, Name & Inspiration */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Mode Switcher + Style Chips */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Prompt vs Photo Mode Toggle */}
                    <ToggleGroup
                      value={[mode]}
                      onValueChange={(value) => {
                        const next = value[0]
                        if (next === "prompt" || next === "photo") setMode(next)
                      }}
                      variant="outline"
                      spacing={1}
                    >
                      <ToggleGroupItem value="prompt" className="text-xs h-8 px-3 rounded-xl font-medium">
                        <HugeiconsIcon icon={TextFontIcon} data-icon="inline-start" className="size-3.5" />
                        Prompt
                      </ToggleGroupItem>
                      <ToggleGroupItem value="photo" className="text-xs h-8 px-3 rounded-xl font-medium">
                        <HugeiconsIcon icon={ImageAdd01Icon} data-icon="inline-start" className="size-3.5" />
                        Photo
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Quick Style Chips with Clear Label */}
                    <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/70 px-2 py-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                        Style
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                        {STYLES.map((s) => {
                          const isSelected = (pickedStyle || "colour") === s.id
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => applyStyle(s)}
                              className={cn(
                                "rounded-lg px-2.5 py-0.5 text-xs font-medium transition-all active:scale-95",
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              )}
                            >
                              {s.title}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Character Name & Inspiration */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={pickInspiration}
                      className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 active:scale-95 shadow-2xs"
                    >
                      <HugeiconsIcon icon={AiSparklesIcon} className="size-3.5 text-primary" />
                      <span>Inspire Me</span>
                    </button>

                    <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground shadow-2xs">
                      <span className="text-[11px] font-medium">Name:</span>
                      <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={picked?.title ? `${picked.title}-custom` : "e.g. Astro"}
                        className="h-6 w-24 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Photo Upload Dropzone (Photo Mode) */}
                {mode === "photo" && (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                    />
                    {file && filePreview ? (
                      <div className="flex items-center gap-3 w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={filePreview} alt="Reference" className="size-10 rounded-xl object-cover shadow-2xs border border-border/80" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground">Reference attached for face silhouette and hairstyle</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon-xs" onClick={clearPhoto} aria-label="Remove photo">
                          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                      >
                        <HugeiconsIcon icon={ImageUpload01Icon} className="size-4" />
                        <span>Upload photo reference (JPG, PNG, WebP)</span>
                      </button>
                    )}
                    {photoError && <span className="text-xs font-medium text-destructive">{photoError}</span>}
                  </div>
                )}

                {/* Main Prompt Textarea */}
                <div className="flex flex-col gap-1.5">
                  <div className="relative">
                    <Textarea
                      ref={promptRef}
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value)
                        if (e.target.value.trim()) setPromptError(null)
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault()
                          onGenerate()
                        }
                      }}
                      placeholder={
                        mode === "photo"
                          ? "make one that looks like me, chibi, neat bun, round glasses..."
                          : "a chibi otter with chocolate-brown fur, cream muzzle and dark ear tips..."
                      }
                      rows={2}
                      className="resize-none pr-8 text-xs sm:text-sm font-sans leading-relaxed min-h-[64px] rounded-2xl border-border/80 bg-background/90 focus-visible:ring-primary/40"
                    />
                    {prompt && (
                      <button
                        type="button"
                        onClick={() => setPrompt("")}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear prompt"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                      </button>
                    )}
                  </div>
                  {promptError && <span className="text-xs font-medium text-destructive">{promptError}</span>}
                </div>

                {/* Bottom Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Generates 9 glance angles + 9 emotional reaction sprite sheets. Press ⌘↵ to generate.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isGenerating}
                      onClick={onReset}
                      className="h-8 text-xs font-medium rounded-xl"
                    >
                      Reset
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStudioModeChange("logo")}
                      className="h-8 gap-1.5 text-xs font-medium rounded-xl border-border/80 bg-background/80"
                    >
                      <HugeiconsIcon icon={PaintBoardIcon} className="size-3.5 text-amber-500" />
                      <span>Logo Maker</span>
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={isGenerating}
                      className="h-8 gap-1.5 text-xs font-semibold px-5 rounded-xl transition-all active:scale-[0.98] shadow-xs"
                    >
                      {isGenerating ? (
                        <>
                          <Spinner className="size-3.5" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-primary-foreground" />
                          <span>Generate Mascot</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </section>

            {/* ALREADY DRAWN MASCOTS & ARTISTIC STYLES (TRANSPARENT FLOATING CARDS) */}
            <ExampleGallery
              picked={picked.id}
              pickedStyle={pickedStyle}
              onPick={applyExample}
              onPickStyle={applyStyle}
              onMakeYourOwn={makeYourOwn}
            />

            {/* DEVELOPER INTEGRATION & EXPORT SUITE */}
            <div id="developer-integration">
              <MascotExport
                label={label || picked.title}
                slug={picked.id}
                directions={picked.directions}
                reactions={picked.reactions}
              />
            </div>
          </>
        ) : (
          <>
            {/* MASCOT LOGO MAKER STUDIO WORKSPACE */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Mascot Logo Maker
                    </h2>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                      Export Engine
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customize angles, emotional reactions, backgrounds, and corner radiuses. Export transparent or styled PNG logos.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStudioModeChange("interactive")}
                  className="gap-1.5 text-xs font-medium rounded-xl"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 rotate-180" />
                  <span>Return to Interactive Stage</span>
                </Button>
              </div>

              {/* Logo Studio Canvas & Control Deck */}
              <MascotLogoStudio mascot={picked} />

              {/* Quick Mascot Switcher in Logo Mode */}
              <div className="pt-4 border-t border-border/40">
                <ExampleGallery
                  picked={picked.id}
                  pickedStyle={pickedStyle}
                  onPick={applyExample}
                  onPickStyle={applyStyle}
                  onMakeYourOwn={makeYourOwn}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI PROVIDER CONFIGURATION MODAL */}
      <ProviderDialog
        open={isProviderOpen}
        onOpenChange={setIsProviderOpen}
        onConfigured={(cfg) => {
          setProviderConfig(cfg)
          toast.add({
            type: "success",
            title: "Provider Saved",
            description: `Connected to ${cfg.provider} (${cfg.selectedModel}).`,
          })
        }}
      />
    </div>
  )
}
