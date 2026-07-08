import { useEffect } from 'react'
import { reportClientError } from '../../api/httpClient'

const describeReason = (reason: unknown) => {
  if (reason instanceof Error) return reason.message
  if (typeof reason === 'string') return reason
  try {
    return JSON.stringify(reason)
  } catch {
    return 'Unhandled promise rejection'
  }
}

export function GlobalErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportClientError({
        message: event.message || 'Unhandled browser error',
        cause: event.error instanceof Error ? event.error.name : 'window.error',
        source: 'Client',
        location: `${event.filename || window.location.pathname}${event.lineno ? `:${event.lineno}` : ''}${event.colno ? `:${event.colno}` : ''}`,
        requestPath: `${window.location.pathname}${window.location.search}`,
        requestMethod: 'Browser',
        stackTrace: event.error instanceof Error ? event.error.stack : null
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      void reportClientError({
        message: describeReason(reason),
        cause: reason instanceof Error ? reason.name : 'unhandledrejection',
        source: 'Client',
        location: window.location.pathname,
        requestPath: `${window.location.pathname}${window.location.search}`,
        requestMethod: 'Browser',
        stackTrace: reason instanceof Error ? reason.stack : null
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
