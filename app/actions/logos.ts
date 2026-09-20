"use server"

import { headers } from "next/headers"
import { desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { mascotLogos, type MascotLogo, type NewMascotLogo } from "@/lib/db/schema"
import {
  getClientIp,
  rateLimiterInstance,
  DB_LIKE_LIMIT,
  DB_QUERY_LIMIT,
  LOGO_GEN_LIMIT,
} from "@/lib/security/rate-limit"
import {
  validateBrandName,
  validatePrompt,
  validateTagline,
  validateId,
} from "@/lib/security/sanitize"

async function resolveClientIp(): Promise<string> {
  try {
    const headersList = await headers()
    return getClientIp(headersList)
  } catch {
    return "127.0.0.1"
  }
}

export async function getMascotLogos(): Promise<MascotLogo[]> {
  if (!db) return []

  const ip = await resolveClientIp()
  const limitCheck = rateLimiterInstance.check(ip, DB_QUERY_LIMIT)
  if (!limitCheck.success) {
    console.warn(`[RateLimit] getMascotLogos rate limit hit for ${ip}`)
    return []
  }

  try {
    const rows = await db
      .select()
      .from(mascotLogos)
      .orderBy(desc(mascotLogos.createdAt))

    return rows
  } catch (error) {
    console.error("Failed to fetch mascot logos:", error)
    return []
  }
}

export async function getMascotLogoById(id: string): Promise<MascotLogo | null> {
  if (!db || !validateId(id)) return null

  const ip = await resolveClientIp()
  const limitCheck = rateLimiterInstance.check(ip, DB_QUERY_LIMIT)
  if (!limitCheck.success) {
    console.warn(`[RateLimit] getMascotLogoById rate limit hit for ${ip}`)
    return null
  }

  try {
    const rows = await db
      .select()
      .from(mascotLogos)
      .where(eq(mascotLogos.id, id))
      .limit(1)

    return rows[0] ?? null
  } catch (error) {
    console.error(`Failed to fetch mascot logo ${id}:`, error)
    return null
  }
}

export async function createMascotLogo(data: NewMascotLogo): Promise<MascotLogo | null> {
  if (!db) {
    console.warn("Database not configured; cannot insert mascot logo.")
    return null
  }

  const ip = await resolveClientIp()
  const limitCheck = rateLimiterInstance.check(ip, LOGO_GEN_LIMIT)
  if (!limitCheck.success) {
    throw new Error(`Rate limit exceeded. Please wait ${limitCheck.retryAfter}s before saving.`)
  }

  // Sanitize data before insertion
  const sanitizedData: NewMascotLogo = {
    ...data,
    name: validateBrandName(data.name),
    prompt: validatePrompt(data.prompt),
    tagline: validateTagline(data.tagline),
    style: data.style ? String(data.style).slice(0, 32) : "modern-3d",
    imageUrl: String(data.imageUrl || "").slice(0, 2_000_000), // bounded size
  }

  try {
    const [created] = await db
      .insert(mascotLogos)
      .values(sanitizedData)
      .returning()

    return created ?? null
  } catch (error) {
    console.error("Failed to create mascot logo:", error)
    throw new Error("Failed to create mascot logo")
  }
}

export async function likeMascotLogo(id: string): Promise<number | null> {
  if (!db || !validateId(id)) return null

  const ip = await resolveClientIp()
  const limitCheck = rateLimiterInstance.check(ip, DB_LIKE_LIMIT)
  if (!limitCheck.success) {
    console.warn(`[RateLimit] likeMascotLogo limit hit for ${ip}. Retry after ${limitCheck.retryAfter}s`)
    return null
  }

  try {
    const [updated] = await db
      .update(mascotLogos)
      .set({
        likesCount: sql`${mascotLogos.likesCount} + 1`,
      })
      .where(eq(mascotLogos.id, id))
      .returning({ likesCount: mascotLogos.likesCount })

    return updated?.likesCount ?? null
  } catch (error) {
    console.error(`Failed to like mascot logo ${id}:`, error)
    return null
  }
}
