"use client"

import { useState } from "react"
import { ArrowRight02Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "@/components/ui/toast"
import type { StoredProviderConfig } from "@/lib/storage/indexed-db"

interface LogoGeneratorFormProps {
  formId?: string
  onGeneratingChange?: (generating: boolean) => void
  providerConfig: StoredProviderConfig | null
  onOpenSettings: () => void
  onLogoGenerated: (logo: {
    id: string
    title: string
    prompt: string
    image: string
    style: string
    tagline?: string
  }) => void
}

const QUICK_IDEAS = [
  { label: "Coffee Owl", prompt: "a cute chubby coffee owl with copper spectacles and warm caramel feathers", brand: "Brewy" },
  { label: "Cyber Otter", prompt: "a joyful chibi tech otter wearing a glowing visor and sleek dark hoodie", brand: "Otterly" },
  { label: "Astro Panda", prompt: "a brave chibi red panda in a white astronaut suit with golden helmet visor", brand: "Pandarox" },
  { label: "Robo Barista", prompt: "a friendly rounded vintage robot holding a steaming espresso cup", brand: "Caffebot" },
  { label: "Wise Fox", prompt: "a charming woodland fox with fluffy tail, monocle, and tweed waistcoat", brand: "Vulpine" },
]

const LOGO_STYLE_OPTIONS = [
  { id: "modern-3d", title: "3D Clay", note: "Soft sculpted forms" },
  { id: "flat-vector", title: "Flat Vector", note: "Bold, crisp outlines" },
  { id: "minimal-badge", title: "Minimal Badge", note: "Clean geometric crests" },
  { id: "vintage-retro", title: "Vintage Retro", note: "Rubber-hose cartoon charm" },
  { id: "cyber-esports", title: "Cyber Esports", note: "Sharp, energetic shapes" },
  { id: "duotone-stamp", title: "Duotone Stamp", note: "Two-color print character" },
]

export function LogoGeneratorForm({
  formId,
  onGeneratingChange,
  providerConfig,
  onOpenSettings,
  onLogoGenerated,
}: LogoGeneratorFormProps) {
  const [brandName, setBrandName] = useState("")
  const [tagline, setTagline] = useState("")
  const [prompt, setPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("modern-3d")
  const [isGenerating, setIsGenerating] = useState(false)
  const [stepMessage, setStepMessage] = useState("")
  const [stepProgress, setStepProgress] = useState(0)

  function applyIdea(idea: typeof QUICK_IDEAS[0]) {
    setBrandName(idea.brand)
    setPrompt(idea.prompt)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isGenerating) return

    if (!prompt.trim()) {
      toast.add({
        type: "error",
        title: "Prompt Required",
        description: "Please describe your mascot logo character.",
      })
      return
    }

    if (!providerConfig?.apiKey) {
      toast.add({
        type: "error",
        title: "API Key Required",
        description: "Please configure your image provider in settings to generate logos.",
      })
      onOpenSettings()
      return
    }

    setIsGenerating(true)
    onGeneratingChange?.(true)
    setStepMessage("Preparing your nine variants...")
    setStepProgress(10)

    try {
      const formData = new FormData()
      formData.append("brandName", brandName.trim() || "Mascot Brand")
      formData.append("tagline", tagline.trim())
      formData.append("prompt", prompt.trim())
      formData.append("style", selectedStyle)

      const res = await fetch("/api/logo/generate", {
        method: "POST",
        headers: {
          "x-provider": providerConfig.provider,
          "x-api-key": providerConfig.apiKey,
          "x-model": providerConfig.selectedModel,
          ...(providerConfig.baseURL ? { "x-base-url": providerConfig.baseURL } : {}),
        },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Generation failed: ${res.statusText}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("Could not read response stream.")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const block of lines) {
          if (!block.trim()) continue
          const eventMatch = block.match(/^event:\s*(.+)$/m)
          const dataMatch = block.match(/^data:\s*(.+)$/m)
          const event = eventMatch ? eventMatch[1].trim() : "message"
          const data = dataMatch ? JSON.parse(dataMatch[1].trim()) : {}

          if (event === "status") {
            setStepMessage(data.message || "")
            setStepProgress(data.progress || 50)
          } else if (event === "complete") {
            setStepMessage("Your logo sheet is ready.")
            setStepProgress(100)
            toast.add({
              type: "success",
              title: "Logo Generated!",
              description: `Generated "${data.title}" mascot logo successfully.`,
            })
            onLogoGenerated({
              id: data.id,
              title: data.title,
              prompt: data.prompt,
              image: data.imageUrl,
              style: data.style,
              tagline: data.tagline,
            })
          } else if (event === "error") {
            throw new Error(data.message || "Logo generation failed.")
          }
        }
      }
    } catch (err: unknown) {
      console.error("Logo generation error:", err)
      const msg = err instanceof Error ? err.message : "Generation failed"
      toast.add({
        type: "error",
        title: "Generation Error",
        description: msg,
      })
    } finally {
      setIsGenerating(false)
      onGeneratingChange?.(false)
      setStepMessage("")
      setStepProgress(0)
    }
  }

  return (
    <section aria-labelledby="logo-generator-title" className="w-full rounded-2xl bg-card text-card-foreground ring-1 ring-border">
      <form id={formId} onSubmit={handleSubmit} aria-busy={isGenerating}>
        <div className="grid">
          <div className="min-w-0 p-5 sm:p-6">
            <h2 id="logo-generator-title" className="font-heading text-lg font-semibold tracking-tight text-balance">
              Give your idea a face.
            </h2>

            <label htmlFor="logo-character" className="mt-4 block text-xs font-medium text-foreground/75">
              Your character
            </label>
            <textarea
              id="logo-character"
              name="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A playful cursor with tiny hands. A sleepy coffee cup. What’s your character?"
              required
              rows={3}
              disabled={isGenerating}
              className="mt-2 block min-h-28 w-full resize-y rounded-lg border border-input bg-muted/30 p-3 text-base leading-relaxed outline-none placeholder:text-foreground/55 focus-visible:border-foreground/50 focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-50 sm:text-sm"
            />
            <div className="mt-1 flex flex-wrap items-center gap-x-0.5 text-xs text-foreground/65">
              <span className="mr-0.5">Try:</span>
              {QUICK_IDEAS.map((idea, i) => (
                <span key={idea.label} className="flex items-center">
                  {i > 0 && <span aria-hidden="true" className="mr-0.5 text-foreground/40">,</span>}
                  <button
                    type="button"
                    onClick={() => applyIdea(idea)}
                    disabled={isGenerating}
                    className="min-h-11 rounded px-1 underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
                  >
                    {idea.label}
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label htmlFor="logo-brand" className="text-xs font-medium text-foreground/75">Brand name <span className="font-normal">(optional)</span></label>
                <input
                  id="logo-brand"
                  name="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Mascen"
                  disabled={isGenerating}
                  className="mt-1 block h-10 w-full rounded-none border-b border-input bg-transparent text-base outline-none placeholder:text-foreground/55 focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-50 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="logo-tagline" className="text-xs font-medium text-foreground/75">Tagline <span className="font-normal">(optional)</span></label>
                <input
                  id="logo-tagline"
                  name="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A little more character"
                  disabled={isGenerating}
                  className="mt-1 block h-10 w-full rounded-none border-b border-input bg-transparent text-base outline-none placeholder:text-foreground/55 focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-50 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <fieldset disabled={isGenerating} className="min-w-0 px-5 pb-4 sm:px-6">
          <legend className="text-xs font-medium text-foreground/75">Art direction</legend>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {LOGO_STYLE_OPTIONS.map((style) => (
              <label key={style.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="logoStyle"
                  value={style.id}
                  checked={selectedStyle === style.id}
                  onChange={() => setSelectedStyle(style.id)}
                  className="peer sr-only"
                />
                <span title={style.note} className="flex min-h-11 items-center rounded-lg px-3 text-xs font-medium text-foreground/70 ring-1 ring-border transition-colors duration-150 hover:bg-muted peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-primary/60 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground peer-disabled:pointer-events-none peer-disabled:opacity-50 motion-reduce:transition-none">
                  {style.title}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={onOpenSettings}
            disabled={isGenerating}
            className="flex min-h-11 min-w-0 items-center gap-2 self-start rounded-lg px-2 text-xs text-foreground/70 transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
          >
            <HugeiconsIcon icon={Settings02Icon} strokeWidth={1.5} className="size-4 shrink-0" />
            <span className="truncate">{providerConfig?.apiKey ? "Model settings" : "Connect image model"}</span>
          </button>
          {!formId && (
            <button
              type="submit"
              disabled={isGenerating}
              className="flex min-h-11 shrink-0 items-center justify-center gap-4 whitespace-nowrap rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {isGenerating ? "Creating your sheet…" : "Generate 9 variants"}
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
            </button>
          )}
        </div>

        <div role="status" aria-live="polite" aria-atomic="true">
          {isGenerating && (
            <div className="border-t border-border px-5 py-3 sm:px-6">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-foreground/75">
                <span>{stepMessage}</span>
                <span className="font-mono tabular-nums">{stepProgress}%</span>
              </div>
              <div role="progressbar" aria-label="Logo generation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stepProgress} className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full origin-left bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${stepProgress / 100})` }} />
              </div>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}
