import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from system and .env files
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy tất cả request /api → backend (tránh CORS hoàn toàn)
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy WebSocket socket.io -> backend socket server
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
          rewriteWsOrigin: true,
        },
      },
    },
  }
})

