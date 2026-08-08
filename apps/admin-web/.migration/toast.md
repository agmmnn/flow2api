# toast

2026-08-07, transformation engine against Base UI 1.7, completed by removing the unused Radix toast stack.

## Changed

Deleted `src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`, and `src/hooks/use-toast.ts`. They formed a self-contained Radix toast implementation with no application consumer. Leftover scan is clean: `grep -R "react-toast\|use-toast\|ui/toaster" src` returns no matches.

## Left alone

`src/components/ui/sonner.tsx` and the active `<Toaster>` in `src/App.tsx` are intentionally untouched. Sonner remains the application's notification system.

## Behavior changes

None. The removed modules were unreachable dead code.

## Verify by hand

Trigger a success and an error notification from the dashboard, confirm each Sonner toast appears at the bottom right, can be dismissed, and follows the current theme.
