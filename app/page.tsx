import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { LegacyStudioRedirect } from "@/components/legacy-studio-redirect"
import { Mascot } from "@/components/mascot"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Mascen | A little more character",
  description: "Create cursor-following mascots for your website or explore nine mascot logo variants for your brand. Two creative tools, one studio.",
}

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <LegacyStudioRedirect />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">
        <section className="grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div>
            <h1 className="max-w-xl font-heading text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              A little more character.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-foreground/70 sm:text-lg">
              Give your website a companion. Give your brand a face. Make both with Mascen.
            </p>
            <Link href="#tools" className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none">
              Find your mascot
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
            </Link>
          </div>
          <div className="flex min-h-64 items-center justify-center rounded-2xl bg-muted/45 py-6 sm:min-h-80">
            <Mascot size={240} label="Taqui, Mascen’s interactive mascot" directions="/mascots/taqui-directions.webp" reactions="/mascots/taqui-reactions.webp" />
          </div>
        </section>

        <section id="tools" aria-label="Choose your mascot tool" className="grid scroll-mt-20 gap-8 border-t border-border py-8 md:grid-cols-2 md:gap-12">
          <article className="flex flex-col items-start">
            <div className="mb-5 flex w-full items-center justify-center gap-5 rounded-xl bg-muted/40 py-5">
              <Mascot size={96} label="Fox mascot preview" directions="/mascots/fox-directions.webp" reactions="/mascots/fox-reactions.webp" />
              <Mascot size={96} label="Pixel fox mascot preview" directions="/mascots/fox-pixel-directions.webp" reactions="/mascots/fox-pixel-reactions.webp" />
            </div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-balance">Made to move.</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-pretty text-foreground/70">Characters that follow the cursor and react to a click. Customize one, then bring it to your website.</p>
            <Link href="/mascot-character" className="mt-3 inline-flex min-h-11 items-center gap-3 rounded-md text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              Interactive Mascot
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
            </Link>
          </article>
          <article className="flex flex-col items-start">
            <div className="mb-5 flex min-h-34 w-full items-center justify-center gap-6 rounded-xl bg-primary/5 py-5">
              <div role="img" aria-label="Ink fox mascot logo example" className="size-24 shrink-0 rounded-full bg-[url('/mascots/fox-ink-directions.webp')] bg-[length:300%_300%] bg-center" />
              <div role="img" aria-label="Paper fox mascot logo example" className="size-24 shrink-0 rounded-xl bg-[url('/mascots/fox-paper-directions.webp')] bg-[length:300%_300%] bg-center" />
            </div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-balance">Made to be remembered.</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-pretty text-foreground/70">One character, nine logo directions. Explore a 3×3 sheet, choose your favorite, and make it your own.</p>
            <Link href="/mascot-logo" className="mt-3 inline-flex min-h-11 items-center gap-3 rounded-md text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              Mascot Logo Maker
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
            </Link>
          </article>
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 px-5 py-6 text-xs text-foreground/65 sm:px-8">
        <span className="font-heading font-semibold text-foreground">Mascen</span>
        <span>Explore the examples. Connect your image model to generate.</span>
      </footer>
    </div>
  )
}
