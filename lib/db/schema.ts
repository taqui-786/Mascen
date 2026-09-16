import { pgTable, uuid, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core"

export const mascotGenerations = pgTable("mascot_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 50 }).notNull(),
  mode: varchar("mode", { length: 20 }).notNull().default("prompt"),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  directionsR2Url: text("directions_r2_url").notNull(),
  reactionsR2Url: text("reactions_r2_url").notNull(),
  userIp: varchar("user_ip", { length: 100 }),
  userAgent: text("user_agent"),
  device: varchar("device", { length: 50 }),
  boopShiftPx: numeric("boop_shift_px", { precision: 5, scale: 2 }),
  paletteMatchPercent: numeric("palette_match_percent", { precision: 5, scale: 2 }),
  shoulderVariancePercent: numeric("shoulder_variance_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type MascotGeneration = typeof mascotGenerations.$inferSelect
export type NewMascotGeneration = typeof mascotGenerations.$inferInsert
