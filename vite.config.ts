import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/Application_Gestion_Travaux/',
  plugins: [react(), tailwindcss()],
})
