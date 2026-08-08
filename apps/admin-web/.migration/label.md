# label

2026-08-07, transformation engine, migrated successfully to the native label recommended for Base UI projects.

## Changed

`src/components/ui/label.tsx`: removed `@radix-ui/react-label` and retained the exact existing class and ref API on a native `<label>`. Leftover scan is clean: `grep -n "radix-ui\|@radix-ui" src/components/ui/label.tsx` returns no matches.

## Left alone

All label consumers retain their existing `htmlFor`, children, and classes. Base UI Field was not introduced because these labels are used with ordinary inputs and composite controls throughout the app.

## Behavior changes

None expected; Radix Label wrapped the native label behavior used here.

## Verify by hand

Open Login and any management form. Click a label linked with `htmlFor` and confirm its input receives focus; verify switch-adjacent labels remain clickable and styled correctly.
