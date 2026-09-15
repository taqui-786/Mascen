"use client"

import type { CSSProperties } from "react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
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
    <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl ">
      {/* Crop the center cell of the 3x3 sheet into the frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="pointer-events-none absolute size-[300%] max-w-none select-none"
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
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Different styles
          </h2>
          <p className="max-w-[46ch] text-sm text-muted-foreground">
            Six looks, or a photo of you. Swap the art in later. The slots are
            ready now.
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
          {STYLES.map((style, index) => (
            <li
              key={style.id}
              className="feed-item"
              style={{ "--i": index } as CSSProperties}
            >
              <button
                type="button"
                onClick={() => onPickStyle(style)}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-2xl text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]",
                  pickedStyle === style.id && "bg-muted/80",
                )}
              >
                <Portrait src={style.image} label={style.title} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{style.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {style.note}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Already drawn
          </h2>
          <p className="max-w-[46ch] text-sm text-muted-foreground">
            A feed of mascots. Images go in the frames later.
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
          {EXAMPLES.map((example, index) => (
            <li
              key={example.id}
              className="feed-item"
              style={{ "--i": index } as CSSProperties}
            >
              <button
                type="button"
                onClick={() => onPick(example)}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-2xl p-1 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]",
                  picked === example.id && "bg-muted",
                )}
              >
                <Portrait src={example.image} label={example.title} />
                <span className="text-sm font-medium">{example.title}</span>
              </button>
            </li>
          ))}
          <li>
            <Button
              type="button"
              variant="ghost"
              onClick={onMakeYourOwn}
              className="flex h-auto w-full flex-col gap-2 whitespace-normal rounded-2xl p-1 text-muted-foreground"
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed">
                <HugeiconsIcon icon={Add01Icon} />
              </span>
              Make your own
            </Button>
          </li>
        </ul>
      </section>
    </div>
  )
}
