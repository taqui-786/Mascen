import { Editor } from "@/components/editor"

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <main className="flex-1 flex flex-col w-full">
        <Editor />
      </main>
    </div>
  )
}
