export type WebSocketPhase =
  | "idle"
  | "connecting"
  | "open"
  | "open_register_error"
  | "closed"
  | "error"

export type WebSocketEvent =
  | { type: "connect" }
  | { type: "open" }
  | { type: "register"; ok: boolean }
  | { type: "close" }
  | { type: "error" }
  | { type: "reset" }

export function reduceWebSocketPhase(
  _current: WebSocketPhase,
  event: WebSocketEvent,
): WebSocketPhase {
  switch (event.type) {
    case "connect":
      return "connecting"
    case "open":
      return "open"
    case "register":
      return event.ok ? "open" : "open_register_error"
    case "close":
      return "closed"
    case "error":
      return "error"
    case "reset":
      return "idle"
  }
}
