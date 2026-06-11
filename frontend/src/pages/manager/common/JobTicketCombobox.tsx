import { useMemo, useState } from 'react'
import type { JobTicketListItemDto } from '../../../types'

type Props = {
  tickets: JobTicketListItemDto[]
  selectedJobTicketId: string
  onSelect: (ticket: JobTicketListItemDto | null) => void
  inputId: string
  label?: string
}

const displayName = (ticket: JobTicketListItemDto) => `${ticket.ticketNumber} - ${ticket.title}`

export function JobTicketCombobox({
  tickets,
  selectedJobTicketId,
  onSelect,
  inputId,
  label = 'Job ticket'
}: Props) {
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedJobTicketId)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const visibleValue = open ? query : selectedTicket ? displayName(selectedTicket) : ''
  const optionsId = `${inputId}-options`
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return normalizedQuery
      ? tickets.filter((ticket) => displayName(ticket).toLocaleLowerCase().includes(normalizedQuery))
      : tickets
  }, [query, tickets])

  const selectTicket = (ticket: JobTicketListItemDto | null) => {
    onSelect(ticket)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="employee-combobox">
      <input
        id={inputId}
        aria-label={label}
        role="combobox"
        aria-expanded={open}
        aria-controls={optionsId}
        aria-autocomplete="list"
        placeholder="All job tickets"
        value={visibleValue}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          if (selectedJobTicketId) onSelect(null)
        }}
        onBlur={() => {
          setQuery('')
          setOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('')
            setOpen(false)
          }
        }}
      />
      {open ? (
        <div id={optionsId} role="listbox" className="employee-combobox-options">
          <button type="button" role="option" aria-selected={!selectedJobTicketId} onMouseDown={(event) => event.preventDefault()} onClick={() => selectTicket(null)}>
            All job tickets
          </button>
          {filteredTickets.map((ticket) => (
            <button key={ticket.id} type="button" role="option" aria-selected={ticket.id === selectedJobTicketId} onMouseDown={(event) => event.preventDefault()} onClick={() => selectTicket(ticket)}>
              {displayName(ticket)}
            </button>
          ))}
          {filteredTickets.length === 0 ? <p className="muted">No job tickets match this search.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
