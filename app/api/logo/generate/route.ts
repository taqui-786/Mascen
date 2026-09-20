import { NextRequest } from "next/server"
import { generateImageBuffer } from "@/lib/agent/image-provider"
import { buildMascotLogoSheetPrompt } from "@/lib/agent/logo-prompts"
import type { ProviderType } from "@/lib/agent/types"
import { isR2Configured, uploadMascotToR2 } from "@/lib/storage/r2"
import { db } from "@/lib/db"
import { mascotLogos } from "@/lib/db/schema"
import {
  getClientIp,
  getRateLimitHeaders,
  LOGO_GEN_LIMIT,
  rateLimiterInstance,
} from "@/lib/security/rate-limit"
import {
  validateBrandName,
  validatePrompt,
  validateTagline,
} from "@/lib/security/sanitize"

import fs from "fs/promises"
import path from "path"
import os from "os"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers)
  const rateLimitResult = rateLimiterInstance.check(clientIp, LOGO_GEN_LIMIT)
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)

  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfter}s before generating again.`,
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders,
        },
      }
    )
  }

  const provider = (req.headers.get("x-provider") || "openai") as ProviderType
  const apiKey = req.headers.get("x-api-key") || ""
  const baseURL = req.headers.get("x-base-url") || undefined
  const model = req.headers.get("x-model") || "dall-e-3"

  if (!apiKey.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing API Key. Please configure your API key in Settings." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders,
        },
      }
    )
  }

  const formData = await req.formData()
  const prompt = validatePrompt(formData.get("prompt"))
  const brandName = validateBrandName(formData.get("brandName"))
  const tagline = validateTagline(formData.get("tagline"))
  const style = (formData.get("style") as string || "modern-3d").slice(0, 32)
  const layout = "icon-only"

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // 1. Build Prompt
        sendEvent("status", {
          step: "BUILDING_PROMPT",
          message: `Building 3×3 nine-variant logo sheet prompt for "${brandName}"...`,
          progress: 15,
        })

        const masterPrompt = buildMascotLogoSheetPrompt({ brandName, describe: prompt, style, tagline })

        // 2. Generate Image with AI Provider
        sendEvent("status", {
          step: "GENERATING_LOGO",
          message: `Generating mascot logo with ${provider} (${model})...`,
          progress: 45,
        })

        const imageBuffer = await generateImageBuffer({
          provider,
          apiKey,
          baseURL,
          model,
          prompt: masterPrompt,
        })

        // 3. Storage / Asset URL Resolution with Alpha Extraction & Grid Normalization
        sendEvent("status", {
          step: "OPTIMIZING_ASSET",
          message: "Extracting transparent alpha channel and isolating 3x3 logo marks...",
          progress: 75,
        })

        let finalBuffer = imageBuffer
        let scratchDir = ""
        try {
          scratchDir = await fs.mkdtemp(path.join(os.tmpdir(), "logo-build-"))
          const rawPath = path.join(scratchDir, "raw.png")
          const cleanPath = path.join(scratchDir, "clean.png")
          await fs.writeFile(rawPath, imageBuffer)

          const pythonScript = path.join(process.cwd(), "lib", "pipeline", "build_logo.py")
          await execFileAsync("python3", [pythonScript, rawPath, cleanPath])
          finalBuffer = await fs.readFile(cleanPath)
        } catch (procErr) {
          console.warn("Logo transparency/cleanup pipeline warning (fallback to raw):", procErr)
        } finally {
          if (scratchDir) {
            await fs.rm(scratchDir, { recursive: true, force: true }).catch(() => {})
          }
        }

        let imageUrl = ""
        const timestamp = Date.now()
        const slug = brandName.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24) || "logo"

        if (isR2Configured) {
          try {
            const key = `logos/${slug}/${timestamp}.png`
            const uploadedUrl = await uploadMascotToR2({
              buffer: finalBuffer,
              key,
              contentType: "image/png",
            })
            if (uploadedUrl) imageUrl = uploadedUrl
          } catch (r2Err) {
            console.error("R2 upload error for logo:", r2Err)
          }
        }

        if (!imageUrl) {
          imageUrl = `data:image/png;base64,${finalBuffer.toString("base64")}`
        }

        // 4. Save to Database Feed (Phase 1 Table)
        sendEvent("status", {
          step: "SAVING_TO_FEED",
          message: "Saving logo to database feed...",
          progress: 92,
        })

        let logoId = `logo-${timestamp}`
        if (db) {
          try {
            const [saved] = await db
              .insert(mascotLogos)
              .values({
                name: brandName,
                prompt,
                style,
                imageUrl,
                tagline,
                layout,
                provider,
                model,
                likesCount: 0,
              })
              .returning()

            if (saved?.id) logoId = saved.id
          } catch (dbErr) {
            console.error("Failed to save generated logo to DB:", dbErr)
          }
        }

        // 5. Complete Event
        sendEvent("complete", {
          id: logoId,
          title: brandName,
          prompt,
          style,
          tagline,
          imageUrl,
          progress: 100,
        })

        controller.close()
      } catch (err: unknown) {
        console.error("Logo generation failed:", err)
        const errorMessage = err instanceof Error ? err.message : "Unknown logo generation error"
        sendEvent("error", { message: errorMessage })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...rateLimitHeaders,
    },
  })
}
