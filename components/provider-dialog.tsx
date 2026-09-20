"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { fetchImageModels } from "@/lib/agent/model-discovery"
import type { DiscoveredModel, ProviderType } from "@/lib/agent/types"
import {
  getProviderConfig,
  saveProviderConfig,
  type StoredProviderConfig,
} from "@/lib/storage/indexed-db"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  AiBrain01Icon,
  CheckmarkCircle02Icon,
  EyeClosedIcon,
  EyeIcon,
  Search01Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"

interface ProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfigured?: (config: StoredProviderConfig) => void
}

const PRESET_ENDPOINTS = [
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1" },
  { label: "Together AI", url: "https://api.together.xyz/v1" },
  { label: "Local (Ollama)", url: "http://localhost:11434/v1" },
]

export function ProviderDialog({
  open,
  onOpenChange,
  onConfigured,
}: ProviderDialogProps) {
  const [provider, setProvider] = useState<ProviderType>("openai")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [baseURL, setBaseURL] = useState("")
  const [models, setModels] = useState<DiscoveredModel[]>([])
  const [customModels, setCustomModels] = useState<string[]>([])
  const [customModelInput, setCustomModelInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    getProviderConfig().then((cfg) => {
      if (cfg) {
        setProvider(cfg.provider)
        setApiKey(cfg.apiKey || "")
        setBaseURL(cfg.baseURL || "")
        setSelectedModel(cfg.selectedModel || "")
        const savedCustoms = cfg.customModels || []
        setCustomModels(savedCustoms)

        if (cfg.apiKey || cfg.provider === "custom") {
          fetchModelsFor(cfg.provider, cfg.apiKey, cfg.baseURL, cfg.selectedModel, savedCustoms)
        }
      } else {
        fetchModelsFor("openai", "", "", "gpt-image-2", [])
      }
    })
  }, [open])

  async function fetchModelsFor(
    prov: ProviderType,
    key: string,
    base?: string,
    preferred?: string,
    manualModels: string[] = customModels
  ) {
    setIsFetchingModels(true)
    setFetchError(null)

    try {
      const list = await fetchImageModels({
        provider: prov,
        apiKey: key,
        baseURL: base,
        customModels: manualModels,
      })
      setModels(list)

      if (preferred && list.some((m) => m.id === preferred)) {
        setSelectedModel(preferred)
      } else if (list.length > 0) {
        const def = list.find((m) => m.isDefault) || list[0]
        setSelectedModel(def.id)
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to discover image models.")
      setModels([])
    } finally {
      setIsFetchingModels(false)
    }
  }

  function handleProviderChange(val: string) {
    const next = val as ProviderType
    setProvider(next)
    setModels([])
    setSelectedModel("")
    setFetchError(null)
    setSearchQuery("")

    if (next === "custom" && !baseURL) {
      setBaseURL("https://openrouter.ai/api/v1")
    }

    if (apiKey || next === "custom") {
      fetchModelsFor(next, apiKey, next === "custom" ? baseURL || "https://openrouter.ai/api/v1" : undefined)
    }
  }

  function handleAddCustomModel() {
    const trimmed = customModelInput.trim()
    if (!trimmed) return

    if (!customModels.includes(trimmed)) {
      const updated = [trimmed, ...customModels]
      setCustomModels(updated)
      const newEntry: DiscoveredModel = {
        id: trimmed,
        name: `${trimmed} (Custom)`,
        provider: "custom",
        isDefault: true,
      }
      setModels((prev) => [newEntry, ...prev.filter((m) => m.id !== trimmed)])
      setSelectedModel(trimmed)
    } else {
      setSelectedModel(trimmed)
    }
    setCustomModelInput("")
  }

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models
    const q = searchQuery.toLowerCase()
    return models.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    )
  }, [models, searchQuery])

  async function handleSave() {
    if (!apiKey.trim()) {
      setFetchError("Please enter your API key.")
      return
    }
    if (!selectedModel) {
      setFetchError("Please select or enter an image generation model.")
      return
    }

    const config: StoredProviderConfig = {
      provider,
      apiKey: apiKey.trim(),
      baseURL: provider === "custom" ? baseURL.trim() : undefined,
      selectedModel,
      customModels,
    }

    await saveProviderConfig(config)
    setSavedSuccess(true)
    onConfigured?.(config)
    setTimeout(() => {
      setSavedSuccess(false)
      onOpenChange(false)
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <HugeiconsIcon icon={AiBrain01Icon} className="size-5" />
            <DialogTitle>Connect AI Provider</DialogTitle>
          </div>
          <DialogDescription>
            Bring your own key (BYOK). Keys remain in browser storage and are never persisted on our server.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4 py-1">
          {/* Provider Selection */}
          <Field>
            <FieldLabel>Provider</FieldLabel>
            <ToggleGroup
              value={[provider]}
              onValueChange={(val) => val[0] && handleProviderChange(val[0])}
              variant="outline"
              className="grid grid-cols-3 gap-1"
            >
              <ToggleGroupItem value="openai">OpenAI</ToggleGroupItem>
              <ToggleGroupItem value="gemini">Gemini</ToggleGroupItem>
              <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
            </ToggleGroup>
          </Field>

          {/* Custom Base URL & Presets */}
          {provider === "custom" && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="base-url">Base URL (OpenAI-compatible)</FieldLabel>
                <div className="flex gap-1">
                  {PRESET_ENDPOINTS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setBaseURL(preset.url)
                        fetchModelsFor(provider, apiKey, preset.url)
                      }}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                id="base-url"
                placeholder="https://openrouter.ai/api/v1"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                className="font-mono text-xs"
              />
            </Field>
          )}

          {/* API Key Input */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="api-key">
                {provider === "openai"
                  ? "OpenAI API Key"
                  : provider === "gemini"
                  ? "Google Gemini API Key"
                  : "API Key"}
              </FieldLabel>
              {provider === "custom" && baseURL.includes("openrouter.ai") && (
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Get OpenRouter Key
                </a>
              )}
              {provider === "openai" && (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Get OpenAI Key
                </a>
              )}
              {provider === "gemini" && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Get Gemini Key
                </a>
              )}
            </div>

            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={
                    provider === "openai"
                      ? "sk-proj-..."
                      : provider === "gemini"
                      ? "AIzaSy..."
                      : "sk-or-v1-..."
                  }
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    if (fetchError) setFetchError(null)
                  }}
                  className="pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  <HugeiconsIcon
                    icon={showApiKey ? EyeClosedIcon : EyeIcon}
                    className="size-4"
                  />
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isFetchingModels || (!apiKey.trim() && provider !== "custom")}
                onClick={() => fetchModelsFor(provider, apiKey, baseURL)}
                className="gap-1.5 shrink-0"
              >
                {isFetchingModels ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <HugeiconsIcon icon={Search01Icon} className="size-3.5" />
                )}
                Fetch Models
              </Button>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={SecurityCheckIcon} className="size-3.5 text-emerald-600" />
              <span>Filters exclusively for text-to-image models.</span>
            </div>
          </Field>

          {/* Error Message */}
          {fetchError && <FieldError>{fetchError}</FieldError>}

          {/* Custom Model Manual Entry (Drawva Pattern) */}
          {provider === "custom" && (
            <Field>
              <FieldLabel htmlFor="custom-model-input">
                Or Enter Specific Model ID
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="custom-model-input"
                  placeholder="e.g. google/nano-banana-2-lite or flux-schnell"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustomModel()
                    }
                  }}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!customModelInput.trim()}
                  onClick={handleAddCustomModel}
                  className="shrink-0 gap-1"
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                  Set Model
                </Button>
              </div>
            </Field>
          )}

          {/* Discovered Models Section */}
          {models.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Available Image Models
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {models.length} Discovered
                </Badge>
              </div>

              {/* Quick Search Filter for large lists (like OpenRouter 50+ models) */}
              {models.length > 5 && (
                <div className="relative">
                  <Input
                    placeholder="Search models (e.g. banana, flux, recraft, dall-e)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
                  />
                </div>
              )}

              {/* Dropdown Select */}
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {filteredModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id} {m.isDefault ? "★" : ""}
                  </option>
                ))}
              </select>

              {selectedModel && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 font-mono truncate">
                  <span>Selected: <strong className="text-foreground">{selectedModel}</strong></span>
                </div>
              )}
            </div>
          )}
        </FieldGroup>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!apiKey.trim() || !selectedModel || isFetchingModels}
            onClick={handleSave}
            className="gap-1.5"
          >
            {savedSuccess ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
                Connected!
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
