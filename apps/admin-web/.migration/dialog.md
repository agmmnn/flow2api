# dialog

2026-08-07, transformation engine against Base UI 1.7, migrated successfully with centered layout and current styling preserved.

## Changed

`src/components/ui/dialog.tsx`: replaced Radix Dialog with `@base-ui/react/dialog`, mapped Overlay to Backdrop and Content to Popup, and converted state-keyframe classes to Base UI starting/ending transition hooks. Public wrapper names remain unchanged. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/dialog.tsx` returns no matches.

## Left alone

Dialog consumers use Root, Popup, Title, Description, Header, and Footer without Radix-only focus or outside-interaction callbacks, so no consumer rewrites were required.

## Behavior changes

Base UI Portal renders a wrapper element and open-change callbacks can receive event details. Existing single-argument handlers remain compatible. Centering, focus trapping, Escape dismissal, outside dismissal, and focus return remain enabled.

## Verify by hand

Open and close token, API-key, Runway, GeminiGen, and gateway dialogs. Check initial focus, Tab trapping, Escape, backdrop click, close button, focus return, scrolling, and enter/exit transitions.
