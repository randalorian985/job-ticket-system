import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SearchCombobox } from './SearchCombobox'

type Option = {
  id: string
  label: string
}

const options: Option[] = [
  { id: 'alpha', label: 'Alpha Ticket' },
  { id: 'beta', label: 'Beta Ticket' }
]

afterEach(cleanup)

function Harness({ initialId = '' }: { initialId?: string }) {
  const [selected, setSelected] = useState<Option | null>(options.find((option) => option.id === initialId) ?? null)

  return (
    <>
      <SearchCombobox
        options={options}
        selectedId={selected?.id ?? ''}
        inputId="ticket-search"
        label="Ticket search"
        placeholder="All tickets"
        allOptionsLabel="All tickets"
        emptyMessage="No tickets match."
        getOptionId={(option) => option.id}
        getOptionLabel={(option) => option.label}
        onSelect={setSelected}
      />
      <output aria-label="Selected ticket">{selected?.id ?? 'none'}</output>
    </>
  )
}

describe('SearchCombobox', () => {
  it('filters options and commits the selected object', () => {
    render(<Harness />)

    const input = screen.getByRole('combobox', { name: 'Ticket search' })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Beta' } })

    expect(screen.queryByRole('option', { name: 'Alpha Ticket' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Beta Ticket' }))

    expect(screen.getByLabelText('Selected ticket')).toHaveTextContent('beta')
    expect(input).toHaveValue('Beta Ticket')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('clears an existing selection when typed text does not resolve to an option', () => {
    render(<Harness initialId="alpha" />)

    const input = screen.getByRole('combobox', { name: 'Ticket search' })
    expect(input).toHaveValue('Alpha Ticket')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Unknown' } })

    expect(screen.getByLabelText('Selected ticket')).toHaveTextContent('none')
    expect(screen.getByText('No tickets match.')).toBeInTheDocument()

    fireEvent.blur(input)
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('placeholder', 'All tickets')
  })
})
