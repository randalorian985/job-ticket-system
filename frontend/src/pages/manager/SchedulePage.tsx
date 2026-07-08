import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { schedulingApi } from '../../api/schedulingApi'
import type { SchedulableTicketDto, TechnicianScheduleDto } from '../../types'

type ViewMode = 'unscheduled' | 'calendar' | 'by-technician'
type TicketViewMode = 'rich' | 'compact'
type DurationFilter = 'all' | 'none' | 'short' | 'half' | 'full'

const PRIORITY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Normal', 3: 'High', 4: 'Urgent' }
const STATUS_LABELS: Record<number, string> = {
  1: 'Draft',
  2: 'Submitted',
  3: 'Assigned',
  4: 'In Progress',
  5: 'Waiting on Parts',
  6: 'Waiting on Customer',
  7: 'Completed',
  8: 'Cancelled'
}
const PRIORITY_CLASS: Record<number, string> = { 1: 'low', 2: 'normal', 3: 'high', 4: 'urgent' }
const scheduleTicketViewModeStorageKey = 'schedule-ticket-view-mode'

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

const displayDate = (utc?: string | null) => formatDate(utc) ?? '-'
const displayDateTime = (utc?: string | null) => formatDateTime(utc) ?? '-'
const displayDuration = (minutes?: number | null) => durationLabel(minutes) ?? 'No estimate'

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

const getStoredTicketViewMode = (): TicketViewMode => {
  if (typeof window === 'undefined') {
    return 'rich'
  }

  try {
    return window.localStorage.getItem(scheduleTicketViewModeStorageKey) === 'compact' ? 'compact' : 'rich'
  } catch {
    return 'rich'
  }
}

const getTicketScheduleState = (ticket: SchedulableTicketDto) => {
  const openItems = [
    ticket.scheduledStartAtUtc ? null : 'scheduled start',
    ticket.estimatedDurationMinutes ? null : 'estimated duration',
    ticket.assignedManagerEmployeeName ? null : 'project manager'
  ].filter((item): item is string => Boolean(item))

  if (!openItems.length) {
    return {
      label: 'Ready to work',
      detail: 'Scheduled start, estimated duration, and PM are present.',
      nextStep: 'All scheduling details are complete.',
      className: 'ready'
    }
  }

  return {
    label: 'Needs schedule review',
    detail: `Missing ${openItems.join(', ')}.`,
    nextStep: openItems.includes('scheduled start')
      ? 'Set a scheduled start time.'
      : openItems.includes('estimated duration')
        ? 'Add an estimated duration.'
        : 'Assign a project manager.',
    className: 'review'
  }
}

function ScheduleDensityToggle({
  ticketViewMode,
  onTicketViewModeChange
}: {
  ticketViewMode: TicketViewMode
  onTicketViewModeChange: (mode: TicketViewMode) => void
}) {
  return (
    <div className="ticket-view-toggle schedule-density-toggle" role="group" aria-label="schedule ticket density">
      <button
        aria-pressed={ticketViewMode === 'rich'}
        className="secondary-button compact-button"
        onClick={() => onTicketViewModeChange('rich')}
        type="button"
      >
        Rich cards
      </button>
      <button
        aria-pressed={ticketViewMode === 'compact'}
        className="secondary-button compact-button"
        onClick={() => onTicketViewModeChange('compact')}
        type="button"
      >
        Compact list
      </button>
    </div>
  )
}

function ScheduleStatusPills({ ticket }: { ticket: SchedulableTicketDto }) {
  const scheduleState = getTicketScheduleState(ticket)

  return (
    <div className="schedule-ticket-pills">
      <span className={`status-pill schedule-priority-pill schedule-priority-${PRIORITY_CLASS[ticket.priority] ?? 'normal'}`}>
        {PRIORITY_LABELS[ticket.priority] ?? 'Normal'}
      </span>
      <span className="status-pill schedule-status-pill">{STATUS_LABELS[ticket.status] ?? 'Unknown'}</span>
      <span className={`status-pill schedule-readiness-pill schedule-readiness-${scheduleState.className}`}>
        {scheduleState.label}
      </span>
    </div>
  )
}

