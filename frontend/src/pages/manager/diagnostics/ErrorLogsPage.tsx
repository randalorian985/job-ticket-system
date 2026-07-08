import { FormEvent, useEffect, useMemo, useState } from 'react'
import { errorLogsApi } from '../../../api/errorLogsApi'
import { ApiError } from '../../../api/httpClient'
import type { ApplicationErrorLogDto } from '../../../types'

const sourceOptions = ['', 'Server', 'Client', 'ApiRequest']
const limitOptions = [50, 100, 250, 500]

const formatDateTime = (value: string) => new Date(value).toLocaleString()

const messageForError = (requestError: unknown) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 401 || requestError.status === 403) return 'Only Admin users can review application errors.'
    return requestError.message
  }

  return 'Unable to load application errors.'
}

const locationLabel = (log: ApplicationErrorLogDto) =>
  [log.requestMethod, log.requestPath].filter(Boolean).join(' ') || log.location || 'Location unavailable'

const renderMetadata = (metadataJson?: string | null) => {
  if (!metadataJson) return null

  try {
    const parsed = JSON.parse(metadataJson)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return metadataJson
  }
}

export function ErrorLogsPage() {
  const [logs, setLogs] = useState<ApplicationErrorLogDto[]>([])
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(100)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const latestAt = useMemo(
    () => logs.length ? formatDateTime(logs[0].occurredAtUtc) : null,
    [logs]
  )

  const load = async (next = { source, search, limit }) => {
    try {
      setIsLoading(true)
      setError(null)
      setLogs(await errorLogsApi.list({
        source: next.source || undefined,
        search: next.search || undefined,
        limit: next.limit
      }))
    } catch (requestError) {
      setError(messageForError(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setError('Unable to load application errors.'))
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    load().catch(() => setError('Unable to load application errors.'))
  }

  const reset = () => {
    setSource('')
    setSearch('')
    setLimit(100)
    load({ source: '', search: '', limit: 100 }).catch(() => setError('Unable to load application errors.'))
  }

  return (
    <section className="stack" aria-label="application error logs">
      <header className="card stack">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Error Logs</h2>
          <p className="muted">Private review of server and browser errors with cause, time, and location context.</p>
        </div>
      </header>

      <form className="filter-panel queue-filter-panel" onSubmit={onSubmit} aria-label="error log filters">
        <label className="sr-label">
          Source
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="">All sources</option>
            {sourceOptions.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="sr-label queue-search-field">
          Search errors
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Message, cause, path, or role"
          />
        </label>
        <label className="sr-label">
          Limit
          <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
            {limitOptions.map((option) => <option key={option} value={option}>{option} rows</option>)}
          </select>
        </label>
        <div className="queue-filter-result" role="status" aria-live="polite">
          <strong>{isLoading ? 'Loading' : `${logs.length} errors`}</strong>
          <span>{latestAt ? `Latest: ${latestAt}` : 'No matching errors.'}</span>
        </div>
        <button type="submit" disabled={isLoading}>{isLoading ? 'Loading...' : 'Apply Filters'}</button>
        <button type="button" className="secondary-button" onClick={reset} disabled={isLoading}>Reset</button>
      </form>

      {error ? <p className="error" role="alert">{error}</p> : null}
      {isLoading ? <p className="muted" role="status">Loading application errors...</p> : null}
      {!isLoading && !error && logs.length === 0 ? <p className="muted">No application errors match the current filters.</p> : null}

      {logs.length > 0 ? (
        <ul className="review-list">
          {logs.map((log) => {
            const metadata = renderMetadata(log.metadataJson)
            return (
              <li key={log.id} className="card stack">
                <div className="review-heading">
                  <div>
                    <p className="eyebrow">{log.source} - {log.severity}</p>
                    <h3>{log.message}</h3>
                    <p className="muted">{formatDateTime(log.occurredAtUtc)}</p>
                  </div>
                  <span className="status-pill">{log.userRole ?? 'No user'}</span>
                </div>

                <div className="ticket-meta-grid">
                  <div><strong>Cause</strong><span>{log.cause ?? 'Cause unavailable'}</span></div>
                  <div><strong>Where</strong><span>{locationLabel(log)}</span></div>
                  <div><strong>Page / component</strong><span>{log.location ?? 'Not provided'}</span></div>
                  <div><strong>User</strong><span>{log.userId ?? 'Not captured'}</span></div>
                </div>

                <details>
                  <summary>Technical details</summary>
                  <div className="stack">
                    {log.userAgent ? <p className="muted"><strong>User agent:</strong> {log.userAgent}</p> : null}
                    {metadata ? (
                      <pre className="code-block">{metadata}</pre>
                    ) : null}
                    {log.stackTrace ? (
                      <pre className="code-block">{log.stackTrace}</pre>
                    ) : (
                      <p className="muted">No stack trace captured.</p>
                    )}
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
