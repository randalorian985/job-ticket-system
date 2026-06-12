import type { JobTicketListItemDto } from '../../../types'
import { SearchCombobox } from './SearchCombobox'

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
  return (
    <SearchCombobox
      options={tickets}
      selectedId={selectedJobTicketId}
      inputId={inputId}
      label={label}
      placeholder="All job tickets"
      allOptionsLabel="All job tickets"
      emptyMessage="No job tickets match this search."
      getOptionId={(ticket) => ticket.id}
      getOptionLabel={displayName}
      onSelect={onSelect}
    />
  )
}
