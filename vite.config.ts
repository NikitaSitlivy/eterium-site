import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter((dep) => (
          !dep.includes('vendor-supabase') &&
          !dep.includes('vendor-three')
        ))
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/three/')) return 'vendor-three'
          if (id.includes('/gsap/')) return 'vendor-gsap'
          if (id.includes('/@supabase/')) return 'vendor-supabase'
          if (id.includes('/vue/') || id.includes('/vue-router/')) return 'vendor-vue'

          return 'vendor-misc'
        }
      }
    }
  }
})
