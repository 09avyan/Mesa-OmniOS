import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['..'] } }, // catalogue lives in ../supabase/seed
})
