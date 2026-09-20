import { NextResponse } from "next/server"
import type { DiscoveredModel, ProviderType } from "@/lib/agent/types"
import {
  getClientIp,
  getRateLimitHeaders,
  MODEL_DISCOVERY_LIMIT,
  rateLimiterInstance,
} from "@/lib/security/rate-limit"
import { isSafePublicUrl, sanitizeText } from "@/lib/security/sanitize"

export const runtime = "nodejs"
export const maxDuration = 30

interface ModelsRequestBody {
  provider: ProviderType
  apiKey?: string
  baseURL?: string
  customModels?: string[]
}

export async function POST(req: Request) {
  const clientIp = getClientIp(req.headers)
  const rateLimitResult = rateLimiterInstance.check(clientIp, MODEL_DISCOVERY_LIMIT)
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfter}s before discovering models again.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  let body: ModelsRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: rateLimitHeaders })
  }

  const { provider, apiKey = "", baseURL = "", customModels = [] } = body

  if (!provider) {
    return NextResponse.json({ error: "Missing provider field" }, { status: 400, headers: rateLimitHeaders })
  }

  // 1. OPENAI
  if (provider === "openai") {
    if (!apiKey.trim()) {
      return NextResponse.json({ error: "API key is required for OpenAI" }, { status: 400, headers: rateLimitHeaders })
    }

    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        signal: AbortSignal.timeout(10000),
      })

      if (res.ok) {
        const data = await res.json()
        const rows = (data.data || []).filter((m: { id: string }) =>
          m.id.startsWith("gpt-image") || m.id.startsWith("dall-e")
        )

        if (rows.length > 0) {
          const models: DiscoveredModel[] = rows.map((m: { id: string }) => ({
            id: m.id,
            name: m.id,
            provider: "openai",
            isDefault: m.id === "gpt-image-2" || m.id === "dall-e-3",
          }))
          return NextResponse.json({ models }, { headers: rateLimitHeaders })
        }
      }
    } catch (e: any) {
      console.warn("OpenAI model fetch warning:", e.message)
    }

    // Default fallback
    return NextResponse.json(
      {
        models: [
          { id: "gpt-image-2", name: "gpt-image-2 (Recommended, native alpha)", provider: "openai", isDefault: true },
          { id: "gpt-image-1.5", name: "gpt-image-1.5", provider: "openai" },
          { id: "dall-e-3", name: "dall-e-3 (High detail)", provider: "openai" },
          { id: "dall-e-2", name: "dall-e-2", provider: "openai" },
        ],
      },
      { headers: rateLimitHeaders }
    )
  }

  // 2. GEMINI
  if (provider === "gemini") {
    if (!apiKey.trim()) {
      return NextResponse.json({ error: "API key is required for Gemini" }, { status: 400, headers: rateLimitHeaders })
    }

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`,
        { signal: AbortSignal.timeout(10000) }
      )

      if (res.ok) {
        const data = await res.json()
        const rows = (data.models || []).filter((m: { name: string; supportedGenerationMethods?: string[] }) => {
          const name = m.name.toLowerCase()
          const methods = m.supportedGenerationMethods || []
          return (
            name.includes("imagen") ||
            methods.some((meth) => meth.toLowerCase().includes("image"))
          )
        })

        if (rows.length > 0) {
          const models: DiscoveredModel[] = rows.map((m: { name: string; displayName?: string }) => {
            const id = m.name.replace(/^models\//, "")
            return {
              id,
              name: m.displayName || id,
              provider: "gemini",
              isDefault: id.includes("imagen-3"),
            }
          })
          return NextResponse.json({ models }, { headers: rateLimitHeaders })
        }
      }
    } catch (e: any) {
      console.warn("Gemini model fetch warning:", e.message)
    }

    // Default fallback
    return NextResponse.json(
      {
        models: [
          { id: "imagen-3.0-generate-002", name: "imagen-3.0-generate-002 (Latest Imagen)", provider: "gemini", isDefault: true },
          { id: "imagen-3.0-fast-generate-001", name: "imagen-3.0-fast-generate-001", provider: "gemini" },
        ],
      },
      { headers: rateLimitHeaders }
    )
  }

  // 3. CUSTOM / OPENROUTER
  if (provider === "custom") {
    const rawUrl = (baseURL || "").trim().replace(/\/+$/, "")
    if (!rawUrl) {
      return NextResponse.json({ error: "Please provide a Base URL for custom provider." }, { status: 400, headers: rateLimitHeaders })
    }

    if (!isSafePublicUrl(rawUrl)) {
      return NextResponse.json(
        { error: "Invalid or restricted Base URL. Private networks, loopback, and cloud metadata addresses are forbidden." },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    const isOpenRouter = rawUrl.includes("openrouter.ai")

    // Construct candidate endpoints to query
    const candidates: string[] = []
    if (isOpenRouter) {
      candidates.push("https://openrouter.ai/api/v1/images/models")
      candidates.push("https://openrouter.ai/api/v1/models")
    } else {
      if (rawUrl.endsWith("/v1")) {
        candidates.push(`${rawUrl}/images/models`, `${rawUrl}/models`)
      } else {
        candidates.push(
          `${rawUrl}/v1/images/models`,
          `${rawUrl}/images/models`,
          `${rawUrl}/v1/models`,
          `${rawUrl}/models`
        )
      }
    }

    const seen = new Set<string>()
    let discovered: DiscoveredModel[] = []
    let lastError: string | null = null

    const headers: Record<string, string> = {
      accept: "application/json",
      "User-Agent": "mascen-cli/1.0",
    }
    if (apiKey.trim()) {
      headers.authorization = `Bearer ${apiKey.trim()}`
    }
    if (isOpenRouter) {
      headers["HTTP-Referer"] = "https://mascen.app"
      headers["X-Title"] = "Mascen"
    }

    for (const url of candidates) {
      if (seen.has(url)) continue
      seen.add(url)

      try {
        const res = await fetch(url, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(10000),
        })

        if (res.ok) {
          const json = await res.json()
          const rows = Array.isArray(json)
            ? json
            : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.models)
            ? json.models
            : []

          if (rows.length > 0) {
            const isImagesModelsEndpoint = url.includes("/images/models")

            for (const r of rows) {
              const id = String(r.id || r.name || "")
              if (!id) continue

              const name = String(r.name || id)
              const desc = String(r.description || "")
              const arch = (r.architecture || {}) as Record<string, unknown>
              const outputMods: string[] = Array.isArray(arch.output_modalities)
                ? (arch.output_modalities as unknown[]).map(String)
                : []
              const modality = String(arch.modality || "")
              const tags: string[] = Array.isArray(r.tags)
                ? (r.tags as unknown[]).map(String)
                : []

              // If it came from /images/models, it is guaranteed to be an image generation model
              let isImage = isImagesModelsEndpoint

              if (!isImage) {
                // Check architecture modalities
                if (outputMods.some((m: string) => m.toLowerCase().includes("image"))) isImage = true
                else if (modality.includes("image") || modality.includes("->image")) isImage = true
                else if (tags.some((t: string) => t.toLowerCase().includes("image") || t.toLowerCase().includes("diffusion"))) isImage = true
                else {
                  // Regex match against ID, name, description
                  const text = `${id} ${name} ${desc}`.toLowerCase()
                  if (
                    /image|dall-e|imagen|flux|sdxl|diffusion|banana|recraft|ideogram|midjourney|seedream|muse|fugu|paint|canvas/i.test(
                      text
                    )
                  ) {
                    isImage = true
                  }
                }
              }

              // On custom endpoints (non-OpenRouter generic proxies), if no image filtering matched, include them anyway so custom models aren't blocked
              if (!isOpenRouter && rows.length <= 50) {
                isImage = true
              }

              if (isImage) {
                discovered.push({
                  id,
                  name,
                  provider: "custom",
                  isDefault:
                    id.includes("nano-banana") ||
                    id.includes("gemini-3.1-flash-lite-image") ||
                    id.includes("flux") ||
                    id === "dall-e-3",
                })
              }
            }

            if (discovered.length > 0) {
              break
            }
          }
        } else {
          lastError = `HTTP ${res.status} from ${url}`
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    // Merge manual customModels if supplied
    const finalModels: DiscoveredModel[] = []
    const addedIds = new Set<string>()

    // 1. Put explicitly entered custom models first
    for (const cm of customModels) {
      const clean = cm.trim()
      if (clean && !addedIds.has(clean)) {
        addedIds.add(clean)
        finalModels.push({
          id: clean,
          name: `${clean} (Custom Entry)`,
          provider: "custom",
          isDefault: true,
        })
      }
    }

    // 2. Add discovered models
    for (const m of discovered) {
      if (!addedIds.has(m.id)) {
        addedIds.add(m.id)
        finalModels.push(m)
      }
    }

    // Fallback if none discovered
    if (finalModels.length === 0) {
      if (isOpenRouter) {
        finalModels.push(
          { id: "google/gemini-3.1-flash-lite-image", name: "Google: Nano Banana 2 Lite (Gemini 3.1 Flash Lite Image)", provider: "custom", isDefault: true },
          { id: "google/gemini-3.1-flash-image", name: "Google: Gemini 3.1 Flash Image", provider: "custom" },
          { id: "black-forest-labs/flux-1.1-pro", name: "FLUX 1.1 Pro", provider: "custom" },
          { id: "recraft/recraft-v4-styles-pro", name: "Recraft V4 Styles Pro", provider: "custom" },
          { id: "openai/dall-e-3", name: "OpenAI: DALL-E 3", provider: "custom" }
        )
      } else {
        finalModels.push(
          { id: "flux-1.1-pro", name: "FLUX 1.1 Pro", provider: "custom", isDefault: true },
          { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "SDXL Base 1.0", provider: "custom" },
          { id: "dall-e-3", name: "dall-e-3", provider: "custom" }
        )
      }
    }

    return NextResponse.json(
      {
        models: finalModels,
        count: finalModels.length,
        warning: discovered.length === 0 && lastError ? lastError : undefined,
      },
      { headers: rateLimitHeaders }
    )
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400, headers: rateLimitHeaders })
}
