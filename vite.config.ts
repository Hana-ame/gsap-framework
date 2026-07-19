/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@framework': path.resolve(__dirname, 'src/framework'),
    },
  },
  plugins: [react()],
  server: {
    allowedHosts: ['wsl-5173.moonchan.xyz', '.moonchan.xyz'],
  },
  build: {
    sourcemap: true,
  },
  test: {
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
    ],
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    execArgv: ['--experimental-require-module'],
    setupFiles: [],
  },
})
