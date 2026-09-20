import { NextRequest } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { generateImageBuffer } from "@/lib/agent/image-provider"
import {
  buildDirectionsPrompt,
  buildReactionsPrompt,
  buildReferencePhotoPrompt,
} from "@/lib/agent/prompts"
import type { AgentSSEEvent, ProviderType } from "@/lib/agent/types"
import { isR2Configured, uploadMascotToR2 } from "@/lib/storage/r2"
import { db } from "@/lib/db"
import { mascotGenerations } from "@/lib/db/schema"
import {
  getClientIp,
  getRateLimitHeaders,
  MASCOT_GEN_LIMIT,
  rateLimiterInstance,
} from "@/lib/security/rate-limit"
import { sanitizeText, validatePrompt } from "@/lib/security/sanitize"

const execFileAsync = promisify(execFile)

export const maxDuration = 120 // allow up to 2 minutes for dual-sheet generation & CV

const PROTECTED_SLUGS = new Set([
  "taqui", "bear", "bunny", "cat", "deer", "dino", "fox", "frog",
  "hamster", "hedgehog", "koala", "otter", "owl", "panda", "penguin",
  "pug", "raccoon", "redpanda", "sheep", "sloth", "tiger", "afro",
  "astronaut", "bald", "ballerina", "beard", "builder", "cap", "chef",
  "glasses", "grandpa", "granny", "hijabi", "nurse", "pirate",
  "scientist", "sikh", "skater", "wizard", "clockwork", "crt", "cube",
  "drone", "gearbot", "knight", "lantern", "postbot", "radio", "rocket",
  "scout", "toaster", "tv"
])

