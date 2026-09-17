"use server"

import { desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { mascotLogos, type MascotLogo, type NewMascotLogo } from "@/lib/db/schema"

export async function getMascotLogos(): Promise<MascotLogo[]> {
  if (!db) return []

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
  if (!db) return null

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

  try {
    const [created] = await db
      .insert(mascotLogos)
      .values(data)
      .returning()

    return created ?? null
  } catch (error) {
    console.error("Failed to create mascot logo:", error)
    throw new Error("Failed to create mascot logo")
  }
}

export async function likeMascotLogo(id: string): Promise<number | null> {
  if (!db) return null

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
