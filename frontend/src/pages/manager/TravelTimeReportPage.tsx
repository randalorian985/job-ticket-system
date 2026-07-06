import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../../api/usersApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import type { AssignableEmployeeDto, TimeApprovalQueueItemDto } from '../../types'

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '—'

const formatDuration = (minutes?: number | null) => {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function TravelTimeReportPage() {
  const [entries, setEntries] = useState<TimeApprovalQueueItemDto[]>([])
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalMinutes = entries.reduce((sum, e) => sum + (e.totalMinutes ?? 0), 0)

  const load = async (filters = { employeeId, dateFrom, dateTo }) => {
    setIsLoading(true)
    setError(null)
    try {
      const [entriesResponse, employeesResponse] = await Promise.all([
        timeEntriesApi.listForReview({
          employeeId: filters.employeeId || undefined,
          dateFromUtc: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
          dateToUtc: filters.dateTo ? new Date(filters.dateTo + 'T23:59:59').toISOString() : undefined,
          approvalStatus: undefined,
          entryType: 2
        }),
        usersApi.listAssignableEmployees()
      ])
      setEntries(entriesResponse)
      setEmployees(employeesResponse)
    } catch {
      setError('Unable to load travel time records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setError('Unable to load travel time records.'))
  }, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    load({ employeeId, dateFrom, dateTo }).catch(() => setError('Unable to load travel time records.'))
  }

  return (
    <section className="stack parts-history-page">
      <div className="card stack parts-history-topbar">
        <div className="review-heading">
          <div>
            <h2>Travel Time Report</h2>
            <p className="muted">Travel entries logged by technicians when traveling to job sites.</p>
          </div>
          <div className="parts-request-summary-badges" aria-label="travel summary">
            <span>{entries.length} entries</span>
            <span>{formatDuration(totalMinutes)} total</span>
          </div>
        </div>
        <form className="review-grid parts-history-filter-grid" onSubmit={onSubmit} aria-label="travel time filters">
          <label>
            Technician
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">All technicians</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </label>
          <label>
            From date
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            To date
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <div className="parts-history-filter-actions">
            <button type="submit">Filter</button>
          </div>
        </form>
      </div>

      {isLoading ? <p className="muted" role="status">Loading travel records…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <article className="card stack parts-history-results">
        <h3>Travel entries</h3>
        {entries.length > 0 ? (
          <ul className="stack supply-history-list">
            {entries.map((entry) => (
              <li key={entry.id} className="supply-history-item">
                <div className="supply-history-item-heading">
                  <strong>{entry.employeeName}</strong>
                  <p className="muted">
                    {entry.jobTicketNumber} · {entry.customerName} · {entry.siteName}
                  </p>
                  <p className="muted">
                    Started: {formatDateTime(entry.startedAtUtc)}
                    {entry.endedAtUtc ? ` · Ended: ${formatDateTime(entry.endedAtUtc)}` : ' · In progress'}
                    {entry.totalMinutes ? ` · ${formatDuration(entry.totalMinutes)}` : ''}
                  </p>
                </div>
                <Link className="button-link secondary-link" to={`/manage/job-tickets/${entry.jobTicketId}`}>
                  Open ticket
                </Link>
              </li>
            ))}
          </ul>
        ) : !isLoading ? (
          <p className="muted">No travel records match the current filters.</p>
        ) : null}
      </article>
    </section>
  )
}
