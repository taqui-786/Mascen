"use server"

import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { mascotGenerations } from "@/lib/db/schema"
import type { MascotExample } from "@/lib/examples"

export async function getMascots(): Promise<MascotExample[]> {
  if (!db) return []

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
}
