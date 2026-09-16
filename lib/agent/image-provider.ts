import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateImage } from "ai"
import type { ProviderType } from "./types"

export interface GenerateImageOptions {
  provider: ProviderType
  apiKey: string
  baseURL?: string
  model: string
  prompt: string
  referenceBuffer?: Buffer
}

export async function generateImageBuffer(opts: GenerateImageOptions): Promise<Buffer> {
  const { provider, apiKey, baseURL, model, prompt, referenceBuffer } = opts

  // 1. If reference image is provided and using OpenAI or OpenAI-compatible
  if (referenceBuffer && (provider === "openai" || provider === "custom")) {
    try {
      const endpoint = baseURL
        ? `${baseURL.replace(/\/+$/, "")}/images/edits`
        : "https://api.openai.com/v1/images/edits"

      const formData = new FormData()
      formData.append(
        "image",
        new Blob([new Uint8Array(referenceBuffer)], { type: "image/png" }),
        "reference.png"
      )
      formData.append("prompt", prompt)
      formData.append("model", model)
      formData.append("size", "1024x1024")
      formData.append("response_format", "b64_json")
      // @ts-ignore - transparent background parameter for modern image models
      formData.append("background", "transparent")

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        const b64 = json.data?.[0]?.b64_json
        if (b64) {
          return Buffer.from(b64, "base64")
        }
      }
    } catch {
      // If edits endpoint fails or is unsupported on custom provider, fall back to generateImage
    }
  }

  // 2. OpenAI Official Generation
  if (provider === "openai") {
    const aiClient = createOpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    })

    const { image } = await generateImage({
      model: aiClient.image(model),
      prompt,
      providerOptions: {
        openai: {
          quality: "high",
          background: "transparent",
        },
      },
    })

    if (image.base64) {
      return Buffer.from(image.base64, "base64")
    }
    return Buffer.from(image.uint8Array)
  }

  // 3. Custom / OpenRouter Generation
  if (provider === "custom") {
    const cleanBaseURL = (baseURL || "").trim().replace(/\/+$/, "")
    const isOpenRouter = cleanBaseURL.includes("openrouter.ai")

    // Attempt 1: AI SDK generateImage (omitting proprietary providerOptions)
    try {
      const aiClient = createOpenAI({
        apiKey,
        baseURL: cleanBaseURL || undefined,
        headers: isOpenRouter
          ? {
              "HTTP-Referer": "https://mascen.app",
              "X-Title": "Mascen",
            }
          : undefined,
      })

      const { image } = await generateImage({
        model: aiClient.image(model),
        prompt,
      })

      if (image.base64) {
        return Buffer.from(image.base64, "base64")
      }
      if (image.uint8Array) {
        return Buffer.from(image.uint8Array)
      }
    } catch (aiErr: any) {
      console.warn("AI SDK generateImage fallback on custom provider:", aiErr.message)
    }

    // Attempt 2: Direct HTTP fetch to image generation endpoint
    const candidates = isOpenRouter
      ? ["https://openrouter.ai/api/v1/images", "https://openrouter.ai/api/v1/images/generations"]
      : cleanBaseURL.endsWith("/v1")
      ? [`${cleanBaseURL}/images/generations`, `${cleanBaseURL}/images`]
      : [`${cleanBaseURL}/v1/images/generations`, `${cleanBaseURL}/images/generations`, `${cleanBaseURL}/images`]

    const customHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }
    if (isOpenRouter) {
      customHeaders["HTTP-Referer"] = "https://mascen.app"
      customHeaders["X-Title"] = "Mascen"
    }

    for (const ep of candidates) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          headers: customHeaders,
          body: JSON.stringify({
            model,
            prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
          }),
        })

        if (res.ok) {
          const json = await res.json()
          const item = json.data?.[0]
          if (item?.b64_json) {
            return Buffer.from(item.b64_json, "base64")
          }
          if (item?.url) {
            const imgRes = await fetch(item.url)
            if (imgRes.ok) {
              const ab = await imgRes.arrayBuffer()
              return Buffer.from(ab)
            }
          }
        } else {
          const errText = await res.text().catch(() => "")
          console.warn(`Direct fetch to ${ep} returned ${res.status}:`, errText.slice(0, 200))
        }
      } catch (e: any) {
        console.warn(`Fetch error for ${ep}:`, e.message)
      }
    }

    throw new Error(
      `Failed to generate image with model "${model}" on custom endpoint ${cleanBaseURL}. Check model name and API key.`
    )
  }

  // 4. Google Gemini
  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({
      apiKey,
    })

    const { image } = await generateImage({
      model: google.image(model),
      prompt,
      aspectRatio: "1:1",
    })

    if (image.base64) {
      return Buffer.from(image.base64, "base64")
    }
    return Buffer.from(image.uint8Array)
  }

  throw new Error(`Unsupported provider: ${provider}`)
}
