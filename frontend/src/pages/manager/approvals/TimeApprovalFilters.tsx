import type { AssignableEmployeeDto, JobTicketListItemDto } from '../../../types'
import { JobTicketCombobox } from '../common/JobTicketCombobox'
import { EmployeeCombobox } from './EmployeeCombobox'
import type { TimeApprovalFilter, TimeApprovalFilterState } from './timeApprovalShared'

type Props = {
  employees: AssignableEmployeeDto[]
  jobTickets: JobTicketListItemDto[]
  filters: TimeApprovalFilterState
  loading: boolean
  onChange: (filters: TimeApprovalFilterState) => void
  onApply: () => void
}

export function TimeApprovalFilters({ employees, jobTickets, filters, loading, onChange, onApply }: Props) {
  const update = <K extends keyof TimeApprovalFilterState>(key: K, value: TimeApprovalFilterState[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <article className="card stack">
      <div className="report-results-heading">
        <div>
          <h3>Approval queue filters</h3>
          <p className="muted">Pending entries load automatically. Every filter below is optional.</p>
        </div>
      </div>
      <div className="report-filters">
        <label>
          Date from
          <input aria-label="Date from" type="date" value={filters.dateFrom} onChange={(event) => update('dateFrom', event.target.value)} />
        </label>
        <label>
          Date to
          <input aria-label="Date to" type="date" value={filters.dateTo} onChange={(event) => update('dateTo', event.target.value)} />
        </label>
        <label>
          Job ticket
          <JobTicketCombobox
            tickets={jobTickets}
            selectedJobTicketId={filters.jobTicketId}
            inputId="time-approval-job-ticket"
            label="Job ticket filter"
            onSelect={(ticket) => onChange({
              ...filters,
              jobTicketId: ticket?.id ?? ''
            })}
          />
        </label>
        <label>
          Employee
          <EmployeeCombobox
            employees={employees}
            selectedEmployeeId={filters.employeeId}
            onSelect={(employee) => onChange({
              ...filters,
              employeeId: employee?.id ?? ''
            })}
          />
        </label>
        <label>
          Approval status
          <select aria-label="Approval status filter" value={filters.approvalStatus} onChange={(event) => update('approvalStatus', event.target.value as TimeApprovalFilter)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </label>
        <label>
          Search
          <input aria-label="Approval queue search" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search job ticket, customer, site, location…" />
        </label>
        <button type="button" onClick={onApply} disabled={loading}>{loading ? 'Loading…' : 'Apply Filters'}</button>
      </div>
    </article>
  )
}
