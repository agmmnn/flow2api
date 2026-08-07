# tabs

2026-08-07, transformation engine against Base UI 1.7, migrated successfully with existing tab visuals preserved.

## Changed

`src/components/ui/tabs.tsx`: replaced Radix Tabs with `@base-ui/react/tabs`, renamed Trigger to the Base `Tab` part and Content to `Panel`, and changed active/disabled class hooks to `data-active` and `aria-disabled`. Existing public wrapper names remain stable. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/tabs.tsx` returns no matches.

## Left alone

Tab consumers use string values and single-argument value handlers, both compatible with Base UI. No consumer passed Radix-only `activationMode`, `forceMount`, or `loop` props.

## Behavior changes

Base UI defaults to manual keyboard activation: arrow keys move focus and Enter/Space activates. Radix defaulted to automatic activation while arrowing. This intentional Base UI behavior is not patched.

## Verify by hand

Open every Manage tab set and AI Gateway nested tabs. Click each tab, then use Left/Right arrows followed by Enter/Space; verify the selected panel, focus ring, and active styling.
