import type { ApiValidationError, ClientErrorLogRequestDto } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'jobTicket.accessToken'

// Registered by AuthContext so the module-level API layer can trigger session expiry
let unauthorizedHandler: (() => void) | null = null
let isReportingClientError = false
export function registerUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}
export function clearUnauthorizedHandler() {
  unauthorizedHandler = null
}

export class ApiError extends Error {
  status: number
  payload?: ApiValidationError

  constructor(message: string, status: number, payload?: ApiValidationError) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
}

export async function reportClientError(payload: ClientErrorLogRequestDto) {
  const token = authStorage.getToken()
  if (!token || isReportingClientError) return

  isReportingClientError = true
  try {
    await fetch(`${API_BASE_URL}/api/error-logs/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        source: 'Client',
        severity: 'Error',
        occurredAtUtc: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ...payload
      })
    })
  } catch {
    // Error reporting must never break the user workflow.
  } finally {
    isReportingClientError = false
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiValidationError | undefined
  try {
    payload = (await response.json()) as ApiValidationError
  } catch {
    // ignore JSON parse failure
  }

  const validationErrors = payload?.errors
    ? Object.entries(payload.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join(' | ')
    : undefined

  const message = payload?.error ?? validationErrors ?? `Request failed with status ${response.status}`
  return new ApiError(message, response.status, payload)
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  })

  if (!response.ok) {
    const apiError = await parseError(response)
    if (response.status === 401) {
      unauthorizedHandler?.()
    }
    if (response.status >= 500 && !path.startsWith('/api/error-logs')) {
      const metadata = {
        apiPath: path,
        status: response.status,
        method: init?.method ?? 'GET'
      }
      void reportClientError({
        message: apiError.message,
        cause: `HTTP ${response.status}`,
        source: 'ApiRequest',
        location: typeof window !== 'undefined' ? window.location.pathname : null,
        requestPath: path,
        requestMethod: init?.method ?? 'GET',
        metadataJson: JSON.stringify(metadata)
      })
    }
    throw apiError
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
