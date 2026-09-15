import { GithubIcon, NpmIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <span
            className="size-8 rounded-lg bg-[url('/mascots/taqui-directions.webp')] bg-[length:300%_300%] bg-[position:50%_50%]"
            aria-hidden
          />
          <span className="font-heading text-lg font-semibold tracking-tight">
            Mascen
          </span>
        </a>
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              />
            }
          >
            <HugeiconsIcon icon={GithubIcon} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <a
                href="https://www.npmjs.com/package/mascot-taqui"
                target="_blank"
                rel="noreferrer"
                aria-label="npm"
              />
            }
          >
            <HugeiconsIcon icon={NpmIcon} />
          </Button>
        </nav>
      </div>
    </header>
  )
}
