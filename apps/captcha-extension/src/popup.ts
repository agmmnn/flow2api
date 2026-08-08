import { normalizeWorkerMode, type WorkerMode } from "./state/worker-mode"
import { connectionPresentation, formatRelativeTime, MODE_PRESENTATION, successRate } from "./ui-model"

interface WorkerEvent {
  ts?: number
  message?: string
  level?: string
  type?: string
}

interface RuntimeState extends Record<string, unknown> {
  connectionMode?: unknown
  accountAutoImportEnabled?: boolean
  accountAutoImportIntervalMinutes?: number
  usePersistentWorkerTab?: boolean
  workerTabId?: number | null
  captchaJobsSucceeded?: number
  captchaJobsFailed?: number
  accountImportLastAt?: number
  accountImportInFlight?: boolean
  events?: WorkerEvent[]
}

interface RuntimeReply {
  success: boolean
  error?: string
  state?: RuntimeState
  payload?: Record<string, unknown>
  tabId?: number
}

let currentState: RuntimeState | null = null
let busy = false

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Missing popup element: ${id}`)
  return node as T
}

function runtimeMessage<T>(message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      const error = chrome.runtime.lastError
      if (error) reject(new Error(error.message))
      else resolve(response)
    })
  })
}

function saveStorage(values: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      const error = chrome.runtime.lastError
      if (error) reject(new Error(error.message))
      else resolve()
    })
  })
}

function readableError(value: unknown): string {
  const raw = String(value || "Something went wrong")
  const known: Record<string, string> = {
    enable_persistent_worker_tab_first: "Turn on Keep CAPTCHA ready first.",
    refresh_worker_mode_required: "This action requires Refresh-only mode.",
    session_refresh_busy: "A refresh is already running.",
  }
  return known[raw] || raw.replaceAll("_", " ")
}

function setActionStatus(message = "", tone: "neutral" | "positive" | "negative" = "neutral"): void {
  const status = element<HTMLParagraphElement>("actionStatus")
  status.textContent = message
  status.dataset.tone = tone
}

function setBusy(value: boolean): void {
  busy = value
  for (const id of ["primaryAction", "testButton", "reconnectButton", "workerTabButton"]) {
    element<HTMLButtonElement>(id).disabled = value
  }
}

function currentMode(): WorkerMode {
  return normalizeWorkerMode(currentState?.connectionMode)
}

function renderActivity(events: WorkerEvent[]): void {
  const useful = events
    .filter((event) => event.message && event.type !== "startup")
    .slice(-3)
    .reverse()
  element<HTMLElement>("activitySection").classList.toggle("is-hidden", useful.length === 0)

  const list = element<HTMLUListElement>("activityList")
  list.replaceChildren()
  for (const event of useful) {
    const item = document.createElement("li")
    item.className = "activity-item"

    const marker = document.createElement("span")
    marker.className = "activity-marker"
    marker.dataset.level = event.level === "error" || event.level === "warn" ? event.level : "info"
    marker.setAttribute("aria-hidden", "true")

    const message = document.createElement("span")
    message.className = "activity-message"
    message.textContent = String(event.message)
    message.title = String(event.message)

    const time = document.createElement("span")
    time.className = "activity-time"
    time.textContent = formatRelativeTime(event.ts)

    item.append(marker, message, time)
    list.append(item)
  }
}

function render(state: RuntimeState): void {
  currentState = state
  const mode = normalizeWorkerMode(state.connectionMode)
  const modeCopy = MODE_PRESENTATION[mode]
  const connection = connectionPresentation(state)

  element<HTMLElement>("connectionCard").dataset.tone = connection.tone
  element<HTMLHeadingElement>("connectionTitle").textContent = connection.label
  element<HTMLParagraphElement>("connectionDetail").textContent = connection.detail
  element<HTMLSpanElement>("modeChip").textContent = modeCopy.shortLabel
  element<HTMLParagraphElement>("headerSubtitle").textContent = modeCopy.label

  const primaryLabel = element<HTMLSpanElement>("primaryActionLabel")
  primaryLabel.textContent =
    mode === "endUser" ? "Sync Google account" : mode === "captchaWorker" ? "Test CAPTCHA" : "Reconnect"

  element<HTMLButtonElement>("testButton").classList.toggle("is-hidden", mode !== "endUser")
  element<HTMLButtonElement>("reconnectButton").classList.toggle("is-hidden", mode === "refreshWorker")
  element<HTMLElement>("secondaryActions").classList.toggle("is-hidden", mode === "refreshWorker")
  element<HTMLElement>("secondaryActions").classList.toggle("is-single", mode === "captchaWorker")
  element<HTMLElement>("autoSyncRow").classList.toggle("is-hidden", mode !== "endUser")
  element<HTMLElement>("persistentRow").classList.toggle("is-hidden", mode === "refreshWorker")
  element<HTMLElement>("workerTabStatRow").classList.toggle("is-hidden", mode === "refreshWorker")

  const autoSync = element<HTMLInputElement>("autoSyncToggle")
  autoSync.checked = state.accountAutoImportEnabled === true
  element<HTMLSpanElement>("syncDescription").textContent = autoSync.checked
    ? `Runs every ${Number(state.accountAutoImportIntervalMinutes) || 30} minutes`
    : "Off"

  const persistent = element<HTMLInputElement>("persistentToggle")
  persistent.checked = state.usePersistentWorkerTab === true
  element<HTMLSpanElement>("workerDescription").textContent = persistent.checked
    ? "Keeps one lightweight Labs tab open"
    : "Opens a tab only when needed"

  element<HTMLSpanElement>("captchaSummary").textContent = successRate(
    state.captchaJobsSucceeded,
    state.captchaJobsFailed,
  )
  element<HTMLSpanElement>("lastSync").textContent = state.accountImportInFlight
    ? "Syncing now…"
    : formatRelativeTime(state.accountImportLastAt)
  element<HTMLButtonElement>("workerTabButton").textContent = state.workerTabId ? "Close" : "Open"
  renderActivity(Array.isArray(state.events) ? state.events : [])

  if (!busy) setBusy(false)
}

async function refreshStatus(silent = false): Promise<void> {
  try {
    const response = await runtimeMessage<RuntimeReply>({ type: "get_status" })
    if (!response.success || !response.state) throw new Error(response.error || "Status unavailable")
    render(response.state)
  } catch (error) {
    element<HTMLElement>("connectionCard").dataset.tone = "negative"
    element<HTMLHeadingElement>("connectionTitle").textContent = "Status unavailable"
    element<HTMLParagraphElement>("connectionDetail").textContent = "Reload the extension and try again"
    if (!silent) setActionStatus(readableError(error instanceof Error ? error.message : error), "negative")
  }
}

async function runAction(message: Record<string, unknown>, pending: string, success: string): Promise<void> {
  if (busy) return
  setBusy(true)
  setActionStatus(pending)
  try {
    const response = await runtimeMessage<RuntimeReply>(message)
    if (!response.success) throw new Error(response.error || "Action failed")
    setActionStatus(success, "positive")
    await refreshStatus(true)
  } catch (error) {
    setActionStatus(readableError(error instanceof Error ? error.message : error), "negative")
  } finally {
    setBusy(false)
  }
}

async function primaryAction(): Promise<void> {
  const mode = currentMode()
  if (mode === "endUser") {
    await runAction({ type: "import_current_account" }, "Syncing account…", "Google account synced.")
  } else if (mode === "captchaWorker") {
    await runAction(
      { type: "test_token", action: "IMAGE_GENERATION" },
      "Testing CAPTCHA…",
      "CAPTCHA is ready.",
    )
  } else {
    await runAction({ type: "reconnect_now" }, "Reconnecting…", "Reconnected.")
  }
}

async function toggleAutoSync(input: HTMLInputElement): Promise<void> {
  try {
    await saveStorage({ accountAutoImportEnabled: input.checked })
    setActionStatus(input.checked ? "Automatic account sync enabled." : "Automatic account sync disabled.", "positive")
    await refreshStatus(true)
  } catch (error) {
    input.checked = !input.checked
    setActionStatus(readableError(error instanceof Error ? error.message : error), "negative")
  }
}

async function togglePersistentWorker(input: HTMLInputElement): Promise<void> {
  try {
    await saveStorage({ usePersistentWorkerTab: input.checked })
    const response = await runtimeMessage<RuntimeReply>({
      type: input.checked ? "worker_tab_open" : "worker_tab_close",
    })
    if (!response.success) throw new Error(response.error || "Could not update worker tab")
    setActionStatus(input.checked ? "CAPTCHA worker is ready." : "CAPTCHA worker tab closed.", "positive")
    await refreshStatus(true)
  } catch (error) {
    input.checked = !input.checked
    await saveStorage({ usePersistentWorkerTab: input.checked }).catch(() => undefined)
    setActionStatus(readableError(error instanceof Error ? error.message : error), "negative")
  }
}

async function toggleWorkerTab(): Promise<void> {
  const isOpen = Boolean(currentState?.workerTabId)
  if (!isOpen && !currentState?.usePersistentWorkerTab) {
    await saveStorage({ usePersistentWorkerTab: true })
  }
  await runAction(
    { type: isOpen ? "worker_tab_close" : "worker_tab_open" },
    isOpen ? "Closing worker tab…" : "Opening worker tab…",
    isOpen ? "Worker tab closed." : "Worker tab opened.",
  )
}

function openSettings(): void {
  chrome.runtime.openOptionsPage()
}

async function initialize(): Promise<void> {
  element<HTMLButtonElement>("settingsButton").addEventListener("click", openSettings)
  element<HTMLButtonElement>("advancedSettingsButton").addEventListener("click", openSettings)
  element<HTMLButtonElement>("primaryAction").addEventListener("click", () => void primaryAction())
  element<HTMLButtonElement>("testButton").addEventListener("click", () =>
    void runAction(
      { type: "test_token", action: "IMAGE_GENERATION" },
      "Testing CAPTCHA…",
      "CAPTCHA is ready.",
    ),
  )
  element<HTMLButtonElement>("reconnectButton").addEventListener("click", () =>
    void runAction({ type: "reconnect_now" }, "Reconnecting…", "Reconnected."),
  )
  element<HTMLInputElement>("autoSyncToggle").addEventListener("change", (event) =>
    void toggleAutoSync(event.currentTarget as HTMLInputElement),
  )
  element<HTMLInputElement>("persistentToggle").addEventListener("change", (event) =>
    void togglePersistentWorker(event.currentTarget as HTMLInputElement),
  )
  element<HTMLButtonElement>("workerTabButton").addEventListener("click", () => void toggleWorkerTab())

  await refreshStatus()
  window.setInterval(() => void refreshStatus(true), 2500)
}

document.addEventListener("DOMContentLoaded", () => void initialize())
