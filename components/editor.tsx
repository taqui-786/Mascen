"use client"

import { useEffect, useRef, useState } from "react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download01Icon,
  ImageAdd01Icon,
  ImageUpload01Icon,
  Key01Icon,
  SparklesIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { ExampleGallery } from "@/components/example-gallery"
import { PreviewStage } from "@/components/preview-stage"
import { ProviderDialog } from "@/components/provider-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
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
import type { AgentSSEEvent } from "@/lib/agent/types"

type Mode = ExampleMode

export function Editor() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>("prompt")
  const [prompt, setPrompt] = useState("")
  const [label, setLabel] = useState(TAQUI.title)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [promptError, setPromptError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [previewReady, setPreviewReady] = useState(true)
  const [picked, setPicked] = useState(TAQUI)
  const [pickedStyle, setPickedStyle] = useState<string | null>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)

  // Provider State
  const [providerConfig, setProviderConfig] = useState<StoredProviderConfig | null>(null)
  const [isProviderOpen, setIsProviderOpen] = useState(false)

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [stepMessage, setStepMessage] = useState("")
  const [stepProgress, setStepProgress] = useState(0)
  const [metrics, setMetrics] = useState<{
    shift: number
    paletteMatch: number
    widthChange: number
  } | null>(null)
  const [generatedUrls, setGeneratedUrls] = useState<{
    directions: string
    reactions: string
  } | null>(null)

  useEffect(() => {
    getProviderConfig().then((cfg) => {
      if (cfg) setProviderConfig(cfg)
    })
  }, [])

  function applyExample(example: MascotExample) {
    setPicked(example)
    setPickedStyle(null)
    setMode(example.mode)
    setPrompt(example.prompt)
    setLabel(example.title)
    setPromptError(null)
    setPhotoError(null)
    setPreviewReady(true)
    setGeneratedUrls(null)
    setMetrics(null)
    if (example.mode === "prompt") clearPhoto()
  }

  function applyStyle(style: StyleLook) {
    setPickedStyle(style.id)
    setPrompt(style.prompt)
    setPreviewReady(true)
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
    setGeneratedUrls(null)
    setMetrics(null)
    if (style.id !== "photo") clearPhoto()
  }

  function makeYourOwn() {
    setMode("prompt")
    setPicked(TAQUI)
    setPickedStyle(null)
    setLabel(TAQUI.title)
    setPrompt("")
    setPromptError(null)
    setPhotoError(null)
    setGeneratedUrls(null)
    setMetrics(null)
    clearPhoto()
    promptRef.current?.focus()
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

  async function onGenerate(event: React.FormEvent) {
    event.preventDefault()
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
        description: "Please add your API key to generate mascots.",
      })
      return
    }

    setIsGenerating(true)
    setStepMessage("Initializing mascot generation...")
    setStepProgress(5)
    setMetrics(null)
    setGeneratedUrls(null)

    try {
      const formData = new FormData()
      formData.append("prompt", trimmed)
      formData.append("name", label || "mascot")
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

          try {
            const event = JSON.parse(match[1]) as AgentSSEEvent

            if (event.type === "step") {
              setStepMessage(event.message)
              setStepProgress(event.progress)
            } else if (event.type === "metrics") {
              setMetrics(event.data)
            } else if (event.type === "done") {
              const resObj = event.result
              setGeneratedUrls({
                directions: resObj.directionsUrl,
                reactions: resObj.reactionsUrl,
              })
              setPicked({
                id: resObj.name,
                title: resObj.name,
                prompt: trimmed,
                mode,
                directions: resObj.directionsUrl,
                reactions: resObj.reactionsUrl,
                image: resObj.directionsUrl,
              })
              setPreviewReady(true)

              // Save to IndexedDB
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
                description: `${resObj.name} is now interactive and ready to use.`,
              })
            } else if (event.type === "error") {
              throw new Error(event.error)
            }
          } catch (jsonErr: any) {
            console.warn("Event parse error:", jsonErr)
          }
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err)
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
    setGeneratedUrls(null)
    clearPhoto()
  }

  function copyReactCode() {
    const code = `<Mascot\n  directions="${picked.directions}"\n  reactions="${picked.reactions}"\n  label="${label || picked.title}"\n  size={140}\n/>`
    navigator.clipboard.writeText(code)
    toast.add({
      type: "success",
      title: "Copied code",
      description: "React component snippet copied to clipboard.",
    })
  }

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] lg:overflow-hidden">
      <section className="flex flex-col overflow-y-auto border-b px-4 py-8 md:px-6 lg:border-r lg:border-b-0">
        <form
          id="mascot-form"
          onSubmit={onGenerate}
          className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6"
        >
          <div className="flex items-center justify-between gap-2 border-b pb-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                Make a mascot
              </h1>
              <p className="text-xs text-muted-foreground">
                Describe a head & shoulders, or attach a photo.
              </p>
            </div>

            {/* Provider Pill */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProviderOpen(true)}
              className="h-8 gap-1.5 text-xs font-normal"
            >
              <HugeiconsIcon icon={Key01Icon} className="size-3.5 text-primary" />
              {providerConfig?.apiKey ? (
                <span className="truncate max-w-[100px]">
                  {providerConfig.provider}
                </span>
              ) : (
                "Connect AI"
              )}
            </Button>
          </div>

          <FieldGroup className="gap-5">
            <ToggleGroup
              value={[mode]}
              onValueChange={(value) => {
                const next = value[0]
                if (next === "prompt" || next === "photo") setMode(next)
              }}
              variant="outline"
              spacing={2}
            >
              <ToggleGroupItem value="prompt">
                <HugeiconsIcon icon={TextFontIcon} data-icon="inline-start" />
                Prompt
              </ToggleGroupItem>
              <ToggleGroupItem value="photo">
                <HugeiconsIcon icon={ImageAdd01Icon} data-icon="inline-start" />
                Photo
              </ToggleGroupItem>
            </ToggleGroup>

            {mode === "photo" ? (
              <Field data-invalid={photoError ? true : undefined}>
                <FieldLabel htmlFor="reference">Reference</FieldLabel>
                <input
                  ref={fileRef}
                  id="reference"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  aria-invalid={photoError ? true : undefined}
                  onChange={(event) =>
                    onPhotoChange(event.target.files?.[0] ?? null)
                  }
                />
                {file && filePreview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Reference preview"
                      className="size-12 rounded-lg object-cover"
                    />
                    <p className="min-w-0 flex-1 truncate text-sm">{file.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={clearPhoto}
                      aria-label="Remove photo"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    <HugeiconsIcon
                      icon={ImageUpload01Icon}
                      data-icon="inline-start"
                    />
                    Choose image
                  </Button>
                )}
                {photoError ? <FieldError>{photoError}</FieldError> : null}
              </Field>
            ) : null}

            <Field data-invalid={promptError ? true : undefined}>
              <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
              <Textarea
                ref={promptRef}
                id="prompt"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value)
                  if (event.target.value.trim()) setPromptError(null)
                }}
                aria-invalid={promptError ? true : undefined}
                placeholder={
                  mode === "photo"
                    ? "make one that looks like me, chibi, neat bun, round glasses"
                    : "a chibi otter with chocolate-brown fur, a cream muzzle and dark ear tips"
                }
                rows={5}
                className="min-h-28 resize-none"
              />
              {promptError ? <FieldError>{promptError}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="label">Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Taqui"
                />
                {label ? (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Clear name"
                      onClick={() => setLabel("")}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} />
                    </InputGroupButton>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            </Field>
          </FieldGroup>

          {/* Real-Time Generation Stepper */}
          {isGenerating && (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div className="flex items-center justify-between text-xs font-medium text-primary">
                <span className="flex items-center gap-1.5">
                  <Spinner className="size-3.5" />
                  Generating Mascot
                </span>
                <span>{stepProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{stepMessage}</p>
            </div>
          )}

          <div className="mt-auto flex items-center gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isGenerating}
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="flex-1 gap-2"
            >
              {isGenerating ? (
                <>
                  <Spinner className="size-4" />
                  Generating...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/20">
        <div className="shrink-0 bg-background">
          {previewReady ? (
            <div className="flex flex-col">
              <PreviewStage
                label={label || picked.title}
                slug={picked.id}
                directions={picked.directions}
                reactions={picked.reactions}
              />
              {metrics && (
                <div className="flex flex-wrap items-center justify-center gap-2 border-b bg-muted/30 py-2 text-xs">
                  <Badge variant={metrics.shift <= 2 ? "outline" : "destructive"}>
                    Boop Shift: {metrics.shift}px
                  </Badge>
                  <Badge variant="outline">
                    Palette: {metrics.paletteMatch}%
                  </Badge>
                  <Badge variant="outline">
                    Shoulder Variance: {metrics.widthChange}%
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={ImageAdd01Icon} />
                  </EmptyMedia>
                  <EmptyTitle>Nothing to preview</EmptyTitle>
                  <EmptyDescription>
                    Write a prompt and generate. The live mascot shows up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>

        <div className="bg-background px-4 py-6 md:px-6">
          <ExampleGallery
            picked={picked.id}
            pickedStyle={pickedStyle}
            onPick={applyExample}
            onPickStyle={applyStyle}
            onMakeYourOwn={makeYourOwn}
          />
        </div>
      </section>

      {/* Provider Dialog */}
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
