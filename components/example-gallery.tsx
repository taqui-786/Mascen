"use client"

import type { CSSProperties } from "react"
import { Add01Icon, PaintBoardIcon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  EXAMPLES,
  STYLES,
  type MascotExample,
  type StyleLook,
} from "@/lib/examples"
import { cn } from "@/lib/utils"

type ExampleGalleryProps = {
  picked: string
  pickedStyle: string | null
  onPick: (example: MascotExample) => void
  onPickStyle: (style: StyleLook) => void
  onMakeYourOwn: () => void
}

function Portrait({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-transparent">
      {/* Crop the center cell of the 3x3 sheet into the frame - no scale on hover */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="pointer-events-none absolute size-[300%] max-w-none select-none transition-opacity duration-150 group-hover:opacity-85"
        style={{ left: "-100%", top: "-100%" }}
      />
    </div>
  )
}

export function ExampleGallery({
  picked,
  pickedStyle,
  onPick,
  onPickStyle,
  onMakeYourOwn,
}: ExampleGalleryProps) {
  return (
    <div className="flex flex-col gap-10">
      {/* SECTION 1: ARTISTIC STYLES */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={PaintBoardIcon} className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
              Artistic Styles
            </h2>
            <p className="text-xs text-muted-foreground">
              6 hand-crafted visual aesthetics. Click any style to apply to the stage and configure the generator.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {STYLES.map((style) => {
            const isSelected = pickedStyle === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onPickStyle(style)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-2xl border p-2.5 text-center transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-2xs ring-1 ring-primary/40"
                    : "border-border/60 bg-card hover:border-border hover:bg-muted/30"
                )}
              >
                <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={style.image}
                    alt={style.title}
                    className="pointer-events-none absolute size-[300%] max-w-none select-none transition-opacity duration-150 group-hover:opacity-85"
                    style={{ left: "-100%", top: "-100%" }}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground tracking-tight capitalize">
                    {style.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {style.note}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* SECTION 2: ALREADY DRAWN MASCOTS (TRANSPARENT, BORDERLESS, FLOATING) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
                Already Drawn Mascots
              </h2>
              <p className="text-xs text-muted-foreground">
                {EXAMPLES.length} ready-to-use characters. Click any to load into the 360° interactive stage or logo studio.
              </p>
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {/* "Make Your Own" Prompt Trigger Tile */}
          <li>
            <button
              type="button"
              onClick={onMakeYourOwn}
              className="group flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-2 text-center transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors">
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
              </div>
              <span className="text-[11px] font-semibold text-primary">Create New</span>
            </button>
          </li>

          {EXAMPLES.map((example, index) => {
            const isSelected = picked === example.id && !pickedStyle
            return (
              <li
                key={example.id}
                className="feed-item"
                style={{ "--i": index } as CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => onPick(example)}
                  className="group relative flex w-full flex-col items-center gap-1 p-1 text-center bg-transparent border-0 shadow-none ring-0 outline-none transition-colors"
                >
                  <Portrait src={example.image} label={example.title} />
                  <span
                    className={cn(
                      "truncate text-xs tracking-tight transition-colors",
                      isSelected
                        ? "font-semibold text-primary"
                        : "font-medium text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {example.title}
                  </span>
                  {isSelected && (
                    <span className="size-1 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
