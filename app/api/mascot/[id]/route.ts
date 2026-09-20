import { NextRequest, NextResponse } from "next/server"
import { eq, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { mascotGenerations } from "@/lib/db/schema"
import {
  getClientIp,
  getRateLimitHeaders,
  DB_QUERY_LIMIT,
  rateLimiterInstance,
} from "@/lib/security/rate-limit"
import { validateId } from "@/lib/security/sanitize"
import { TAQUI, STYLES } from "@/lib/examples"

// Known preset map
const PRESET_MAP: Record<string, { id: string; name: string; slug: string; directionsUrl: string; reactionsUrl: string }> = {
  taqui: {
    id: "taqui",
    name: "Taqui",
    slug: "taqui",
    directionsUrl: "/mascots/taqui-directions.webp",
    reactionsUrl: "/mascots/taqui-reactions.webp",
  },
  fox: {
    id: "fox",
    name: "Fox",
    slug: "fox",
    directionsUrl: "/mascots/fox-directions.webp",
    reactionsUrl: "/mascots/fox-reactions.webp",
  },
}

// Populate from styles (e.g. fox-ink, fox-pixel, etc.)
for (const s of STYLES) {
  const slug = s.directions.replace("/mascots/", "").replace("-directions.webp", "")
  if (slug && !PRESET_MAP[slug]) {
    PRESET_MAP[slug] = {
      id: slug,
      name: `Fox (${s.title})`,
      slug,
      directionsUrl: s.directions,
      reactionsUrl: s.reactions,
    }
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(req.headers)
  const rateLimitResult = rateLimiterInstance.check(clientIp, DB_QUERY_LIMIT)
  const rateLimitHeaders = {
    ...getRateLimitHeaders(rateLimitResult),
    ...CORS_HEADERS,
  }

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  const { id } = await params
  const cleanId = (id || "").toLowerCase().trim()

  if (!validateId(cleanId)) {
    return NextResponse.json(
      { error: "Invalid mascot identifier" },
      { status: 400, headers: rateLimitHeaders }
    )
  }

  const origin = req.nextUrl.origin

  const toAbsoluteUrl = (url: string) => {
    if (!url) return url
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url
    }
    return `${origin}/${url.replace(/^\/+/, "")}`
  }

  // 1. Check built-in presets
  if (PRESET_MAP[cleanId]) {
    const preset = PRESET_MAP[cleanId]
    return NextResponse.json(
      {
        ...preset,
        directionsUrl: toAbsoluteUrl(preset.directionsUrl),
        reactionsUrl: toAbsoluteUrl(preset.reactionsUrl),
      },
      { headers: rateLimitHeaders }
    )
  }

  // 2. Query Neon Database for custom generated mascots
  if (db) {
    try {
      const rows = await db
        .select()
        .from(mascotGenerations)
        .where(or(eq(mascotGenerations.id, cleanId), eq(mascotGenerations.name, cleanId)))
        .limit(1)

      const row = rows[0]
      if (row) {
        const slug = (row.name || "mascot")
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "")
          .slice(0, 32) || "mascot"

        return NextResponse.json(
          {
            id: row.id,
            name: row.name,
            slug,
            directionsUrl: toAbsoluteUrl(row.directionsR2Url),
            reactionsUrl: toAbsoluteUrl(row.reactionsR2Url),
          },
          { headers: rateLimitHeaders }
        )
      }
    } catch (dbErr) {
      console.error(`Database lookup error for mascot ${cleanId}:`, dbErr)
    }
  }

  return NextResponse.json(
    { error: `Mascot '${cleanId}' not found.` },
    { status: 404, headers: rateLimitHeaders }
  )
}
