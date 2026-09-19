import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

/**
 * Refuse to produce a bundle that cannot reach its backend.
 *
 * Vite inlines `VITE_*` at build time, so these are not settings a deployment
 * can correct afterwards — they are compiled into the artefact. Unset,
 * `VITE_SERVER_URL` becomes the literal `undefined` and every fetch goes to
 * `undefined/api/explain`; wrong, and the first symptom is a failed generation
 * minutes into someone's first video. Both are cheap to catch here and
 * expensive to catch there.
 */
const assertDeployable = (env) => {
  const url = env.VITE_SERVER_URL

  if (!url) {
    throw new Error(
      'VITE_SERVER_URL is not set. Vite bakes it into the bundle, so building without it '
      + 'ships a frontend that fetches from "undefined". Set it in .env locally, or as the '
      + 'VITE_SERVER_URL GitHub Actions secret for the deploy.',
    )
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`VITE_SERVER_URL is not a valid URL: ${url}`)
  }

  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)

  // CI only ever builds something meant to be deployed, so a localhost backend
  // there is the mistake this check exists for, not a convenience.
  if (isLocal && process.env.CI) {
    throw new Error(
      `VITE_SERVER_URL points at ${url} in a CI build. A deployed site cannot reach `
      + 'localhost — set the VITE_SERVER_URL secret to the public backend origin.',
    )
  }

  if (!isLocal && parsed.protocol !== 'https:') {
    throw new Error(
      `VITE_SERVER_URL must be https in a deployed build (got ${url}). A page served over `
      + 'https cannot call an http API; the browser blocks it as mixed content.',
    )
  }

  if (!env.VITE_CLERK_PUBLISHABLE_KEY) {
    console.warn(
      '\n  ⚠  VITE_CLERK_PUBLISHABLE_KEY is not set — this build renders the setup notice '
      + 'in place of the studio.\n',
    )
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build') assertDeployable(env)

  return {
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
  }
})
