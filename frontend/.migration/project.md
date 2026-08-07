# project

2026-08-07, full frontend migration from Radix-backed shadcn wrappers to shadcn Base completed on `codex/base-ui-migration`.

## Changed

Installed `@base-ui/react` 1.7.0 with Bun, migrated Button, Label, Switch, Scroll Area, Tabs, Dialog, Dropdown Menu, and Select, removed the unused Radix toast stack, removed all nine `@radix-ui/*` dependencies, and changed `components.json` to the current `base-vega` registry style. Existing Tailwind v3 visual classes were retained because the latest Base registry examples use Tailwind v4 syntax. The application consumer sweep replaced Radix `asChild` composition with Base UI `render` where needed.

## Left alone

Sonner remains the active notification system. Unrelated feature code, existing visual design, Tailwind 3, and the existing Vite/React setup were not changed.

## Behavior changes

Tabs now use Base UI's manual keyboard activation. Unused checkbox/radio menu exports inherit Base UI's stay-open-on-select default. Select filters Base UI's nullable clear event to preserve the existing string-only application API and derives labels from its item children.

## Verify by hand

Run `bun run dev`, then test login and dashboard navigation; link-style buttons; theme menu; dialogs and focus return; token switches; scroll areas; tabs by mouse and keyboard; every select with human-readable labels; and Sonner notifications. The production build passes. The repository-wide lint remains blocked by 13 pre-existing errors and one warning outside the scope of this migration, primarily `set-state-in-effect` and Fast Refresh export rules.

## Final audit

`bunx --bun shadcn@latest info --json` reports `style: base-vega` and `base: base`. `rg "@radix-ui|radix-ui" src package.json bun.lock components.json` returns no matches, and the derived Radix wrapper/dependency count is **0**. `bun run build` succeeds; Vite only reports the existing large-chunk warning.
