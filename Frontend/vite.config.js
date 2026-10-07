import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GOOGLE_CLIENT_ID is public (it's visible in Google's sign-in popup anyway), so it can be
  // exposed to the browser under the same name the backend uses, without the VITE_ prefix.
  envPrefix: ['VITE_', 'GOOGLE_CLIENT_ID'],
})
