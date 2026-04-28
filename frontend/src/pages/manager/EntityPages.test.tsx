import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { masterDataApi } from '../../api/masterDataApi'
import { CustomersPage } from './EntityPages'

vi.mock('../../api/masterDataApi', () => ({ masterDataApi: { listCustomers: vi.fn() } }))

describe('CustomersPage', () => {
  it('renders master-data create/edit workflow shell', async () => {
    vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme' }] as any)
    render(<CustomersPage />)
    expect(await screen.findByText('Acme (No account)')).toBeInTheDocument()
    expect(screen.getByText('Create Customer')).toBeInTheDocument()
  })
})
