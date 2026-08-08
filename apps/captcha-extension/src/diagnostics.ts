import { normalizeWorkerMode } from "./state/worker-mode"
import { connectionPresentation, formatRelativeTime, MODE_PRESENTATION } from "./ui-model"

type Tone = "positive" | "warning" | "negative" | "neutral"
type DiagnosticTab = "overviewPanel" | "jobsPanel" | "activityPanel"

interface WorkerEvent {
  ts?: number
  type?: string
  message?: string
  level?: string
}

interface CaptchaJob {
  ts?: number
  action?: string
  ok?: boolean
  req_id?: string
  error?: string
}

interface GenerationJob {
  ts?: number
  command?: string
  method?: string
  ok?: boolean
  status?: number
  url?: string
  error?: string
}

interface SessionTokenCapture {
  capturedAt?: number
  sessionToken?: string
}

interface RuntimeState extends Record<string, unknown> {
  connectionMode?: unknown
  events?: WorkerEvent[]
  recentCaptchaJobs?: CaptchaJob[]
  recentGenerationJobs?: GenerationJob[]
  flowSessionTokenHistory?: SessionTokenCapture[]
}

interface RuntimeReply {
  success: boolean
  error?: string
  state?: RuntimeState
}

let currentState: RuntimeState | null = null
let activityFilter = "all"
let refreshInFlight = false

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Missing diagnostics element: ${id}`)
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

function numberValue(value: unknown): number {
  return Math.max(0, Number(value) || 0)
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`
}

