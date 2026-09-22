import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { env } from '$amplify/env/relointel-api'
import { createApiPlugins } from '../../../server/apiPlugins.ts'
import { createLambdaHandler } from '../../../server/lambdaAdapter.ts'
import { withRequestDeadline } from '../../../server/upstreamFetch.ts'
import {
  loadPlaces,
  readCache,
  responseCacheKey,
  writeCache,
} from './sharedCache.js'

const serve = createLambdaHandler(createApiPlugins(env, loadPlaces))

export const handler = (event: APIGatewayProxyEventV2) =>
  withRequestDeadline(async () => {
    const cacheable =
      event.requestContext.http.method === 'GET' &&
      event.rawPath !== '/api/traffic-status'
    const key = responseCacheKey(event.rawPath, event.rawQueryString)
    if (cacheable) {
      try {
        const cached = await readCache<APIGatewayProxyStructuredResultV2>(key)
        if (cached) return cached
      } catch {
        /* Other APIs remain available during a cache outage. */
      }
    }
    const result = await serve(event)
    const ttl = Number(
      String(result.headers?.['cache-control'] || '').match(
        /max-age=(\d+)/,
      )?.[1] || 0,
    )
    if (cacheable && result.statusCode === 200 && ttl > 0) {
      try {
        await writeCache(key, result, ttl)
      } catch {
        /* Cache writes are best effort. */
      }
    }
    return result
  })
