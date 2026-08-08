# button

2026-08-07, transformation engine against Base UI 1.7, migrated successfully while preserving the legacy new-york classes.

## Changed

`src/components/ui/button.tsx`: replaced Radix Slot/asChild composition with the real `@base-ui/react/button` primitive. `src/components/manage/AIGateway.tsx` and `src/components/manage/TokenManagement.tsx`: changed link-button consumers from `asChild` to Base UI's `render` prop. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/button.tsx` returns no matches.

## Left alone

Other UI wrappers remain unchanged until their dependency-ordered migration. Sonner is third-party and intentionally untouched.

## Behavior changes

The public polymorphic prop is now `render` instead of `asChild`; the rendered links retain their previous attributes and children.

## Verify by hand

Open AI Gateway and Token Management. Click Break-glass UI, Open login page, and Open Fluxbox; verify each opens the expected target in a new tab and keyboard focus remains visible.
