"use server"

import { headers } from "next/headers"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { mascotGenerations } from "@/lib/db/schema"
import type { MascotExample } from "@/lib/examples"
import {
  getClientIp,
  rateLimiterInstance,
  DB_QUERY_LIMIT,
} from "@/lib/security/rate-limit"

async function resolveClientIp(): Promise<string> {
  try {
    const headersList = await headers()
    return getClientIp(headersList)
  } catch {
    return "127.0.0.1"
  }
}

export async function getMascots(): Promise<MascotExample[]> {
  if (!db) return []

  const ip = await resolveClientIp()
  const limitCheck = rateLimiterInstance.check(ip, DB_QUERY_LIMIT)
  if (!limitCheck.success) {
    console.warn(`[RateLimit] getMascots limit reached for ${ip}`)
    return []
  }

  try {
    const rows = await db
      .select()
      .from(mascotGenerations)
      .orderBy(desc(mascotGenerations.createdAt))

    return rows.map((row) => ({
      id: row.id,
      title: row.name,
      prompt: row.prompt,
      mode: (row.mode as "prompt" | "photo") || "prompt",
      directions: row.directionsR2Url,
      reactions: row.reactionsR2Url,
      image: row.directionsR2Url,
    }))
  } catch (error) {
    console.error("Failed to fetch mascots:", error)
    return []
  }
}
