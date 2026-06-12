import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { masterDataApi } from '../../../api/masterDataApi'
import { CustomersPage } from './MasterDataPages'

vi.mock('../../../api/masterDataApi', () => ({
  masterDataApi: {
    listCustomers: vi.fn(),
    archiveCustomer: vi.fn(),
    unarchiveCustomer: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn()
  }
}))

const confirmSpy = vi.spyOn(window, 'confirm')

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  confirmSpy.mockReturnValue(true)
  vi.mocked(masterDataApi.listCustomers).mockResolvedValue([{ id: 'c1', name: 'Acme', isArchived: false }] as any)
})

describe('MasterData archive confirmations', () => {
  it('does not archive when the Manager/Admin cancels confirmation', async () => {
    confirmSpy.mockReturnValueOnce(false)

    render(<CustomersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to archive customer "Acme"?')
    expect(masterDataApi.archiveCustomer).not.toHaveBeenCalled()
  })

  it('archives after the Manager/Admin confirms', async () => {
    vi.mocked(masterDataApi.archiveCustomer).mockResolvedValue(undefined as any)

    render(<CustomersPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }))

    await waitFor(() => expect(masterDataApi.archiveCustomer).toHaveBeenCalledWith('c1'))
  })
})
