import { Editor } from "@/components/editor"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Editor />
      </main>
    </div>
  )
}
