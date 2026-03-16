import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: mode === 'local' ? {
      '/api': 'http://localhost:8080',
      '/internal-api': 'http://localhost:8080'
    } : undefined
  }
}))