function formatDate(value: unknown): string {
  const timestamp = Number(value)
  if (!timestamp) return "—"
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

function shorten(value: unknown, maximum = 42): string {
  const text = String(value || "")
  if (text.length <= maximum) return text || "—"
  return `${text.slice(0, maximum - 1)}…`
}

function setText(id: string, text: string): void {
  element<HTMLElement>(id).textContent = text
}

function setDiagnosticsStatus(message = "", tone: Tone = "neutral"): void {
  const status = element<HTMLParagraphElement>("diagnosticsStatus")
  status.textContent = message
  status.dataset.tone = tone
}

function createCell(text: string, options: { code?: boolean; title?: string } = {}): HTMLTableCellElement {
  const cell = document.createElement("td")
  const content = options.code ? document.createElement("code") : document.createElement("span")
  content.textContent = text
  if (options.title) content.title = options.title
  cell.append(content)
  return cell
}

function resultCell(ok: boolean): HTMLTableCellElement {
  const cell = document.createElement("td")
  const badge = document.createElement("span")
  badge.className = "result-badge"
  badge.dataset.tone = ok ? "positive" : "negative"
  badge.textContent = ok ? "Success" : "Failed"
  cell.append(badge)
  return cell
}

function emptyTableRow(columns: number, message: string): HTMLTableRowElement {
  const row = document.createElement("tr")
  const cell = document.createElement("td")
  cell.colSpan = columns
  cell.className = "table-empty"
  cell.textContent = message
  row.append(cell)
  return row
}

function renderConnection(state: RuntimeState): void {
  const presentation = connectionPresentation(state)
  const mode = MODE_PRESENTATION[normalizeWorkerMode(state.connectionMode)]

  element<HTMLElement>("overviewConnectionCard").dataset.tone = presentation.tone
  element<HTMLElement>("diagnosticsConnectionPill").dataset.tone = presentation.tone
  setText("overviewConnectionTitle", presentation.label)
  setText("overviewConnectionDetail", presentation.detail)
  setText("overviewModeChip", mode.shortLabel)
  setText("diagnosticsConnectionText", presentation.label)
  setText("lastUpdatedText", `Updated ${new Date().toLocaleTimeString()}`)
}

function renderMetrics(state: RuntimeState): void {
  const captchaSucceeded = numberValue(state.captchaJobsSucceeded)
  const captchaFailed = numberValue(state.captchaJobsFailed)
  const captchaTotal = captchaSucceeded + captchaFailed
  const captchaRate = captchaTotal ? Math.round((captchaSucceeded / captchaTotal) * 100) : 0
  setText("captchaMetricValue", plural(captchaTotal, "job"))
  setText("captchaMetricDetail", captchaTotal ? `${captchaRate}% success · ${captchaFailed} failed` : "No jobs yet")

  const generationSucceeded = numberValue(state.generationJobsSucceeded)
  const generationFailed = numberValue(state.generationJobsFailed)
  const generationTotal = generationSucceeded + generationFailed
  const generationRate = generationTotal ? Math.round((generationSucceeded / generationTotal) * 100) : 0
  setText("generationMetricValue", plural(generationTotal, "job"))
  setText(
    "generationMetricDetail",
    state.generationInFlight === true
      ? "Running now"
      : generationTotal
        ? `${generationRate}% success · ${generationFailed} failed`
        : "Idle",
  )

  const refreshSucceeded = numberValue(state.sessionRefreshSucceeded)
  const refreshFailed = numberValue(state.sessionRefreshFailed)
  setText("refreshMetricValue", `${refreshSucceeded} successful`)
  setText("refreshMetricDetail", refreshFailed ? `${refreshFailed} failed` : "No failures")

  const accountStatus = String(state.accountImportLastStatus || "never")
  const accountInFlight = state.accountImportInFlight === true
  setText(
    "accountMetricValue",
    accountInFlight ? "Syncing now" : accountStatus === "success" ? "Up to date" : accountStatus === "error" ? "Needs attention" : "Never",
  )
  setText(
    "accountMetricDetail",
    state.accountImportLastAt ? formatRelativeTime(state.accountImportLastAt) : shorten(state.accountImportLastMessage, 48) === "—" ? "No sync recorded" : shorten(state.accountImportLastMessage, 48),
  )

  const workerOpen = state.workerTabId != null && state.workerTabId !== ""
  setText("workerMetricValue", workerOpen ? "Ready" : "Closed")
  setText("workerMetricDetail", workerOpen ? "Lightweight Labs tab open" : "Opens when needed")
}

function renderTechnicalDetails(state: RuntimeState): void {
  const details: Array<[string, string, boolean]> = [
    ["WebSocket", String(state.wsStatus || "unknown"), false],
    ["Registration", String(state.lastRegisterStatus || "never"), false],
    ["Binding", String(state.bindingSource || "—"), false],
    ["Managed key", String(state.managedApiKeyId || "—"), true],
    ["CAPTCHA worker", String(state.captchaWorkerId || "—"), true],
    ["Refresh token", String(state.refreshTokenId || "—"), true],
    ["Worker session", String(state.workerSessionId || "—"), true],
    ["Instance", String(state.instanceId || "—"), true],
    ["Worker tab ID", state.workerTabId == null ? "—" : String(state.workerTabId), true],
    ["reCAPTCHA settle", `${numberValue(state.workerRecaptchaSettleMs)} ms`, false],
    ["Generation", state.allowGeneration === true ? "Allowed" : "Not allowed", false],
    ["Last error", String(state.lastError || state.lastRegisterError || "None"), false],
  ]

  const grid = element<HTMLDListElement>("technicalDetailsGrid")
  grid.replaceChildren()
  for (const [label, value, code] of details) {
    const item = document.createElement("div")
    item.className = "technical-item"
    const term = document.createElement("dt")
    term.textContent = label
    const description = document.createElement("dd")
    if (code) {
      const codeElement = document.createElement("code")
      codeElement.textContent = value
      description.append(codeElement)
    } else {
      description.textContent = value
    }
    item.append(term, description)
    grid.append(item)
  }
}

function maskToken(token: string): string {
  if (token.length <= 12) return "••••••••"
  return `••••••••${token.slice(-8)}`
}

function renderSessionTokens(entries: SessionTokenCapture[]): void {
  const list = element<HTMLUListElement>("sessionTokenList")
  list.replaceChildren()
  setText("sessionTokenCount", plural(entries.length, "capture"))
  if (!entries.length) {
    const empty = document.createElement("li")
    empty.className = "diagnostics-empty"
    empty.textContent = "No session tokens captured yet."
    list.append(empty)
    return
  }

  entries.forEach((entry, index) => {
    const token = String(entry.sessionToken || "")
    const item = document.createElement("li")
    item.className = "session-token-item"
    const copy = document.createElement("div")
    const label = document.createElement("strong")
    label.textContent = `Capture ${index + 1}`
    const time = document.createElement("span")
    time.textContent = formatDate(entry.capturedAt)
    copy.append(label, time)
    const tokenCode = document.createElement("code")
    tokenCode.textContent = maskToken(token)
    const button = document.createElement("button")
    button.className = "button button-ghost button-compact"
    button.type = "button"
    button.textContent = "Copy"
    button.disabled = !token
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(token)
        button.textContent = "Copied"
        window.setTimeout(() => (button.textContent = "Copy"), 1200)
      } catch {
        setDiagnosticsStatus("Could not copy the session token.", "negative")
      }
    })
    item.append(copy, tokenCode, button)
    list.append(item)
  })
}

