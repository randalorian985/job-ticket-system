import { useMemo, useState } from 'react'
import type { AssignableEmployeeDto } from '../../../types'

type Props = {
  employees: AssignableEmployeeDto[]
  selectedEmployeeId: string
  onSelect: (employee: AssignableEmployeeDto | null) => void
}

const displayName = (employee: AssignableEmployeeDto) => `${employee.firstName} ${employee.lastName}`

export function EmployeeCombobox({ employees, selectedEmployeeId, onSelect }: Props) {
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const visibleValue = open ? query : selectedEmployee ? displayName(selectedEmployee) : ''
  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return normalizedQuery
      ? employees.filter((employee) => displayName(employee).toLocaleLowerCase().includes(normalizedQuery))
      : employees
  }, [employees, query])

  const selectEmployee = (employee: AssignableEmployeeDto | null) => {
    onSelect(employee)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="employee-combobox">
      <input
        aria-label="Employee filter"
        role="combobox"
        aria-expanded={open}
        aria-controls="time-approval-employee-options"
        aria-autocomplete="list"
        placeholder="All employees"
        value={visibleValue}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          if (selectedEmployeeId) onSelect(null)
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
        <div id="time-approval-employee-options" role="listbox" className="employee-combobox-options">
          <button type="button" role="option" aria-selected={!selectedEmployeeId} onMouseDown={(event) => event.preventDefault()} onClick={() => selectEmployee(null)}>All employees</button>
          {filteredEmployees.map((employee) => (
            <button key={employee.id} type="button" role="option" aria-selected={employee.id === selectedEmployeeId} onMouseDown={(event) => event.preventDefault()} onClick={() => selectEmployee(employee)}>
              {displayName(employee)}
            </button>
          ))}
          {filteredEmployees.length === 0 ? <p className="muted">No employees match this search.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
