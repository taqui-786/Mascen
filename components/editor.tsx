"use client"

import { useRef, useState } from "react"
import {
  Cancel01Icon,
  ImageAdd01Icon,
  ImageUpload01Icon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { ExampleGallery } from "@/components/example-gallery"
import { PreviewStage } from "@/components/preview-stage"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  TAQUI,
  type ExampleMode,
  type MascotExample,
  type StyleLook,
} from "@/lib/examples"

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

  function applyExample(example: MascotExample) {
    setPicked(example)
    setPickedStyle(null)
    setMode(example.mode)
    setPrompt(example.prompt)
    setLabel(example.title)
    setPromptError(null)
    setPhotoError(null)
    setPreviewReady(true)
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

  function onGenerate(event: React.FormEvent) {
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

    setPreviewReady(true)
    toast.add({
      type: "info",
      title: "Generation is not wired yet",
      description: "The image agent lands in the next step.",
    })
  }

  function onReset() {
    setPrompt("")
    setLabel(TAQUI.title)
    setMode("prompt")
    setPromptError(null)
    setPhotoError(null)
    setPicked(TAQUI)
    setPickedStyle(null)
    clearPhoto()
  }

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)] lg:overflow-hidden">
      <section className="flex flex-col overflow-y-auto border-b px-4 py-8 md:px-6 lg:border-r lg:border-b-0">
        <form
          id="mascot-form"
          onSubmit={onGenerate}
          className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8"
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Make a mascot
            </h1>
            <p className="max-w-[36ch] text-sm text-muted-foreground">
              Describe a head and shoulders, or attach a photo of yourself.
            </p>
          </div>

          <FieldGroup className="gap-6">
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
                rows={6}
                className="min-h-36 resize-none"
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

          <div className="mt-auto flex items-center gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button type="submit" className="flex-1">
              Generate
            </Button>
          </div>
        </form>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/20">
        <div className="shrink-0 bg-background">
          {previewReady ? (
            <PreviewStage
              label={label || picked.title}
              slug={picked.id}
              directions={picked.directions}
              reactions={picked.reactions}
            />
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

    </div>
  )
}

