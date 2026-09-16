"use client"

import { useQuery } from "@tanstack/react-query"
import { getMascots } from "@/app/actions/mascots"
import type { MascotExample } from "@/lib/examples"

export const mascotKeys = {
  all: ["mascots"] as const,
}

export function useMascots(initialData?: MascotExample[]) {
  return useQuery({
    queryKey: mascotKeys.all,
    queryFn: () => getMascots(),
    initialData,
    staleTime: 1000 * 60 * 5,
  })
}
