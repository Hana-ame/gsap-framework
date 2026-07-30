/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * pixi.js v8 exports.import → ./lib/index.mjs (doesn't exist).
 * This alias redirects to ./lib/index.js which does exist.
 */
const pixiJsAlias = {
  find: 'pixi.js',
  replacement: path.resolve(__dirname, 'node_modules/pixi.js/lib/index.js'),
}

export default defineConfig({
  resolve: {
    alias: [
      { find: '@framework', replacement: path.resolve(__dirname, 'src/framework') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      pixiJsAlias,
    ],
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
