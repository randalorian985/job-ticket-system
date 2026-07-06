import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { schedulingApi } from '../../api/schedulingApi'
import type { SchedulableTicketDto, TechnicianScheduleDto } from '../../types'

type ViewMode = 'unscheduled' | 'calendar' | 'by-technician'

const PRIORITY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Normal', 3: 'High', 4: 'Urgent' }
const STATUS_LABELS: Record<number, string> = {
  1: 'Draft', 2: 'Submitted', 3: 'Assigned', 4: 'In Progress',
  5: 'Waiting on Parts', 6: 'Waiting on Customer', 7: 'Completed', 8: 'Cancelled'
}
const PRIORITY_CLASS: Record<number, string> = { 1: 'inactive', 2: 'active', 3: 'warning', 4: 'error' }

const durationLabel = (minutes?: number | null) => {
  if (!minutes) return null
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const formatDate = (utc?: string | null) => {
  if (!utc) return null
  return new Date(utc).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (utc?: string | null) => {
  if (!utc) return null
  return new Date(utc).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const getWeekRange = (offset = 0) => {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { startUtc: monday.toISOString(), endUtc: sunday.toISOString(), monday, sunday }
}

function TicketCard({ ticket }: { ticket: SchedulableTicketDto }) {
  return (
    <li className="schedule-ticket-card">
      <div className="schedule-ticket-header">
        <Link to={`/manage/job-tickets/${ticket.id}`} className="schedule-ticket-number">{ticket.ticketNumber}</Link>
        <span className={`status-pill ${PRIORITY_CLASS[ticket.priority] ?? 'active'}`}>{PRIORITY_LABELS[ticket.priority] ?? 'Normal'}</span>
        <span className="status-pill inactive">{STATUS_LABELS[ticket.status] ?? 'Unknown'}</span>
      </div>
      <strong className="schedule-ticket-title">{ticket.title}</strong>
      <div className="schedule-ticket-meta">
        <span>{ticket.customerName}</span>
        <span className="muted">·</span>
        <span>{ticket.serviceLocationName}</span>
        {ticket.equipmentName && <><span className="muted">·</span><span>{ticket.equipmentName}</span></>}
      </div>
      <div className="schedule-ticket-dates">
        {ticket.scheduledStartAtUtc && <span>Scheduled: {formatDateTime(ticket.scheduledStartAtUtc)}</span>}
        {ticket.dueAtUtc && <span>Due: {formatDate(ticket.dueAtUtc)}</span>}
        {ticket.requestedAtUtc && !ticket.scheduledStartAtUtc && <span className="muted">Requested: {formatDate(ticket.requestedAtUtc)}</span>}
        {durationLabel(ticket.estimatedDurationMinutes) && <span className="muted">Est: {durationLabel(ticket.estimatedDurationMinutes)}</span>}
        {ticket.assignedManagerEmployeeName && <span className="muted">PM: {ticket.assignedManagerEmployeeName}</span>}
      </div>
    </li>
  )
}

function UnscheduledView() {
  const [tickets, setTickets] = useState<SchedulableTicketDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    schedulingApi.getUnscheduled()
      .then(setTickets)
      .catch(() => setError('Unable to load unscheduled tickets.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Loading…</p>
  if (error) return <p className="error-message">{error}</p>
  if (tickets.length === 0) return <p className="muted">No unscheduled open tickets. All caught up!</p>

  return (
    <ul className="schedule-ticket-list">
      {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
    </ul>
  )
}

function CalendarView() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [tickets, setTickets] = useState<SchedulableTicketDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { startUtc, endUtc, monday, sunday } = useMemo(() => getWeekRange(weekOffset), [weekOffset])
  const weekLabel = `${formatDate(monday.toISOString())} – ${formatDate(sunday.toISOString())}`

  useEffect(() => {
    setLoading(true)
    setError(null)
    schedulingApi.getCalendar(startUtc, endUtc)
      .then(setTickets)
      .catch(() => setError('Unable to load calendar.'))
      .finally(() => setLoading(false))
  }, [startUtc, endUtc])

  const byDay = useMemo(() => {
    const map = new Map<string, SchedulableTicketDto[]>()
    for (const t of tickets) {
      if (!t.scheduledStartAtUtc) continue
      const day = new Date(t.scheduledStartAtUtc).toDateString()
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(t)
    }
    return map
  }, [tickets])

  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d.toDateString())
  }

  return (
    <div className="stack">
      <div className="schedule-week-nav">
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((w) => w - 1)}>← Prev week</button>
        <span className="schedule-week-label">{weekLabel}</span>
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((w) => w + 1)}>Next week →</button>
        {weekOffset !== 0 && <button type="button" className="secondary-button" onClick={() => setWeekOffset(0)}>This week</button>}
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <div className="schedule-calendar-grid">
          {days.map((day) => {
            const dayTickets = byDay.get(day) ?? []
            const date = new Date(day)
            const isToday = date.toDateString() === new Date().toDateString()
            return (
              <div key={day} className={`schedule-day-col${isToday ? ' schedule-day-today' : ''}`}>
                <div className="schedule-day-header">
                  {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {dayTickets.length > 0 && <span className="schedule-day-count">{dayTickets.length}</span>}
                </div>
                {dayTickets.length === 0
                  ? <p className="muted schedule-day-empty">No tickets</p>
                  : <ul className="schedule-ticket-list">{dayTickets.map((t) => <TicketCard key={t.id} ticket={t} />)}</ul>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TechnicianView() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [techs, setTechs] = useState<TechnicianScheduleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { startUtc, endUtc, monday, sunday } = useMemo(() => getWeekRange(weekOffset), [weekOffset])
  const weekLabel = `${formatDate(monday.toISOString())} – ${formatDate(sunday.toISOString())}`

  useEffect(() => {
    setLoading(true)
    setError(null)
    schedulingApi.getByTechnician(startUtc, endUtc)
      .then(setTechs)
      .catch(() => setError('Unable to load technician schedule.'))
      .finally(() => setLoading(false))
  }, [startUtc, endUtc])

  return (
    <div className="stack">
      <div className="schedule-week-nav">
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((w) => w - 1)}>← Prev week</button>
        <span className="schedule-week-label">{weekLabel}</span>
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((w) => w + 1)}>Next week →</button>
        {weekOffset !== 0 && <button type="button" className="secondary-button" onClick={() => setWeekOffset(0)}>This week</button>}
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && techs.length === 0 && <p className="muted">No scheduled tickets with assigned technicians this week.</p>}
      {!loading && !error && techs.map((tech) => (
        <div key={tech.employeeId} className="schedule-tech-section">
          <h3 className="schedule-tech-name">{tech.employeeName}</h3>
          <ul className="schedule-ticket-list">
            {tech.tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function SchedulePage() {
  const [view, setView] = useState<ViewMode>('unscheduled')

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Scheduling</h2>
          <p className="muted">Manage work schedules, review unscheduled tickets, and plan by date or technician.</p>
        </div>
        <Link to="/manage/job-tickets/new" className="button-link">New Ticket</Link>
      </div>

      <div className="schedule-view-nav">
        <button type="button" className={`tab-btn${view === 'unscheduled' ? ' tab-btn--active' : ''}`} onClick={() => setView('unscheduled')}>Unscheduled Queue</button>
        <button type="button" className={`tab-btn${view === 'calendar' ? ' tab-btn--active' : ''}`} onClick={() => setView('calendar')}>By Date</button>
        <button type="button" className={`tab-btn${view === 'by-technician' ? ' tab-btn--active' : ''}`} onClick={() => setView('by-technician')}>By Technician</button>
      </div>

      <div className="schedule-view-content">
        {view === 'unscheduled' && <UnscheduledView />}
        {view === 'calendar' && <CalendarView />}
        {view === 'by-technician' && <TechnicianView />}
      </div>
    </section>
  )
}
