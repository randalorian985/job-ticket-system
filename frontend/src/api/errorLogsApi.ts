import type { ApplicationErrorLogDto, ClientErrorLogRequestDto } from '../types'
import { apiRequest } from './httpClient'

export type ErrorLogQuery = {
  limit?: number
  source?: string
  search?: string
}

const errorLogsPath = '/api/error-logs'

const toQuery = (query: ErrorLogQuery = {}) => {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', String(query.limit))
  if (query.source) params.set('source', query.source)
  if (query.search?.trim()) params.set('search', query.search.trim())
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const errorLogsApi = {
  list: (query?: ErrorLogQuery) =>
    apiRequest<ApplicationErrorLogDto[]>(`${errorLogsPath}${toQuery(query)}`),
  recordClient: (payload: ClientErrorLogRequestDto) =>
    apiRequest<ApplicationErrorLogDto>(`${errorLogsPath}/client`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
