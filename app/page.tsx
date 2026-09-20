import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { LegacyStudioRedirect } from "@/components/legacy-studio-redirect"
import { SiteHeader } from "@/components/site-header"
import { LandingMascotPreview } from "@/components/landing-mascot-preview"
import { LandingLogoPreview } from "@/components/landing-logo-preview"

export const metadata: Metadata = {
  title: "Mascen | A little more character",
  description: "Create cursor-following mascots for your website or explore mascot logo variants for your brand. Two creative tools, one studio.",
}

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-between bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden select-none">
      <LegacyStudioRedirect />
      <SiteHeader variant="landing" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-4 sm:px-10 sm:py-6 lg:px-12 gap-6 lg:gap-10 xl:gap-14 min-h-0">
        {/* Row 1: Interactive Mascot (Text & Button on Left, Borderless Interactive Mascot on Right) */}
        <section className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="flex flex-col items-start">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[54px] xl:text-[62px] leading-[1.04]">
              A little more character.
            </h1>
            <p className="mt-3.5 max-w-xl text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed text-muted-foreground text-pretty">
              Cursor-following companions that react to clicks. Import once into React, Vue, or plain HTML.
            </p>
            <Link
              href="/mascot-character"
              className="mt-5 sm:mt-6 inline-flex items-center gap-2.5 rounded-2xl bg-primary px-5 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.96]"
            >
              <span>Make a mascot</span>
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2.5} className="size-5" />
            </Link>
          </div>

          <div className="w-full flex items-center justify-center">
            <LandingMascotPreview />
          </div>
        </section>

        {/* Row 2: Mascot Logo Maker (Borderless Logo with Variants on Left, Text & Button on Right) */}
        <section className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="w-full flex items-center justify-center">
            <LandingLogoPreview />
          </div>

          <div className="flex flex-col items-start lg:pl-8">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[50px] xl:text-[56px] leading-[1.06]">
              Logos with real personality.
            </h2>
            <p className="mt-3.5 max-w-xl text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed text-muted-foreground text-pretty">
              Explore nine production-ready directions from a single prompt. Fine-tune backdrops and export.
            </p>
            <Link
              href="/mascot-logo"
              className="mt-5 sm:mt-6 inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background px-5 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base font-semibold text-foreground shadow-2xs transition-all hover:bg-muted/40 hover:border-border active:scale-[0.96]"
            >
              <span>Mascot Logo Maker</span>
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2.5} className="size-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-background/60 px-6 py-3 sm:px-10 sm:py-3.5 text-xs sm:text-sm text-muted-foreground shrink-0 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-heading font-bold text-foreground">Mascen</span>
            <span>·</span>
            <span>Created by Md Taqui Imam</span>
          </div>
          <div className="flex items-center gap-5 font-mono text-xs">
            <Link href="/mascot-character" className="hover:text-foreground transition-colors">/character</Link>
            <Link href="/mascot-logo" className="hover:text-foreground transition-colors">/logo</Link>
            <a
              href="https://www.npmjs.com/package/mascot-taqui"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors text-primary font-semibold"
            >
              npm package
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
