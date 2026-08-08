import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Switch } from "./switch"

describe("Switch", () => {
  it("visually and semantically tracks controlled changes", () => {
    const onCheckedChange = vi.fn()
    const { rerender } = render(
      <Switch aria-label="Protocol ST refresh" checked={false} onCheckedChange={onCheckedChange} />
    )

    const control = screen.getByRole("switch", { name: "Protocol ST refresh" })
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(control).toHaveAttribute("data-unchecked")

    fireEvent.click(control)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())

    rerender(<Switch aria-label="Protocol ST refresh" checked onCheckedChange={onCheckedChange} />)
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(control).toHaveAttribute("data-checked")
  })
})
