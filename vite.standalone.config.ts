import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

/**
 * Standalone build — everything inlined into one HTML file.
 *
 * Chrome refuses to load an external `<script type="module">` over file://
 * (module scripts are CORS-gated and a file:// origin is opaque), so a normal
 * multi-file build comes up blank when you double-click it. Inlining removes
 * the fetch entirely, which makes the result openable with no server, no
 * install and no network.
 */
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: 'standalone',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
