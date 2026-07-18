/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['wsl-5173.moonchan.xyz', '.moonchan.xyz'],
  },
  build: {
    sourcemap: true,
  },
  test: {
    include: ['src/framework/utils/__tests__/**/*.test.ts'],
  },
})
