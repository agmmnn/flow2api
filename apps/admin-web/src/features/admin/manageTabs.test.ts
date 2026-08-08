import { describe, expect, it } from "vitest"

import { parseManageTab } from "./manageTabs"

describe("manage tab query parsing", () => {
  it("accepts known tabs and rejects stale query values", () => {
    expect(parseManageTab("apikeys")).toBe("apikeys")
    expect(parseManageTab("agent")).toBe("agent")
    expect(parseManageTab("removed-tab")).toBe("tokens")
    expect(parseManageTab(null)).toBe("tokens")
  })
})
