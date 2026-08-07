# scroll-area

2026-08-07, transformation engine against Base UI 1.7, migrated successfully with the existing viewport and scrollbar styling preserved.

## Changed

`src/components/ui/scroll-area.tsx`: replaced Radix ScrollArea with `@base-ui/react/scroll-area` and renamed `ScrollAreaScrollbar`/`ScrollAreaThumb` to Base UI's `Scrollbar`/`Thumb`. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/scroll-area.tsx` returns no matches.

## Left alone

Consumers do not pass Radix-only `type`, `scrollHideDelay`, `dir`, or `nonce` props, so no consumer files required changes. Existing Sonner and ordinary CSS overflow containers were not touched.

## Behavior changes

Scrollbar visibility is now controlled by Base UI overflow/hover state rather than Radix's visibility modes. This project used only the default wrapper behavior.

## Verify by hand

Open the model list, AI Gateway model/log lists, and long dialogs. Scroll by wheel, trackpad, dragging the thumb, Page Up/Down, and keyboard; verify the thumb size and rounded viewport.
