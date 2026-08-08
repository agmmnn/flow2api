# select

2026-08-07, transformation engine against Base UI 1.7, migrated successfully with the existing trigger, popup, item, and scroll-control styling preserved.

## Changed

`src/components/ui/select.tsx`: replaced Radix Select with Base UI `Select`, added the required Portal → Positioner → Popup → List structure, forwarded positioning props, renamed labels and scroll arrows, rewrote state/animation hooks, and retained the existing non-null `onValueChange` consumer contract. The wrapper derives an `items` label map from `SelectItem` children so selected values continue to display their human-readable labels instead of raw IDs. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/select.tsx` returns no matches.

## Left alone

All existing select consumers and their public props remain unchanged. Existing Tailwind v3 classes were retained rather than copying Tailwind v4-only registry syntax.

## Behavior changes

Base UI may emit `null` when a selection is cleared. The compatibility wrapper intentionally filters that value because every current consumer expects a selected string, matching the previous Radix behavior.

## Verify by hand

Open the Test page project selector and the account, Runway team, captcha, and gateway selectors. Verify the selected label is shown instead of an ID, then test mouse selection, Up/Down navigation, typeahead, Enter selection, Escape dismissal, outside click, popup alignment, and focus return.
