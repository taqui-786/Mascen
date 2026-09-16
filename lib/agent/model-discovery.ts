import type { DiscoveredModel, ProviderType } from "./types"

export async function fetchImageModels(params: {
  provider: ProviderType
  apiKey: string
  baseURL?: string
  customModels?: string[]
}): Promise<DiscoveredModel[]> {
  const { provider, apiKey, baseURL, customModels } = params

  if (!apiKey.trim() && provider !== "custom") {
    throw new Error("Please provide a valid API key.")
  }

  const res = await fetch("/api/mascot/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      apiKey: apiKey.trim(),
      baseURL: baseURL?.trim(),
      customModels,
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch models (HTTP ${res.status})`)
  }

  const data = await res.json()
  return data.models || []
}
