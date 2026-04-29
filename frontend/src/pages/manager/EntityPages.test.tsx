import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../api/masterDataApi'
import { CustomersPage, PartsPage } from './EntityPages'

vi.mock('../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    listParts: vi.fn(),
    listVendors: vi.fn(),
    listPartCategories: vi.fn(),
    createVendor: vi.fn(),
    createPartCategory: vi.fn()
  }
}))

describe('CustomersPage', () => {
  it('renders master-data create/edit workflow shell', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    render(<CustomersPage />)
    expect(await screen.findByText('Acme (No account)')).toBeInTheDocument()
    expect(screen.getByText('Create Customer')).toBeInTheDocument()
  })
})

describe('PartsPage', () => {
  it('renders vendor/category management and submits create', async () => {
    vi.mocked(masterDataApi.listParts).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listVendors).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.listPartCategories).mockResolvedValue([] as any)
    vi.mocked(masterDataApi.createVendor).mockResolvedValue({ id: 'v1', name: 'Vendor A' } as any)
    render(<PartsPage />)
    const input = await screen.findByPlaceholderText('Vendor name')
    fireEvent.change(input, { target: { value: 'Vendor A' } })
    fireEvent.click(screen.getByText('Create Vendor'))
    expect(masterDataApi.createVendor).toHaveBeenCalled()
    expect(screen.getByText('Create Category')).toBeInTheDocument()
  })
})
