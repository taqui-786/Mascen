export type ProviderType = "openai" | "gemini" | "custom"

export interface DiscoveredModel {
  id: string
  name: string
  provider: ProviderType
  isDefault?: boolean
}

export interface AgentStepEvent {
  type: "step"
  step:
    | "VALIDATING"
    | "PREPARING_PROMPT"
    | "GENERATING_DIRECTIONS"
    | "SCREENING_DIRECTIONS"
    | "GENERATING_REACTIONS"
    | "BUILDING_ATLAS"
    | "VERIFYING_METRICS"
    | "UPLOADING"
    | "SAVING"
    | "DONE"
    | "ERROR"
  progress: number
  message: string
}

export interface AgentMetricEvent {
  type: "metrics"
  data: {
    shift: number
    paletteMatch: number
    widthChange: number
    verdict: string
  }
}

export interface AgentDoneEvent {
  type: "done"
  result: {
    id?: string
    name: string
    directionsUrl: string
    reactionsUrl: string
    metrics: {
      shift: number
      paletteMatch: number
      widthChange: number
    }
  }
}

export interface AgentErrorEvent {
  type: "error"
  error: string
}

export type AgentSSEEvent =
  | AgentStepEvent
  | AgentMetricEvent
  | AgentDoneEvent
  | AgentErrorEvent
