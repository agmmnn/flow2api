export interface AccountSyncState {
  inFlight: boolean
  lastAt: number
  lastStatus: "never" | "success" | "error"
  lastMessage: string
}

export type AccountSyncEvent =
  | { type: "begin" }
  | { type: "success"; at: number; message: string }
  | { type: "error"; at: number; message: string }
  | { type: "reset" }

export function createAccountSyncState(
  initial: Partial<AccountSyncState> = {},
): AccountSyncState {
  return {
    inFlight: initial.inFlight === true,
    lastAt: Number(initial.lastAt) || 0,
    lastStatus:
      initial.lastStatus === "success" || initial.lastStatus === "error"
        ? initial.lastStatus
        : "never",
    lastMessage: String(initial.lastMessage ?? "").slice(0, 500),
  }
}

export function reduceAccountSync(
  state: AccountSyncState,
  event: AccountSyncEvent,
): AccountSyncState {
  if (event.type === "reset") return createAccountSyncState()
  if (event.type === "begin") {
    if (state.inFlight) throw new Error("account_import_busy")
    return { ...state, inFlight: true }
  }
  return {
    inFlight: false,
    lastAt: event.at,
    lastStatus: event.type,
    lastMessage: event.message.slice(0, 500),
  }
}
