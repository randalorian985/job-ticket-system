import type { AssignableEmployeeDto } from '../../../types'
import { SearchCombobox } from '../common/SearchCombobox'

type Props = {
  employees: AssignableEmployeeDto[]
  selectedEmployeeId: string
  onSelect: (employee: AssignableEmployeeDto | null) => void
}

const displayName = (employee: AssignableEmployeeDto) => `${employee.firstName} ${employee.lastName}`

export function EmployeeCombobox({ employees, selectedEmployeeId, onSelect }: Props) {
  return (
    <SearchCombobox
      options={employees}
      selectedId={selectedEmployeeId}
      inputId="time-approval-employee"
      label="Employee filter"
      placeholder="All employees"
      allOptionsLabel="All employees"
      emptyMessage="No employees match this search."
      getOptionId={(employee) => employee.id}
      getOptionLabel={displayName}
      onSelect={onSelect}
    />
  )
}
