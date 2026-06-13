import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../../api/masterDataApi'
import { PartsPage } from './MasterDataPages'

vi.mock('../../../api/masterDataApi', () => ({
  masterDataApi: {
    listParts: vi.fn(),
    listVendors: vi.fn(),
    listPartCategories: vi.fn(),
    createPart: vi.fn()
  }
}))

describe('MasterData part numeric validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([{ id: 'pc1', name: 'Category A', isArchived: false }] as any)
  })

  it('keeps negative part numeric values from submitting', async () => {
    render(<PartsPage />)

    const partsCard = screen.getByRole('heading', { name: 'Parts' }).closest('article')!
    const partForm = within(partsCard).getByRole('form', { name: 'part form' })
    fireEvent.change(await within(partsCard).findByLabelText('Part category'), { target: { value: 'pc1' } })
    fireEvent.change(within(partsCard).getByLabelText('Part number'), { target: { value: 'PN-1' } })
    fireEvent.change(within(partsCard).getByLabelText('Name'), { target: { value: 'Filter' } })
    fireEvent.change(within(partsCard).getByLabelText('Unit cost'), { target: { value: '-1' } })
    fireEvent.submit(partForm)

    expect(await screen.findByText('Part cost, price, quantity on hand, and reorder threshold must be zero or greater.')).toBeInTheDocument()
    expect(masterDataApi.createPart).not.toHaveBeenCalled()

    fireEvent.change(within(partsCard).getByLabelText('Unit cost'), { target: { value: '0' } })
    fireEvent.change(within(partsCard).getByLabelText('Reorder threshold'), { target: { value: '-2' } })
    fireEvent.submit(partForm)

    expect(await screen.findByText('Part cost, price, quantity on hand, and reorder threshold must be zero or greater.')).toBeInTheDocument()
    expect(masterDataApi.createPart).not.toHaveBeenCalled()
    await waitFor(() => expect(masterDataApi.listPartCategories).toHaveBeenCalled())
  })
})
