import { pgTable, uuid, varchar, text, numeric, timestamp, integer } from "drizzle-orm/pg-core"

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

export const mascotLogos = pgTable("mascot_logos", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  tagline: varchar("tagline", { length: 150 }),
  layout: varchar("layout", { length: 30 }).default("stacked").notNull(),
  bgType: varchar("bg_type", { length: 30 }).default("solid").notNull(),
  bgColor: varchar("bg_color", { length: 100 }).default("#ffffff").notNull(),
  angleIndex: integer("angle_index").default(4),
  reaction: varchar("reaction", { length: 50 }),
  sourceMascotId: varchar("source_mascot_id", { length: 100 }),
  provider: varchar("provider", { length: 50 }).default("custom").notNull(),
  model: varchar("model", { length: 100 }).default("default").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  userIp: varchar("user_ip", { length: 100 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type MascotLogo = typeof mascotLogos.$inferSelect
export type NewMascotLogo = typeof mascotLogos.$inferInsert

