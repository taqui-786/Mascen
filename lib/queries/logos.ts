"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createMascotLogo,
  getMascotLogoById,
  getMascotLogos,
  likeMascotLogo,
} from "@/app/actions/logos"
import type { MascotLogo, NewMascotLogo } from "@/lib/db/schema"

export const logoKeys = {
  all: ["logos"] as const,
  lists: () => [...logoKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...logoKeys.lists(), { filters }] as const,
  details: () => [...logoKeys.all, "detail"] as const,
  detail: (id: string) => [...logoKeys.details(), id] as const,
}

export function useMascotLogos(initialData?: MascotLogo[]) {
  return useQuery({
    queryKey: logoKeys.lists(),
    queryFn: () => getMascotLogos(),
    initialData,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMascotLogo(id: string) {
  return useQuery({
    queryKey: logoKeys.detail(id),
    queryFn: () => getMascotLogoById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateMascotLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newLogo: NewMascotLogo) => createMascotLogo(newLogo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logoKeys.lists() })
    },
  })
}

export function useLikeMascotLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => likeMascotLogo(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: logoKeys.lists() })
      queryClient.invalidateQueries({ queryKey: logoKeys.detail(id) })
    },
  })
}
