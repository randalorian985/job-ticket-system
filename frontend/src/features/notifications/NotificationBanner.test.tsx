import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NotificationBanner } from '../../components/NotificationBanner'
import { NotificationProvider, useNotification } from './NotificationContext'

function NotifyButton({ message, type }: { message: string; type?: Parameters<ReturnType<typeof useNotification>['notify']>[1] }) {
  const { notify } = useNotification()
  return <button onClick={() => notify(message, type)}>{`notify-${type ?? 'error'}`}</button>
}

function TestApp({ message = 'Test message', type }: { message?: string; type?: Parameters<ReturnType<typeof useNotification>['notify']>[1] }) {
  return (
    <NotificationProvider>
      <NotifyButton message={message} type={type} />
      <NotificationBanner />
    </NotificationProvider>
  )
}

describe('NotificationBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('renders nothing when there are no notifications', () => {
    render(<TestApp />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error notification and keeps it until dismissed', () => {
    render(<TestApp message="Something went wrong" type="error" />)

    fireEvent.click(screen.getByRole('button', { name: 'notify-error' }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Error notifications do not auto-dismiss — still visible after 30 s
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows a success notification and auto-dismisses after 5 s', () => {
    render(<TestApp message="Saved successfully" type="success" />)

    fireEvent.click(screen.getByRole('button', { name: 'notify-success' }))
    expect(screen.getByText('Saved successfully')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument()
  })

  it('shows a warning notification and auto-dismisses after 8 s', () => {
    render(<TestApp message="Token expiring soon" type="warning" />)

    fireEvent.click(screen.getByRole('button', { name: 'notify-warning' }))
    expect(screen.getByText('Token expiring soon')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(7_999))
    expect(screen.getByText('Token expiring soon')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByText('Token expiring soon')).not.toBeInTheDocument()
  })

  it('dismisses a notification when the close button is clicked', () => {
    render(<TestApp message="Dismiss me" type="error" />)

    fireEvent.click(screen.getByRole('button', { name: 'notify-error' }))
    expect(screen.getByText('Dismiss me')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })

  it('deduplicates identical notifications of the same type', () => {
    render(<TestApp message="Duplicate" type="error" />)

    fireEvent.click(screen.getByRole('button', { name: 'notify-error' }))
    fireEvent.click(screen.getByRole('button', { name: 'notify-error' }))

    const messages = screen.getAllByText('Duplicate')
    expect(messages).toHaveLength(1)
  })
})
