import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/httpClient'
import { ticketStatusFiltersApi } from '../../../api/ticketStatusFiltersApi'
import type { SaveTicketStatusFilterOptionDto } from '../../../types'
import { jobStatusOptions } from '../managerDisplay'
import '../companyConfiguration/CompanyConfigurationPage.css'

const statusLabel = (status: number) =>
  jobStatusOptions.find((option) => option.value === status)?.label.replace(/^\d+ - /, '') ?? 'Unknown status'

const messageForError = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback

const orderedFilters = (filters: SaveTicketStatusFilterOptionDto[]) =>
  [...filters].sort((left, right) => left.displayOrder - right.displayOrder || left.displayLabel.localeCompare(right.displayLabel))

const nextOrder = (filters: SaveTicketStatusFilterOptionDto[]) =>
  filters.length ? Math.max(...filters.map((filter) => filter.displayOrder)) + 10 : 10

const nextStatus = (filters: SaveTicketStatusFilterOptionDto[]) => {
  const activeStatuses = new Set(filters.filter((filter) => filter.isActive).map((filter) => filter.status))
  return jobStatusOptions.find((option) => !activeStatuses.has(option.value))?.value ?? jobStatusOptions[0].value
}

export function TicketStatusFiltersPage() {
  const [filters, setFilters] = useState<SaveTicketStatusFilterOptionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    ticketStatusFiltersApi
      .list()
      .then((items) => {
        if (!isMounted) return
        setFilters(orderedFilters(items.map((item) => ({ ...item }))))
      })
      .catch((loadError) => {
        if (isMounted) setError(messageForError(loadError, 'Ticket filters could not be loaded.'))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const activeFilters = useMemo(() => filters.filter((filter) => filter.isActive), [filters])
  const inactiveFilters = filters.length - activeFilters.length

  const updateFilter = (index: number, patch: Partial<SaveTicketStatusFilterOptionDto>) => {
    setFilters((current) => current.map((filter, filterIndex) => (
      filterIndex === index ? { ...filter, ...patch } : filter
    )))
    setMessage(null)
  }

  const addFilter = () => {
    const status = nextStatus(filters)
    setFilters((current) => [
      ...current,
      {
        id: null,
        displayLabel: statusLabel(status),
        status,
        displayOrder: nextOrder(current),
        isActive: true
      }
    ])
    setMessage(null)
  }

  const saveFilters = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const saved = await ticketStatusFiltersApi.save({
        options: orderedFilters(filters).map((filter) => ({
          ...filter,
          displayLabel: filter.displayLabel.trim()
        }))
      })
      setFilters(orderedFilters(saved.map((item) => ({ ...item }))))
      setMessage('Ticket status filters saved.')
    } catch (saveError) {
      setError(messageForError(saveError, 'Ticket status filters could not be saved.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="stack" aria-busy={isLoading || isSaving}>
      <header className="dashboard-hero-strip">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Ticket Filters</h2>
          <p className="muted">Status filter boxes shown in the Manager/Admin job ticket queue.</p>
        </div>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {isLoading ? <p className="muted" role="status">Loading ticket status filters...</p> : null}

      {!isLoading ? (
        <form className="company-config-panel stack" onSubmit={saveFilters}>
          <div className="company-config-section-heading">
            <div>
              <p className="eyebrow">Queue Filters</p>
              <h3>Status filter list</h3>
              <p className="muted">{activeFilters.length} active, {inactiveFilters} inactive.</p>
            </div>
            <button type="button" className="secondary-button" onClick={addFilter}>Add filter</button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Display Label</th>
                  <th>Status Value</th>
                  <th>Order</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {filters.map((filter, index) => (
                  <tr key={filter.id ?? `new-${index}`}>
                    <td>
                      <label className="sr-label">
                        Display label {index + 1}
                        <input
                          value={filter.displayLabel}
                          onChange={(event) => updateFilter(index, { displayLabel: event.target.value })}
                        />
                      </label>
                    </td>
                    <td>
                      <label className="sr-label">
                        Status value {index + 1}
                        <select
                          value={filter.status}
                          onChange={(event) => {
                            const status = Number(event.target.value)
                            updateFilter(index, { status, displayLabel: filter.displayLabel.trim() ? filter.displayLabel : statusLabel(status) })
                          }}
                        >
                          {jobStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                    </td>
                    <td>
                      <label className="sr-label">
                        Display order {index + 1}
                        <input
                          type="number"
                          value={filter.displayOrder}
                          onChange={(event) => updateFilter(index, { displayOrder: Number(event.target.value) })}
                        />
                      </label>
                    </td>
                    <td>
                      <label className="checkbox-label">
                        <input
                          checked={filter.isActive}
                          onChange={(event) => updateFilter(index, { isActive: event.target.checked })}
                          type="checkbox"
                        />
                        Active
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!filters.length ? <p className="muted">No ticket status filters are configured. Add a filter or save the default list after reload.</p> : null}

          <div className="row">
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save ticket filters'}</button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
