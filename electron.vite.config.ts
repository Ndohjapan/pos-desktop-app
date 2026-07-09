import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['@prisma/client', 'prisma']
      }
    },
    define: {
      'process.env.API_URL': JSON.stringify(process.env.VITE_API_URL)
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/components': resolve('src/renderer/src/components')
      }
    },
    define: {
      'process.env.API_URL': JSON.stringify(process.env.VITE_API_URL)
    },
    plugins: [react(), tailwindcss()]
  }
})
