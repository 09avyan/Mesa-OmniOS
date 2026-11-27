import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] } }, // catalogue lives in ../supabase/seed
  build: {
    target: ['es2019', 'safari13'], cssTarget: 'safari13',
    rollupOptions: {
      // libraries change rarely: separate files stay cached on the phone across app updates
      output: { manualChunks: (id) => id.includes('node_modules/@supabase') ? 'supabase' : id.includes('node_modules/react') || id.includes('node_modules/scheduler') ? 'react' : id.includes('node_modules/qrcode') ? 'qrcode' : id.includes('seed/catalog.json') ? 'catalog' : undefined },
    },
  },
})
