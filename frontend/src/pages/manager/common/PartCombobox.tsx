import type { PartDto } from '../../../types'
import { SearchCombobox } from './SearchCombobox'

type Props = {
  parts: PartDto[]
  selectedPartId: string
  onSelect: (part: PartDto | null) => void
}

const displayName = (part: PartDto) => `${part.partNumber} - ${part.name}`

export function PartCombobox({ parts, selectedPartId, onSelect }: Props) {
  return (
    <SearchCombobox
      options={parts}
      selectedId={selectedPartId}
      inputId="parts-approval-catalog-part"
      label="Catalog part filter"
      placeholder="All catalog parts"
      allOptionsLabel="All catalog parts"
      emptyMessage="No catalog parts match this search."
      getOptionId={(part) => part.id}
      getOptionLabel={displayName}
      onSelect={onSelect}
    />
  )
}