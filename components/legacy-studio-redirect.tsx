"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function LegacyStudioRedirect() {
  const router = useRouter()

  useEffect(() => {
    function redirectLegacyLink() {
      const url = new URL(window.location.href)
      const mode = url.searchParams.get("mode")
      const logo = mode === "logo" || url.hash === "#logo" || url.hash === "#mascot-logo-studio"
      const character = mode === "interactive" || url.hash === "#developer-integration"
      if (!logo && !character) return
      url.searchParams.delete("mode")
      const query = url.searchParams.toString()
      const hash = url.hash === "#logo" ? "" : url.hash
      router.replace(`${logo ? "/mascot-logo" : "/mascot-character"}${query ? `?${query}` : ""}${hash}`)
    }

    redirectLegacyLink()
    window.addEventListener("hashchange", redirectLegacyLink)
    return () => window.removeEventListener("hashchange", redirectLegacyLink)
  }, [router])

  return null
}
