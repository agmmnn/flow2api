# dropdown-menu

2026-08-07, transformation engine against Base UI 1.7, migrated successfully with existing menu sizing, colors, and iconography preserved.

## Changed

`src/components/ui/dropdown-menu.tsx`: replaced Radix DropdownMenu with Base UI `Menu`, added the required Portal → Positioner → Popup structure, forwarded all positioning props, split checkbox/radio indicators, renamed submenu parts, and rewrote state/animation hooks. `src/components/Layout.tsx`: migrated the theme trigger from `asChild` to `render`. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/dropdown-menu.tsx` returns no matches.

## Left alone

No app consumer uses checkbox, radio, or submenu wrappers today; they remain exported and migrated for future use. Sonner is unrelated and intentionally untouched.

## Behavior changes

Base UI checkbox and radio menu items default to staying open when clicked, unlike Radix. No current consumer uses them, so this is flagged rather than silently changed. Standard items still close on click.

## Verify by hand

Open the header theme menu by mouse and keyboard. Verify positioning at the right edge, Up/Down navigation, typeahead, Enter selection, Escape dismissal, focus return, outside click, and light/dark/system actions.
