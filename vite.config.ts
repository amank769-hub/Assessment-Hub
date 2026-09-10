import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  // Relative asset paths, so the built app opens by double-clicking
  // dist/index.html — an absolute /assets/ path resolves to the filesystem
  // root under file:// and the page comes up blank.
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { host: '0.0.0.0', port: 5173 },
  build: { chunkSizeWarningLimit: 1600 },
})
