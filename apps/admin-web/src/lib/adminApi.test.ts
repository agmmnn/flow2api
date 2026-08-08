import { beforeEach, describe, expect, it, vi } from "vitest"

import { COOKIE_SESSION_MARKER, adminJson } from "./adminApi"

describe("admin API query boundary", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("uses cookie credentials without exposing a bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ active: true }), { status: 200 })
    )

    const result = await adminJson<{ active: boolean }>("/api/stats", COOKIE_SESSION_MARKER)

    expect(result.data).toEqual({ active: true })
    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.credentials).toBe("include")
    expect(new Headers(init?.headers).has("Authorization")).toBe(false)
  })

  it("adds JSON content type and preserves legacy bearer compatibility", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }))

    await adminJson("/api/captcha/config", "legacy-token", {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
    })

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get("Authorization")).toBe("Bearer legacy-token")
    expect(headers.get("Content-Type")).toBe("application/json")
  })
})
