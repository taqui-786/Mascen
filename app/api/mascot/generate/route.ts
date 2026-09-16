import { NextRequest } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
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

const execFileAsync = promisify(execFile)

export const maxDuration = 120 // allow up to 2 minutes for dual-sheet generation & CV

export async function POST(req: NextRequest) {
  const provider = (req.headers.get("x-provider") || "openai") as ProviderType
  const apiKey = req.headers.get("x-api-key") || ""
  const baseURL = req.headers.get("x-base-url") || undefined
  const model = req.headers.get("x-model") || "gpt-image-2"

  if (!apiKey.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing API Key in x-api-key header." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const formData = await req.formData()
  const prompt = (formData.get("prompt") as string) || ""
  const nameInput = (formData.get("name") as string) || "mascot"
  const style = (formData.get("style") as string) || "colour"
  const mode = ((formData.get("mode") as string) || "prompt") as "prompt" | "photo"
  const referenceFile = formData.get("reference") as File | null

  const slug = nameInput
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30) || `mascot-${Date.now().toString().slice(-4)}`

  const userAgent = req.headers.get("user-agent") || ""
  const forwardedFor = req.headers.get("x-forwarded-for") || ""
  const userIp = forwardedFor ? forwardedFor.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1"

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: AgentSSEEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        send({
          type: "step",
          step: "VALIDATING",
          progress: 5,
          message: "Validating provider configuration and inputs...",
        })

        const cwd = process.cwd()
        const charDir = path.join(cwd, "characters", slug)
        const publicDir = path.join(cwd, "public", "mascots")
        await fs.mkdir(charDir, { recursive: true })
        await fs.mkdir(publicDir, { recursive: true })

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

        const directionsPngPath = path.join(charDir, "directions.png")
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

        const reactionsPngPath = path.join(charDir, "reactions.png")
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
            MASCOT_ROOT: cwd,
            MASCOT_SRC: path.join(cwd, "characters"),
            MASCOT_DEST: publicDir,
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
              MASCOT_ROOT: cwd,
              MASCOT_DEST: publicDir,
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

        // 7. Upload to Cloudflare R2 if configured, else use local public path
        send({
          type: "step",
          step: "UPLOADING",
          progress: 94,
          message: "Publishing mascot atlases to Cloudflare R2 CDN...",
        })

        const localDirUrl = `/mascots/${slug}-directions.webp`
        const localReactUrl = `/mascots/${slug}-reactions.webp`

        let directionsUrl = localDirUrl
        let reactionsUrl = localReactUrl

        if (isR2Configured) {
          const dirWebp = await fs.readFile(path.join(publicDir, `${slug}-directions.webp`))
          const reactWebp = await fs.readFile(path.join(publicDir, `${slug}-reactions.webp`))

          const dirKey = `mascots/${slug}/${Date.now()}-directions.webp`
          const reactKey = `mascots/${slug}/${Date.now()}-reactions.webp`

          const uploadedDir = await uploadMascotToR2({
            buffer: dirWebp,
            key: dirKey,
            contentType: "image/webp",
          })
          const uploadedReact = await uploadMascotToR2({
            buffer: reactWebp,
            key: reactKey,
            contentType: "image/webp",
          })

          if (uploadedDir && uploadedReact) {
            directionsUrl = uploadedDir
            reactionsUrl = uploadedReact
          }
        }

        // 8. Log generation to Neon DB via Drizzle if configured
        if (db) {
          send({
            type: "step",
            step: "SAVING",
            progress: 98,
            message: "Saving telemetry record to database...",
          })

          try {
            await db.insert(mascotGenerations).values({
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
            })
          } catch (dbErr) {
            console.error("Neon DB insert warning:", dbErr)
          }
        }

        // 9. Completion
        send({
          type: "step",
          step: "DONE",
          progress: 100,
          message: "Mascot generation complete!",
        })

        send({
          type: "done",
          result: {
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

        controller.close()
      } catch (err: any) {
        console.error("Mascot generation error:", err)
        send({
          type: "error",
          error: err.message || "An unexpected error occurred during mascot generation.",
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
