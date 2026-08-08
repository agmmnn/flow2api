import { cp, mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"

import { build } from "esbuild"

const root = import.meta.dirname
const dist = resolve(root, "dist")

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
await cp(resolve(root, "static"), dist, { recursive: true })

await build({
  entryPoints: {
    background: resolve(root, "src/background.ts"),
    content: resolve(root, "src/content.ts"),
    diagnostics: resolve(root, "src/diagnostics.ts"),
    options: resolve(root, "src/options.ts"),
    popup: resolve(root, "src/popup.ts"),
    stealth: resolve(root, "src/stealth.ts"),
  },
  outdir: dist,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "chrome120",
  sourcemap: true,
  minify: false,
  logLevel: "info",
})