function renderCaptchaJobs(jobs: CaptchaJob[]): void {
  setText("captchaJobCount", plural(jobs.length, "job"))
  const body = element<HTMLTableSectionElement>("captchaJobsBody")
  body.replaceChildren()
  if (!jobs.length) {
    body.append(emptyTableRow(5, "No CAPTCHA jobs yet."))
    return
  }
  for (const job of [...jobs].reverse()) {
    const row = document.createElement("tr")
    const error = String(job.error || "")
    row.append(
      createCell(formatDate(job.ts)),
      createCell(String(job.action || "—"), { code: true }),
      resultCell(job.ok === true),
      createCell(shorten(job.req_id, 24), { code: true, title: String(job.req_id || "") }),
      createCell(shorten(error, 64), { title: error }),
    )
    body.append(row)
  }
}

function renderGenerationJobs(jobs: GenerationJob[]): void {
  setText("generationJobCount", plural(jobs.length, "job"))
  const body = element<HTMLTableSectionElement>("generationJobsBody")
  body.replaceChildren()
  if (!jobs.length) {
    body.append(emptyTableRow(7, "No generation jobs yet."))
    return
  }
  for (const job of [...jobs].reverse()) {
    const row = document.createElement("tr")
    const url = String(job.url || "")
    const error = String(job.error || "")
    row.append(
      createCell(formatDate(job.ts)),
      createCell(String(job.command || "—"), { code: true }),
      createCell(String(job.method || "—"), { code: true }),
      resultCell(job.ok === true),
      createCell(job.status ? String(job.status) : "—"),
      createCell(shorten(url, 36), { code: true, title: url }),
      createCell(shorten(error, 56), { title: error }),
    )
    body.append(row)
  }
}

function renderActivity(events: WorkerEvent[]): void {
  const visible = [...events]
    .reverse()
    .filter((event) => activityFilter === "all" || event.level === "warn" || event.level === "error")
  const list = element<HTMLOListElement>("diagnosticsEventList")
  list.replaceChildren()
  if (!visible.length) {
    const empty = document.createElement("li")
    empty.className = "diagnostics-empty"
    empty.textContent = activityFilter === "issues" ? "No warnings or errors." : "No activity recorded yet."
    list.append(empty)
    return
  }

  for (const event of visible) {
    const item = document.createElement("li")
    item.className = "diagnostics-event"
    const marker = document.createElement("span")
    marker.className = "activity-marker"
    marker.dataset.level = event.level === "error" || event.level === "warn" ? event.level : "info"
    marker.setAttribute("aria-hidden", "true")
    const copy = document.createElement("div")
    const message = document.createElement("p")
    message.textContent = String(event.message || event.type || "Event")
    const meta = document.createElement("span")
    meta.textContent = `${String(event.level || "info").toUpperCase()} · ${formatDate(event.ts)}`
    copy.append(message, meta)
    item.append(marker, copy)
    list.append(item)
  }
}

