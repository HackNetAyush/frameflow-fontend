import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      // Cross-origin isolation is what makes SharedArrayBuffer — and therefore
      // the ffmpeg.wasm fallback — available. `credentialless` rather than
      // `require-corp` because the stricter mode also blocks third-party
      // scripts that do not send CORP headers, Clerk's included.
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
