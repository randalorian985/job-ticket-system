import type { ApiValidationError } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'jobTicket.accessToken'

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
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