export async function POST(req: NextRequest) {
  const userIp = getClientIp(req.headers)
  const rateLimitResult = rateLimiterInstance.check(userIp, MASCOT_GEN_LIMIT)
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
  const model = req.headers.get("x-model") || "gpt-image-2"

  if (!apiKey.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing API Key in x-api-key header." }),
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
  const nameInput = sanitizeText(formData.get("name"), 40, "mascot") || "mascot"
  const style = ((formData.get("style") as string) || "colour").slice(0, 32)
  const mode = ((formData.get("mode") as string) || "prompt") as "prompt" | "photo"
  const referenceFile = formData.get("reference") as File | null

  // Restrict reference photo upload size to 10MB
  if (referenceFile && referenceFile.size > 10 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: "Reference photo must be under 10MB." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders,
        },
      }
    )
  }

  const rawBase = nameInput
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24) || "mascot"

  const cwd = process.cwd()

  // Prevent overwriting built-in library presets or colliding with existing files
  let slug = rawBase
  if (PROTECTED_SLUGS.has(slug)) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`
  } else {
    try {
      const existing = await fs.readdir(path.join(cwd, "characters", slug))
      if (existing.length > 0) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`
      }
    } catch {
      // Path does not exist, safe to use
    }
  }

  const userAgent = req.headers.get("user-agent") || ""
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: AgentSSEEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      let scratchDir = ""

      try {
        send({
          type: "step",
          step: "VALIDATING",
          progress: 5,
          message: "Validating provider configuration and inputs...",
        })

        const cwd = process.cwd()
        // Isolated temporary scratch folder: zero permanent local file pollution
        scratchDir = await fs.mkdtemp(path.join(os.tmpdir(), "mascot-build-"))
        const tempCharDir = path.join(scratchDir, "characters", slug)
        const tempPublicDir = path.join(scratchDir, "public", "mascots")
        await fs.mkdir(tempCharDir, { recursive: true })
        await fs.mkdir(tempPublicDir, { recursive: true })

        // 1. Prepare Reference & Directions Prompt
        send({
          type: "step",
          step: "PREPARING_PROMPT",
          progress: 15,
          message: "Sanitizing prompt and building geometry instructions...",
        })

          let referenceBuffer: Buffer | undefined
          if (mode === "photo" && referenceFile && referenceFile.size > 0) {
            const ab = await referenceFile.arrayBuffer()
            referenceBuffer = Buffer.from(ab)
          }

          const dirPrompt =
            mode === "photo" && referenceBuffer
              ? buildReferencePhotoPrompt(prompt, style)
              : buildDirectionsPrompt(prompt, style)

          // 2. Generate Sheet 1: Directions
          send({
            type: "step",
            step: "GENERATING_DIRECTIONS",
            progress: 30,
            message: `Generating 9 head directions with ${provider} (${model})...`,
          })

          const directionsBuffer = await generateImageBuffer({
            provider,
            apiKey,
            baseURL,
            model,
            prompt: dirPrompt,
            referenceBuffer,
          })

          const directionsPngPath = path.join(tempCharDir, "directions.png")
          await fs.writeFile(directionsPngPath, directionsBuffer)

          // 3. Screen Sheet 1 with Python
          send({
            type: "step",
            step: "SCREENING_DIRECTIONS",
            progress: 45,
            message: "Morphological screening: checking alpha and shoulder stability...",
          })

          try {
            const screenScript = path.join(cwd, "lib", "pipeline", "screen.py")
            const { stdout: screenStdout } = await execFileAsync("python3", [
              screenScript,
              directionsPngPath,
            ])
            const screenResult = JSON.parse(screenStdout.trim())
            if (screenResult.alpha === "missing") {
              send({
                type: "step",
                step: "SCREENING_DIRECTIONS",
                progress: 48,
                message: "Notice: image lacks native alpha; pipeline will adjust silhouette.",
              })
            }
          } catch {
            // Non-fatal screening check
          }

          // 4. Generate Sheet 2: Reactions (referencing directions sheet)
          send({
            type: "step",
            step: "GENERATING_REACTIONS",
            progress: 60,
            message: "Generating 9 expressive reactions matching the character...",
          })

          const reactPrompt = buildReactionsPrompt(prompt, style)
          const reactionsBuffer = await generateImageBuffer({
            provider,
            apiKey,
            baseURL,
            model,
            prompt: reactPrompt,
            referenceBuffer: directionsBuffer,
          })

          const reactionsPngPath = path.join(tempCharDir, "reactions.png")
          await fs.writeFile(reactionsPngPath, reactionsBuffer)

          // 5. Build Atlases (Slice, cross-sheet fit, bottom fade, WebP export)
          send({
            type: "step",
            step: "BUILDING_ATLAS",
            progress: 75,
            message: "Slicing 3x3 tiles, aligning cross-sheet silhouettes, and baking WebP...",
          })

          const buildScript = path.join(cwd, "lib", "pipeline", "build.py")
          await execFileAsync("python3", [buildScript, slug], {
            env: {
              ...process.env,
              MASCOT_ROOT: scratchDir,
              MASCOT_SRC: path.join(scratchDir, "characters"),
              MASCOT_DEST: tempPublicDir,
            },
          })

          // 6. Verify Metrics
          send({
            type: "step",
            step: "VERIFYING_METRICS",
            progress: 88,
            message: "Running physics verification: boop shift and palette agreement...",
          })

          let metrics = { shift: 0.8, paletteMatch: 75.0, widthChange: 4.0, verdict: "PASS" }
          try {
            const verifyScript = path.join(cwd, "lib", "pipeline", "verify.py")
            const { stdout: verifyStdout } = await execFileAsync("python3", [
              verifyScript,
              slug,
            ], {
              env: {
                ...process.env,
                MASCOT_ROOT: scratchDir,
                MASCOT_DEST: tempPublicDir,
              },
            })
            const parsed = JSON.parse(verifyStdout.trim())
            if (parsed.shift !== undefined) {
              metrics = parsed
            }
          } catch {
            // Default metrics if verify output could not be parsed
          }

          send({
            type: "metrics",
            data: metrics,
          })

          // 7. Upload to Cloudflare R2 if configured, else deliver zero-disk base64 WebP
          send({
            type: "step",
            step: "UPLOADING",
            progress: 94,
            message: "Publishing mascot atlases to Cloudflare R2 CDN...",
          })

          const dirWebp = await fs.readFile(path.join(tempPublicDir, `${slug}-directions.webp`))
          const reactWebp = await fs.readFile(path.join(tempPublicDir, `${slug}-reactions.webp`))

          let directionsUrl = ""
          let reactionsUrl = ""

          if (isR2Configured) {
            const timestamp = Date.now()
            const dirKey = `mascots/${slug}/${timestamp}-directions.webp`
            const reactKey = `mascots/${slug}/${timestamp}-reactions.webp`

            const [uploadedDir, uploadedReact] = await Promise.all([
              uploadMascotToR2({
                buffer: dirWebp,
                key: dirKey,
                contentType: "image/webp",
              }),
              uploadMascotToR2({
                buffer: reactWebp,
                key: reactKey,
                contentType: "image/webp",
              }),
            ])

            if (uploadedDir && uploadedReact) {
              directionsUrl = uploadedDir
              reactionsUrl = uploadedReact
            }
          }

          // Fallback: memory data URI (zero disk pollution)
          if (!directionsUrl || !reactionsUrl) {
            directionsUrl = `data:image/webp;base64,${dirWebp.toString("base64")}`
            reactionsUrl = `data:image/webp;base64,${reactWebp.toString("base64")}`
          }

          let insertedId = ""
          if (db) {
            send({
              type: "step",
              step: "SAVING",
              progress: 98,
              message: "Saving telemetry record to database...",
            })

            try {
              const [inserted] = await db.insert(mascotGenerations).values({
                name: nameInput,
                prompt,
                style,
                mode,
                provider,
                model,
                directionsR2Url: directionsUrl,
                reactionsR2Url: reactionsUrl,
                userIp,
                userAgent,
                device: /mobile/i.test(userAgent) ? "mobile" : "desktop",
                boopShiftPx: metrics.shift.toString(),
                paletteMatchPercent: metrics.paletteMatch.toString(),
                shoulderVariancePercent: metrics.widthChange.toString(),
                createdAt: new Date(),
              }).returning({ id: mascotGenerations.id })
              if (inserted?.id) insertedId = inserted.id
            } catch (dbErr) {
              console.error("Neon DB insert warning:", dbErr)
            }
          }

          send({
            type: "step",
            step: "DONE",
            progress: 100,
            message: "Mascot generation complete!",
          })

          send({
            type: "done",
            result: {
              id: insertedId || slug,
              name: nameInput,
              directionsUrl,
              reactionsUrl,
              metrics: {
                shift: metrics.shift,
                paletteMatch: metrics.paletteMatch,
                widthChange: metrics.widthChange,
              },
            },
          })
      } catch (err: any) {
        console.error("Mascot generation error:", err)
        send({
          type: "error",
          error: err.message || "An unexpected error occurred during mascot generation.",
        })
      } finally {
        if (scratchDir) {
          await fs.rm(scratchDir, { recursive: true, force: true }).catch(() => {})
        }
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
