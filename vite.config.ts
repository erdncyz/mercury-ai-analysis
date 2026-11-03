import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { modelsApiPlugin } from './vite.models-api.ts'
import { pulseApiPlugin } from './vite.pulse-api.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), modelsApiPlugin(), pulseApiPlugin()],
})