function TicketCard({ ticket }: { ticket: SchedulableTicketDto }) {
  const scheduleState = getTicketScheduleState(ticket)

  return (
    <li className={`schedule-ticket-card schedule-ticket-card-${scheduleState.className}`}>
      <div className="schedule-ticket-main">
        <div className="schedule-ticket-copy">
          <Link to={`/manage/job-tickets/${ticket.id}`} className="schedule-ticket-number">{ticket.ticketNumber}</Link>
          <strong className="schedule-ticket-title">{ticket.title}</strong>
          <span className="muted">{STATUS_LABELS[ticket.status] ?? 'Unknown'} - {PRIORITY_LABELS[ticket.priority] ?? 'Normal'}</span>
        </div>
        <ScheduleStatusPills ticket={ticket} />
      </div>

      <div className="schedule-ticket-meta-grid">
        <div><strong>Customer</strong><span>{ticket.customerName}</span></div>
        <div><strong>Location</strong><span>{ticket.serviceLocationName}</span></div>
        <div><strong>Equipment</strong><span>{ticket.equipmentName || 'Not listed'}</span></div>
        <div><strong>PM</strong><span>{ticket.assignedManagerEmployeeName || 'Needs assignment'}</span></div>
      </div>

      <div className="schedule-readiness-panel">
        <div>Work status: {scheduleState.label} - {scheduleState.detail}</div>
        <div>Next required update: {scheduleState.nextStep}</div>
      </div>

      <div className="schedule-ticket-meta-grid schedule-ticket-date-grid">
        <div><strong>Requested</strong><span>{displayDate(ticket.requestedAtUtc)}</span></div>
        <div><strong>Due</strong><span>{displayDate(ticket.dueAtUtc)}</span></div>
        <div><strong>Scheduled</strong><span>{displayDateTime(ticket.scheduledStartAtUtc)}</span></div>
        <div><strong>Est. duration</strong><span>{displayDuration(ticket.estimatedDurationMinutes)}</span></div>
      </div>
    </li>
  )
}

function CompactTicketList({ tickets, label }: { tickets: SchedulableTicketDto[], label: string }) {
  return (
    <div className="schedule-compact-list" aria-label={label}>
      <div className="schedule-compact-list-header" aria-hidden="true">
        <span>Ticket</span>
        <span>Priority / Status</span>
        <span>Customer / Location</span>
        <span>Timing</span>
        <span>PM</span>
        <span>Open</span>
      </div>
      {tickets.map((ticket) => {
        const scheduleState = getTicketScheduleState(ticket)

        return (
          <article key={ticket.id} className={`schedule-compact-row schedule-compact-row-${scheduleState.className}`}>
            <div className="schedule-compact-primary">
              <Link to={`/manage/job-tickets/${ticket.id}`} className="schedule-ticket-number">{ticket.ticketNumber}</Link>
              <span>{ticket.title}</span>
            </div>
            <div>
              <strong>{PRIORITY_LABELS[ticket.priority] ?? 'Normal'}</strong>
              <span>{STATUS_LABELS[ticket.status] ?? 'Unknown'}</span>
            </div>
            <div>
              <strong>{ticket.customerName}</strong>
              <span>{ticket.serviceLocationName}</span>
            </div>
            <div>
              <strong>Due: {displayDate(ticket.dueAtUtc)}</strong>
              <span>Scheduled: {displayDateTime(ticket.scheduledStartAtUtc)} - Est: {displayDuration(ticket.estimatedDurationMinutes)}</span>
            </div>
            <div>
              <strong>{ticket.assignedManagerEmployeeName || 'Needs assignment'}</strong>
              <span>{scheduleState.label}</span>
            </div>
            <Link to={`/manage/job-tickets/${ticket.id}`} className="button-link secondary-link compact-ticket-open">Open</Link>
          </article>
        )
      })}
    </div>
  )
}

