import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFile } from 'node:fs/promises'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'github-pages-spa-fallback',
    async closeBundle() { await copyFile('dist/index.html', 'dist/404.html') },
  }],
  build: { target: 'es2022' },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
  },
})
