import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mailerConfigurationApi } from '../../../api/mailerConfigurationApi'
import type { MailerConfigurationDto } from '../../../types'
import { MailerSettingsPage } from './MailerSettingsPage'

vi.mock('../../../api/mailerConfigurationApi', () => ({
  mailerConfigurationApi: {
    get: vi.fn(),
    update: vi.fn(),
    sendTest: vi.fn()
  }
}))

const configuration: MailerConfigurationDto = {
  id: 'mailer-config-1',
  provider: 'ManualSmtp',
  enabled: true,
  configurationSource: 'Database',
  isConfigured: true,
  status: 'Ready',
  statusMessage: 'Outgoing mail is configured.',
  fromName: 'Dispatch',
  fromAddress: 'dispatch@example.com',
  replyToAddress: 'office@example.com',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpEnableSsl: true,
  smtpUsername: 'dispatch@example.com',
  smtpPasswordSet: true,
  appBaseUrl: 'https://dev.mudbugdigital.com',
  lastTestedAtUtc: null,
  lastTestSucceeded: null,
  lastTestMessage: null,
  updatedAtUtc: '2026-07-07T12:00:00Z'
}

describe('MailerSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mailerConfigurationApi.get).mockResolvedValue(configuration)
    vi.mocked(mailerConfigurationApi.update).mockImplementation(async (payload) => ({
      ...configuration,
      ...payload,
      smtpPasswordSet: Boolean(payload.smtpPassword) || (configuration.smtpPasswordSet && !payload.clearSmtpPassword),
      microsoft365ClientSecretSet: Boolean(payload.microsoft365ClientSecret),
      updatedAtUtc: '2026-07-07T13:00:00Z'
    }))
    vi.mocked(mailerConfigurationApi.sendTest).mockResolvedValue({
      success: true,
      message: 'Test email sent to owner@example.com.',
      testedAtUtc: '2026-07-07T13:05:00Z'
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('saves manual SMTP settings with an optional new password', async () => {
    const user = userEvent.setup()
    render(<MailerSettingsPage />)

    expect(await screen.findByRole('heading', { name: 'Mailer Settings' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Manual SMTP/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Google Workspace/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /Microsoft 365 Graph/i })).toBeEnabled()

    await user.clear(screen.getByLabelText('SMTP host'))
    await user.type(screen.getByLabelText('SMTP host'), 'smtp.mailhost.com')
    await user.clear(screen.getByLabelText('SMTP password'))
    await user.type(screen.getByLabelText('SMTP password'), 'new-app-password')
    await user.click(screen.getByRole('button', { name: 'Save mailer settings' }))

    await waitFor(() => expect(mailerConfigurationApi.update).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'ManualSmtp',
      smtpHost: 'smtp.mailhost.com',
      smtpPassword: 'new-app-password',
      clearSmtpPassword: false
    })))
    expect(await screen.findByText('Mailer settings saved.')).toBeInTheDocument()
  })

  it('saves Microsoft 365 Graph application settings', async () => {
    const user = userEvent.setup()
    render(<MailerSettingsPage />)

    await screen.findByRole('heading', { name: 'Mailer Settings' })
    await user.click(screen.getByRole('radio', { name: /Microsoft 365 Graph/i }))
    await user.clear(screen.getByLabelText('Tenant ID or domain'))
    await user.type(screen.getByLabelText('Tenant ID or domain'), 'contoso.onmicrosoft.com')
    await user.clear(screen.getByLabelText('Application client ID'))
    await user.type(screen.getByLabelText('Application client ID'), '00000000-0000-0000-0000-000000000000')
    await user.clear(screen.getByLabelText('Client secret'))
    await user.type(screen.getByLabelText('Client secret'), 'graph-secret')
    await user.clear(screen.getByLabelText('Sender mailbox'))
    await user.type(screen.getByLabelText('Sender mailbox'), 'dispatch@example.com')

    await user.click(screen.getByRole('button', { name: 'Save mailer settings' }))

    await waitFor(() => expect(mailerConfigurationApi.update).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'Microsoft365',
      microsoft365TenantId: 'contoso.onmicrosoft.com',
      microsoft365ClientId: '00000000-0000-0000-0000-000000000000',
      microsoft365ClientSecret: 'graph-secret',
      microsoft365SenderEmail: 'dispatch@example.com',
      clearMicrosoft365ClientSecret: false
    })))
  })

  it('sends a test email through the saved mailer configuration', async () => {
    const user = userEvent.setup()
    render(<MailerSettingsPage />)

    await screen.findByRole('heading', { name: 'Mailer Settings' })
    await user.clear(screen.getByLabelText('Test recipient'))
    await user.type(screen.getByLabelText('Test recipient'), 'owner@example.com')
    await user.click(screen.getByRole('button', { name: 'Send test email' }))

    await waitFor(() => expect(mailerConfigurationApi.sendTest).toHaveBeenCalledWith({
      recipientEmail: 'owner@example.com'
    }))
    expect(await screen.findByText('Test email sent to owner@example.com.')).toBeInTheDocument()
  })
})
