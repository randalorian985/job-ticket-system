import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { errorLogsApi } from '../../../api/errorLogsApi'
import type { ApplicationErrorLogDto } from '../../../types'
import { ErrorLogsPage } from './ErrorLogsPage'

vi.mock('../../../api/errorLogsApi', () => ({
  errorLogsApi: {
    list: vi.fn()
  }
}))

const log: ApplicationErrorLogDto = {
  id: 'log-1',
  occurredAtUtc: '2026-07-08T02:30:00Z',
  severity: 'Error',
  source: 'Server',
  message: 'Unable to load ticket.',
  cause: 'InvalidOperationException',
  location: 'JobTicketsController.Get',
  requestPath: '/api/job-tickets/123',
  requestMethod: 'GET',
  userId: 'user-1',
  userRole: 'Admin',
  userAgent: 'Unit test browser',
  stackTrace: 'stack trace',
  metadataJson: '{"traceIdentifier":"trace-1"}'
}

describe('ErrorLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(errorLogsApi.list).mockResolvedValue([log])
  })

  afterEach(() => {
    cleanup()
  })

  it('shows error cause, time, and location context', async () => {
    render(<ErrorLogsPage />)

    expect(await screen.findByRole('heading', { name: 'Error Logs' })).toBeInTheDocument()
    expect(await screen.findByText('Unable to load ticket.')).toBeInTheDocument()
    expect(screen.getByText('InvalidOperationException')).toBeInTheDocument()
    expect(screen.getByText('GET /api/job-tickets/123')).toBeInTheDocument()
    expect(screen.getByText('JobTicketsController.Get')).toBeInTheDocument()
  })

  it('applies source, search, and limit filters', async () => {
    const user = userEvent.setup()
    render(<ErrorLogsPage />)

    await screen.findByText('Unable to load ticket.')
    await user.selectOptions(screen.getByLabelText('Source'), 'Server')
    await user.type(screen.getByLabelText('Search errors'), 'ticket')
    await user.selectOptions(screen.getByLabelText('Limit'), '50')
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    await waitFor(() => expect(errorLogsApi.list).toHaveBeenLastCalledWith({
      source: 'Server',
      search: 'ticket',
      limit: 50
    }))
  })
})
