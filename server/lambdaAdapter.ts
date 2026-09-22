import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import type { Plugin, ViteDevServer } from 'vite'

type Middleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
) => unknown

/** Adapt our read-only Connect handlers without starting an HTTP or Vite server. */
export const createLambdaHandler = (plugins: Plugin[]) => {
  const handlers: Middleware[] = []
  const registration = {
    middlewares: { use: (handler: Middleware) => handlers.push(handler) },
  }
  for (const plugin of plugins) {
    const hook = plugin.configureServer
    if (typeof hook === 'function')
      hook.call({} as never, registration as unknown as ViteDevServer)
  }
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    }
    if (event.requestContext.http.method !== 'GET') {
      return {
        statusCode: 405,
        headers: { ...headers, allow: 'GET' },
        body: '{"error":"Method not allowed."}',
      }
    }
    let body = ''
    let ended = false
    let binary = false
    const response = {
      statusCode: 200,
      setHeader: (name: string, value: string | number) => {
        headers[name.toLowerCase()] = String(value)
      },
      end: (value?: string | Uint8Array) => {
        binary = value instanceof Uint8Array
        body = binary
          ? Buffer.from(value as Uint8Array).toString('base64')
          : String(value ?? '')
        ended = true
      },
    }
    const request = {
      url:
        event.rawPath +
        (event.rawQueryString ? `?${event.rawQueryString}` : ''),
    }
    try {
      for (const handler of handlers) {
        let next = false
        await handler(
          request as IncomingMessage,
          response as unknown as ServerResponse,
          () => {
            next = true
          },
        )
        if (ended)
          return {
            statusCode: response.statusCode,
            headers,
            body,
            isBase64Encoded: binary,
          }
        if (!next) throw new Error('Handler did not finish a response')
      }
      return {
        statusCode: 404,
        headers,
        body: '{"error":"Unknown API route."}',
      }
    } catch {
      // Never log events, upstream URLs, or errors that could contain API keys.
      return {
        statusCode: 502,
        headers,
        body: '{"error":"Data service is unavailable."}',
      }
    }
  }
}
