import { AsyncLocalStorage } from 'node:async_hooks'

const requestDeadline = new AsyncLocalStorage<AbortSignal>()

/** Leave time for an error response before API Gateway's 30-second limit. */
export const withRequestDeadline = <T>(run: () => Promise<T>) =>
  requestDeadline.run(AbortSignal.timeout(25_000), run)

export const upstreamFetch: typeof fetch = (input, init) => {
  const deadline = requestDeadline.getStore()
  const signal = deadline
    ? AbortSignal.any([deadline, ...(init?.signal ? [init.signal] : [])])
    : init?.signal
  return fetch(input, { ...init, signal })
}
