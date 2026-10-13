import { readFile, stat } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'
import type { Plugin } from 'vite'

type Rule = { source: string; target: string; status: string }

// Vite preview otherwise falls back to the homepage for extensionless tool URLs.
// Use the deployment manifest so local HTTP checks exercise the same page shells.
export const createSeoPreviewPlugin = (): Plugin => ({
  name: 'seo-preview-routing',
  configurePreviewServer: async (server) => {
    const directory = resolve(server.config.root, server.config.build.outDir)
    let rules: Rule[]
    try {
      rules = JSON.parse(
        await readFile(resolve(directory, 'hosting-rewrites.json'), 'utf8'),
      )
    } catch {
      return
    }
    const fileFor = (path: string) => {
      const file = resolve(directory, `.${path}`)
      const remainder = relative(directory, file)
      return remainder.startsWith('..') || isAbsolute(remainder) ? null : file
    }
    server.middlewares.use(async (request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') return next()
      const url = new URL(request.url || '/', 'http://localhost')
      if (url.pathname.startsWith('/api/')) return next()
      const rule = rules.find((item) => item.source === url.pathname)
      if (rule?.status === '301') {
        response.statusCode = 301
        response.setHeader('Location', `${rule.target}${url.search}`)
        response.end()
        return
      }
      let target = rule?.status === '200' ? rule.target : null
      let status = 200
      if (!target) {
        let decoded: string
        try {
          decoded = decodeURIComponent(url.pathname)
        } catch {
          response.statusCode = 400
          response.end()
          return
        }
        const requested = fileFor(decoded)
        try {
          if (requested && (await stat(requested)).isFile()) return next()
          if (url.pathname === '/') return next()
        } catch {
          /* Serve the custom 404 for a missing resource. */
        }
        target = '/404.html'
        status = 404
      }
      const file = fileFor(target)
      if (!file) {
        response.statusCode = 404
        response.end()
        return
      }
      try {
        const html = await readFile(file)
        response.statusCode = status
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(request.method === 'HEAD' ? undefined : html)
      } catch (error) {
        next(error)
      }
    })
  },
})