function TicketCollection({
  tickets,
  ticketViewMode,
  label
}: {
  tickets: SchedulableTicketDto[]
  ticketViewMode: TicketViewMode
  label: string
}) {
  if (ticketViewMode === 'compact') {
    return <CompactTicketList tickets={tickets} label={label} />
  }

  return (
    <ul className="schedule-ticket-list">
      {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
    </ul>
  )
}

function UnscheduledView({ ticketViewMode }: { ticketViewMode: TicketViewMode }) {
  const [tickets, setTickets] = useState<SchedulableTicketDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')

  useEffect(() => {
    schedulingApi.getUnscheduled()
      .then(setTickets)
      .catch(() => setError('Unable to load unscheduled tickets.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = tickets
    if (priorityFilter !== 'all') {
      result = result.filter((ticket) => ticket.priority === priorityFilter)
    }
    if (durationFilter === 'none') {
      result = result.filter((ticket) => !ticket.estimatedDurationMinutes)
    } else if (durationFilter === 'short') {
      result = result.filter((ticket) => ticket.estimatedDurationMinutes && ticket.estimatedDurationMinutes <= 120)
    } else if (durationFilter === 'half') {
      result = result.filter((ticket) => ticket.estimatedDurationMinutes && ticket.estimatedDurationMinutes > 120 && ticket.estimatedDurationMinutes <= 240)
    } else if (durationFilter === 'full') {
      result = result.filter((ticket) => ticket.estimatedDurationMinutes && ticket.estimatedDurationMinutes > 240)
    }
    return result
  }, [tickets, priorityFilter, durationFilter])

  const hasActiveFilters = priorityFilter !== 'all' || durationFilter !== 'all'
  const resetFilters = () => {
    setPriorityFilter('all')
    setDurationFilter('all')
  }

  if (loading) return <p className="muted" role="status">Loading...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="stack">
      <section className="filter-panel schedule-filter-panel" aria-label="scheduling filters">
        <label className="sr-label">
          Priority
          <select value={String(priorityFilter)} onChange={(event) => setPriorityFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
            <option value="all">All priorities</option>
            <option value="4">Urgent</option>
            <option value="3">High</option>
            <option value="2">Normal</option>
            <option value="1">Low</option>
          </select>
        </label>
        <label className="sr-label">
          Est. Duration
          <select value={durationFilter} onChange={(event) => setDurationFilter(event.target.value as DurationFilter)}>
            <option value="all">All</option>
            <option value="none">No estimate</option>
            <option value="short">Under 2 hrs</option>
            <option value="half">2 - 4 hrs</option>
            <option value="full">Over 4 hrs</option>
          </select>
        </label>
        <div className="queue-filter-result schedule-filter-result" role="status" aria-live="polite">
          <strong>Results</strong>
          <span>
            {tickets.length === 0
              ? 'No unscheduled tickets loaded.'
              : filtered.length === tickets.length
                ? `Showing ${tickets.length} ticket${tickets.length === 1 ? '' : 's'}.`
                : `Showing ${filtered.length} of ${tickets.length} tickets.`}
          </span>
        </div>
        <button type="button" className="secondary-button" onClick={resetFilters} disabled={!hasActiveFilters}>Reset Filters</button>
      </section>

      {filtered.length === 0
        ? <p className="muted">{tickets.length === 0 ? 'No unscheduled open tickets. All caught up!' : 'No tickets match the selected filters.'}</p>
        : <TicketCollection tickets={filtered} ticketViewMode={ticketViewMode} label="unscheduled ticket list" />}
    </div>
  )
}

function CalendarView({ ticketViewMode }: { ticketViewMode: TicketViewMode }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [tickets, setTickets] = useState<SchedulableTicketDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { startUtc, endUtc, monday, sunday } = useMemo(() => getWeekRange(weekOffset), [weekOffset])
  const weekLabel = `${formatDate(monday.toISOString())} - ${formatDate(sunday.toISOString())}`

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
    for (const ticket of tickets) {
      if (!ticket.scheduledStartAtUtc) continue
      const day = new Date(ticket.scheduledStartAtUtc).toDateString()
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(ticket)
    }
    return map
  }, [tickets])

  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push(day.toDateString())
  }

  return (
    <div className="stack">
      <div className="schedule-week-nav">
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((week) => week - 1)}>Prev week</button>
        <span className="schedule-week-label">{weekLabel}</span>
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((week) => week + 1)}>Next week</button>
        {weekOffset !== 0 && <button type="button" className="secondary-button" onClick={() => setWeekOffset(0)}>This week</button>}
      </div>
      {loading && <p className="muted" role="status">Loading...</p>}
      {error && <p className="error">{error}</p>}
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
                  : <TicketCollection tickets={dayTickets} ticketViewMode={ticketViewMode} label={`${day} scheduled tickets`} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TechnicianView({ ticketViewMode }: { ticketViewMode: TicketViewMode }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [techs, setTechs] = useState<TechnicianScheduleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { startUtc, endUtc, monday, sunday } = useMemo(() => getWeekRange(weekOffset), [weekOffset])
  const weekLabel = `${formatDate(monday.toISOString())} - ${formatDate(sunday.toISOString())}`

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
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((week) => week - 1)}>Prev week</button>
        <span className="schedule-week-label">{weekLabel}</span>
        <button type="button" className="secondary-button" onClick={() => setWeekOffset((week) => week + 1)}>Next week</button>
        {weekOffset !== 0 && <button type="button" className="secondary-button" onClick={() => setWeekOffset(0)}>This week</button>}
      </div>
      {loading && <p className="muted" role="status">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && techs.length === 0 && <p className="muted">No scheduled tickets with assigned technicians this week.</p>}
      {!loading && !error && techs.map((tech) => (
        <div key={tech.employeeId} className="schedule-tech-section">
          <h3 className="schedule-tech-name">{tech.employeeName}</h3>
          <TicketCollection tickets={tech.tickets} ticketViewMode={ticketViewMode} label={`${tech.employeeName} scheduled tickets`} />
        </div>
      ))}
    </div>
  )
}

