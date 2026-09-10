/**
 * Moves the standalone build to Nexora-AI.html at the repo root — the file
 * someone is meant to double-click — and reports its size.
 */
import { copyFileSync, rmSync, statSync } from 'node:fs'

const src = 'standalone/index.html'
const out = 'Nexora-AI.html'
copyFileSync(src, out)
rmSync('standalone', { recursive: true, force: true })
console.log(`\n  ${out}  ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB  — open this directly in a browser\n`)
