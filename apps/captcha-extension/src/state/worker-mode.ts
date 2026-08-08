export const WORKER_MODES = ["endUser", "captchaWorker", "refreshWorker"] as const

export type WorkerMode = (typeof WORKER_MODES)[number]

export interface WorkerModeSettings {
  connectionMode?: unknown
  apiKey?: unknown
  captchaWorkerAuthKey?: unknown
  refreshTokenId?: unknown
  clientLabel?: unknown
}

export function normalizeWorkerMode(value: unknown): WorkerMode {
  if (value === "captchaWorker" || value === "refreshWorker") return value
  if (value === "worker") return "refreshWorker"
  return "endUser"
}

export function inferWorkerMode(settings: WorkerModeSettings): WorkerMode {
  const explicit = String(settings.connectionMode ?? "").trim()
  if (["endUser", "captchaWorker", "refreshWorker", "worker"].includes(explicit)) {
    return normalizeWorkerMode(explicit)
  }
  const apiKey = String(settings.apiKey ?? "").trim()
  if (String(settings.captchaWorkerAuthKey ?? "").trim() && !apiKey) return "captchaWorker"
  if (String(settings.refreshTokenId ?? "").trim() && !apiKey) return "refreshWorker"
  return "endUser"
}

export function buildWorkerSocketUrl(
  serverUrl: string,
  mode: WorkerMode,
  settings: WorkerModeSettings,
  instanceId: string,
): URL {
  const url = new URL(serverUrl)
  if (mode === "captchaWorker") {
    const key = String(settings.captchaWorkerAuthKey ?? "").trim()
    if (key) url.searchParams.set("captcha_worker_key", key)
  } else if (mode === "refreshWorker") {
    const tokenId = String(settings.refreshTokenId ?? "").trim()
    if (tokenId) url.searchParams.set("refresh_token_id", tokenId)
  } else {
    const apiKey = String(settings.apiKey ?? "").trim()
    const label = String(settings.clientLabel ?? "").trim()
    if (apiKey) url.searchParams.set("key", apiKey)
    if (label) url.searchParams.set("client_label", label)
  }
  url.searchParams.set("instance_id", instanceId)
  return url
}

export function buildRegistrationMessage(
  mode: WorkerMode,
  clientLabel: string,
  instanceId: string,
): { type: "register"; client_label: string; instance_id: string } {
  return {
    type: "register",
    client_label: mode === "endUser" ? clientLabel : "",
    instance_id: instanceId,
  }
}
