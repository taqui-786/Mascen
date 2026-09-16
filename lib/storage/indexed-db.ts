import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export interface StoredMascot {
  id: string
  name: string
  prompt: string
  style: string
  mode: "prompt" | "photo"
  provider: string
  model: string
  directionsUrl: string
  reactionsUrl: string
  metrics?: {
    shift: number
    paletteMatch: number
    widthChange: number
  }
  createdAt: number
}

export interface StoredProviderConfig {
  provider: "openai" | "gemini" | "custom"
  apiKey: string
  baseURL?: string
  selectedModel: string
  customModels?: string[]
}

interface MascenDB extends DBSchema {
  mascots: {
    key: string
    value: StoredMascot
    indexes: { "by-date": number }
  }
  settings: {
    key: string
    value: StoredProviderConfig
  }
}

let dbPromise: Promise<IDBPDatabase<MascenDB>> | null = null

export function getMascenDB() {
  if (typeof window === "undefined") return null
  if (!dbPromise) {
    dbPromise = openDB<MascenDB>("mascen-store", 1, {
      upgrade(db) {
        const mascotStore = db.createObjectStore("mascots", { keyPath: "id" })
        mascotStore.createIndex("by-date", "createdAt")
        db.createObjectStore("settings")
      },
    })
  }
  return dbPromise
}

export async function saveMascotLocally(mascot: StoredMascot): Promise<void> {
  const db = await getMascenDB()
  if (!db) return
  await db.put("mascots", mascot)
}

export async function getLocalMascots(): Promise<StoredMascot[]> {
  const db = await getMascenDB()
  if (!db) return []
  const all = await db.getAllFromIndex("mascots", "by-date")
  return all.reverse()
}

export async function deleteLocalMascot(id: string): Promise<void> {
  const db = await getMascenDB()
  if (!db) return
  await db.delete("mascots", id)
}

export async function saveProviderConfig(config: StoredProviderConfig): Promise<void> {
  const db = await getMascenDB()
  if (!db) return
  await db.put("settings", config, "provider")
}

export async function getProviderConfig(): Promise<StoredProviderConfig | null> {
  const db = await getMascenDB()
  if (!db) return null
  return (await db.get("settings", "provider")) || null
}
