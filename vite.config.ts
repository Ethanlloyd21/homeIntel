import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import { createApiPlugins } from './server/apiPlugins.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const outputs = existsSync('amplify_outputs.json')
    ? JSON.parse(readFileSync('amplify_outputs.json', 'utf8'))
    : undefined
  const apiBaseUrl = env.VITE_API_BASE_URL || outputs?.custom?.apiUrl || ''
  if (process.env.AWS_APP_ID && !apiBaseUrl) {
    throw new Error(
      'Amplify backend API URL is missing. Deploy the backend before building.',
    )
  }
  return {
    // Explicitly allow only public configuration into the browser bundle.
    envPrefix: [],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.VITE_KOFI_URL': JSON.stringify(env.VITE_KOFI_URL || ''),
    },
    resolve: {
      alias: {
        '@': '/src',
        App: '/src/App.tsx',
        assets: '/src/assets',
        components: '/src/components',
        data: '/src/data',
        hooks: '/src/hooks',
        pages: '/src/pages',
        services: '/src/services',
        store: '/src/store',
        'styles.css': '/src/styles.css',
        utils: '/src/utils',
      },
    },
    plugins: [react(), tailwindcss(), ...createApiPlugins(env)],
  }
})