function render(state: RuntimeState): void {
  currentState = state
  const captchaJobs = Array.isArray(state.recentCaptchaJobs) ? state.recentCaptchaJobs : []
  const generationJobs = Array.isArray(state.recentGenerationJobs) ? state.recentGenerationJobs : []
  const events = Array.isArray(state.events) ? state.events : []
  const tokens = Array.isArray(state.flowSessionTokenHistory) ? state.flowSessionTokenHistory : []

  renderConnection(state)
  renderMetrics(state)
  renderTechnicalDetails(state)
  renderSessionTokens(tokens)
  renderCaptchaJobs(captchaJobs)
  renderGenerationJobs(generationJobs)
  renderActivity(events)
  setText("jobsTabCount", String(captchaJobs.length + generationJobs.length))
  setText("activityTabCount", String(events.length))
}

async function refreshDiagnostics(announce = false): Promise<void> {
  if (refreshInFlight) return
  refreshInFlight = true
  const button = element<HTMLButtonElement>("refreshDiagnosticsButton")
  button.disabled = true
  button.dataset.loading = "true"
  try {
    const response = await runtimeMessage<RuntimeReply>({ type: "get_status" })
    if (!response.success || !response.state) throw new Error(response.error || "Status unavailable")
    render(response.state)
    setDiagnosticsStatus(announce ? "Diagnostics updated." : "", announce ? "positive" : "neutral")
  } catch (error) {
    element<HTMLElement>("diagnosticsConnectionPill").dataset.tone = "negative"
    setText("diagnosticsConnectionText", "Status unavailable")
    setDiagnosticsStatus(error instanceof Error ? error.message : "Could not read worker status.", "negative")
  } finally {
    refreshInFlight = false
    button.disabled = false
    button.dataset.loading = "false"
  }
}

function selectTab(panelId: DiagnosticTab): void {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>(".diagnostics-tab")]
  for (const tab of tabs) {
    const selected = tab.dataset.panel === panelId
    tab.setAttribute("aria-selected", String(selected))
    element<HTMLElement>(tab.dataset.panel as DiagnosticTab).hidden = !selected
  }
}

function handleTabKeyboard(event: KeyboardEvent, tabs: HTMLButtonElement[]): void {
  const currentIndex = tabs.indexOf(event.currentTarget as HTMLButtonElement)
  let nextIndex = currentIndex
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length
  else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
  else if (event.key === "Home") nextIndex = 0
  else if (event.key === "End") nextIndex = tabs.length - 1
  else return
  event.preventDefault()
  tabs[nextIndex]?.focus()
  tabs[nextIndex]?.click()
}

async function initialize(): Promise<void> {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>(".diagnostics-tab")]
  for (const tab of tabs) {
    tab.addEventListener("click", () => selectTab(tab.dataset.panel as DiagnosticTab))
    tab.addEventListener("keydown", (event) => handleTabKeyboard(event, tabs))
  }
  element<HTMLSelectElement>("activityFilter").addEventListener("change", (event) => {
    activityFilter = (event.currentTarget as HTMLSelectElement).value
    renderActivity(Array.isArray(currentState?.events) ? currentState.events : [])
  })
  element<HTMLButtonElement>("refreshDiagnosticsButton").addEventListener("click", () =>
    void refreshDiagnostics(true),
  )
  element<HTMLButtonElement>("openSettingsButton").addEventListener("click", () =>
    chrome.runtime.openOptionsPage(),
  )
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void refreshDiagnostics()
  })

  await refreshDiagnostics()
  window.setInterval(() => {
    if (!document.hidden) void refreshDiagnostics()
  }, 3000)
}

document.addEventListener("DOMContentLoaded", () => void initialize())
