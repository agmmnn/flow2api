# switch

2026-08-07, transformation engine against Base UI 1.7, migrated successfully and later updated to the current shadcn Base/Tailwind 4 wrapper.

## Changed

`src/components/ui/switch.tsx`: replaced Radix Switch with `@base-ui/react/switch`, moved checked/unchecked styling to `data-checked` and `data-unchecked`, and moved disabled styling to `data-disabled` because Base UI renders a span-backed control. The Tailwind 4 follow-up smart-merged the current shadcn Base wrapper, including size variants, generated state colors, focus treatment, and thumb translation. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/switch.tsx` returns no matches.

## Left alone

All Switch consumers remain source-compatible; their single-argument `onCheckedChange` handlers are valid with Base UI's additional event-details argument.

## Behavior changes

The underlying visible root is span-backed with a hidden native input instead of a button-backed Radix root. Form submission and keyboard interaction remain provided by Base UI.

## Verify by hand

Toggle image/video generation and account enablement switches. Verify click, Space key, disabled state, focus ring, thumb motion, and submitted form state.
