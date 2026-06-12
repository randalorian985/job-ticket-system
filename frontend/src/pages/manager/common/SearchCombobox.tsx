import { useState } from 'react'

type Props<T> = {
  options: T[]
  selectedId: string
  inputId: string
  label: string
  placeholder: string
  allOptionsLabel: string
  emptyMessage: string
  getOptionId: (option: T) => string
  getOptionLabel: (option: T) => string
  onSelect: (option: T | null) => void
}

export function SearchCombobox<T>({
  options,
  selectedId,
  inputId,
  label,
  placeholder,
  allOptionsLabel,
  emptyMessage,
  getOptionId,
  getOptionLabel,
  onSelect
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => getOptionId(option) === selectedId)
  const visibleValue = open ? query : selectedOption ? getOptionLabel(selectedOption) : ''
  const optionsId = `${inputId}-options`
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredOptions = normalizedQuery
    ? options.filter((option) => getOptionLabel(option).toLocaleLowerCase().includes(normalizedQuery))
    : options

  const selectOption = (option: T | null) => {
    onSelect(option)
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
        placeholder={placeholder}
        value={visibleValue}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          if (selectedId) onSelect(null)
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
          <button type="button" role="option" aria-selected={!selectedId} onMouseDown={(event) => event.preventDefault()} onClick={() => selectOption(null)}>
            {allOptionsLabel}
          </button>
          {filteredOptions.map((option) => {
            const optionId = getOptionId(option)
            return (
              <button
                key={optionId}
                type="button"
                role="option"
                aria-selected={optionId === selectedId}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                {getOptionLabel(option)}
              </button>
            )
          })}
          {filteredOptions.length === 0 ? <p className="muted">{emptyMessage}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