export function SchedulePage() {
  const [view, setView] = useState<ViewMode>('unscheduled')
  const [ticketViewMode, setTicketViewMode] = useState<TicketViewMode>(getStoredTicketViewMode)

  const updateTicketViewMode = (mode: TicketViewMode) => {
    setTicketViewMode(mode)
    try {
      window.localStorage.setItem(scheduleTicketViewModeStorageKey, mode)
    } catch {
      // Local storage is optional; the selected view still applies for this render.
    }
  }

  const viewTitle = view === 'unscheduled' ? 'Unscheduled Queue' : view === 'calendar' ? 'By Date' : 'By Technician'
  const viewDescription = view === 'unscheduled'
    ? 'Jobs that need dispatch review before the schedule is complete.'
    : view === 'calendar'
      ? 'Scheduled tickets grouped by day for the selected week.'
      : 'Scheduled tickets grouped by assigned technician for the selected week.'

  return (
    <section className="schedule-page stack" aria-label="Scheduling">
      <header className="job-ticket-queue-header schedule-page-header">
        <div>
          <h2>Scheduling</h2>
          <p className="muted">Manage work schedules, review unscheduled tickets, and plan by date or technician.</p>
        </div>
        <div className="row dashboard-actions">
          <Link to="/manage/job-tickets" className="button-link secondary-link">Review Job Tickets</Link>
          <Link to="/manage/job-tickets/new" className="button-link">New Ticket</Link>
        </div>
      </header>

      <section className="queue-results-panel schedule-results-panel">
        <div className="queue-results-heading schedule-results-heading">
          <div>
            <h3>{viewTitle}</h3>
            <span className="muted">{viewDescription}</span>
          </div>
          <div className="schedule-results-actions">
            <div className="schedule-view-nav" role="group" aria-label="schedule view">
              <button type="button" className={`tab-btn${view === 'unscheduled' ? ' tab-btn--active' : ''}`} onClick={() => setView('unscheduled')}>Unscheduled Queue</button>
              <button type="button" className={`tab-btn${view === 'calendar' ? ' tab-btn--active' : ''}`} onClick={() => setView('calendar')}>By Date</button>
              <button type="button" className={`tab-btn${view === 'by-technician' ? ' tab-btn--active' : ''}`} onClick={() => setView('by-technician')}>By Technician</button>
            </div>
            <ScheduleDensityToggle ticketViewMode={ticketViewMode} onTicketViewModeChange={updateTicketViewMode} />
          </div>
        </div>

        <div className="schedule-view-content">
          {view === 'unscheduled' && <UnscheduledView ticketViewMode={ticketViewMode} />}
          {view === 'calendar' && <CalendarView ticketViewMode={ticketViewMode} />}
          {view === 'by-technician' && <TechnicianView ticketViewMode={ticketViewMode} />}
        </div>
      </section>
    </section>
  )
}
