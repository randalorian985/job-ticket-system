import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/httpClient'
import { mailerConfigurationApi } from '../../../api/mailerConfigurationApi'
import type { MailerConfigurationDto, MailerProvider, UpdateMailerConfigurationDto } from '../../../types'
import './CompanyConfigurationPage.css'

type MailerForm = UpdateMailerConfigurationDto & {
  smtpPassword: string
  microsoft365ClientSecret: string
}

const providerOptions: Array<{ value: MailerProvider; label: string; status: string; disabled?: boolean }> = [
  { value: 'ManualSmtp', label: 'Manual SMTP', status: 'Available' },
  { value: 'GoogleWorkspace', label: 'Google Workspace', status: 'Not available yet', disabled: true },
  { value: 'Microsoft365', label: 'Microsoft 365 Graph', status: 'Available' }
]

const messageForError = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

const nullIfBlank = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const toFormValue = (config: MailerConfigurationDto): MailerForm => ({
  provider: config.provider,
  enabled: config.enabled,
  fromName: config.fromName ?? '',
  fromAddress: config.fromAddress ?? '',
  replyToAddress: config.replyToAddress ?? '',
  smtpHost: config.smtpHost ?? '',
  smtpPort: config.smtpPort || 587,
  smtpEnableSsl: config.smtpEnableSsl,
  smtpUsername: config.smtpUsername ?? '',
  smtpPassword: '',
  clearSmtpPassword: false,
  microsoft365TenantId: config.microsoft365TenantId ?? '',
  microsoft365ClientId: config.microsoft365ClientId ?? '',
  microsoft365ClientSecret: '',
  clearMicrosoft365ClientSecret: false,
  microsoft365SenderEmail: config.microsoft365SenderEmail ?? '',
  appBaseUrl: config.appBaseUrl ?? ''
})

const normalizeForm = (form: MailerForm): UpdateMailerConfigurationDto => ({
  provider: form.provider,
  enabled: form.enabled,
  fromName: nullIfBlank(form.fromName),
  fromAddress: nullIfBlank(form.fromAddress),
  replyToAddress: nullIfBlank(form.replyToAddress),
  smtpHost: nullIfBlank(form.smtpHost),
  smtpPort: Number(form.smtpPort) || 587,
  smtpEnableSsl: form.smtpEnableSsl,
  smtpUsername: nullIfBlank(form.smtpUsername),
  smtpPassword: nullIfBlank(form.smtpPassword),
  clearSmtpPassword: form.clearSmtpPassword,
  appBaseUrl: nullIfBlank(form.appBaseUrl),
  microsoft365TenantId: nullIfBlank(form.microsoft365TenantId),
  microsoft365ClientId: nullIfBlank(form.microsoft365ClientId),
  microsoft365ClientSecret: nullIfBlank(form.microsoft365ClientSecret),
  clearMicrosoft365ClientSecret: form.clearMicrosoft365ClientSecret,
  microsoft365SenderEmail: nullIfBlank(form.microsoft365SenderEmail)
})

const formatTimestamp = (value?: string | null) => {
  if (!value) return 'Not tested'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const configurationSourceLabel = (source: string) => {
  switch (source) {
    case 'Database':
      return 'Saved settings'
    case 'Environment':
      return 'Server settings'
    default:
      return source
  }
}

export function MailerSettingsPage() {
  const [configuration, setConfiguration] = useState<MailerConfigurationDto | null>(null)
  const [form, setForm] = useState<MailerForm | null>(null)
  const [testRecipientEmail, setTestRecipientEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [testMessage, setTestMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    mailerConfigurationApi
      .get()
      .then((loaded) => {
        if (!isMounted) return
        setConfiguration(loaded)
        setForm(toFormValue(loaded))
        setTestRecipientEmail(loaded.fromAddress ?? '')
      })
      .catch((loadError) => {
        if (isMounted) setError(messageForError(loadError, 'Mailer settings could not be loaded.'))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const selectedProvider = useMemo(
    () => providerOptions.find((provider) => provider.value === form?.provider) ?? providerOptions[0],
    [form?.provider]
  )

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return

    setIsSaving(true)
    setError(null)
    setMessage(null)
    setTestMessage(null)

    try {
      const updated = await mailerConfigurationApi.update(normalizeForm(form))
      setConfiguration(updated)
      setForm(toFormValue(updated))
      setMessage('Mailer settings saved.')
    } catch (saveError) {
      setError(messageForError(saveError, 'Mailer settings could not be saved.'))
    } finally {
      setIsSaving(false)
    }
  }

  const onSendTest = async () => {
    const recipientEmail = testRecipientEmail.trim()
    if (!recipientEmail) return

    setIsTesting(true)
    setError(null)
    setTestMessage(null)

    try {
      const result = await mailerConfigurationApi.sendTest({ recipientEmail })
      setTestMessage(result.message)
      const refreshed = await mailerConfigurationApi.get()
      setConfiguration(refreshed)
      setForm((prev) => prev
        ? {
            ...toFormValue(refreshed),
            smtpPassword: prev.smtpPassword,
            microsoft365ClientSecret: prev.microsoft365ClientSecret
          }
        : toFormValue(refreshed))
    } catch (testError) {
      setError(messageForError(testError, 'Test email could not be sent.'))
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <section className="company-config-page stack" aria-busy={isLoading || isSaving || isTesting}>
      <header className="dashboard-hero-strip company-config-hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Mailer Settings</h2>
          <p className="muted">Outgoing mail account and delivery status.</p>
        </div>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {testMessage ? <p className="success" role="status">{testMessage}</p> : null}
      {isLoading ? <p className="muted" role="status">Loading mailer settings...</p> : null}

      {form && configuration ? (
        <form className="stack" onSubmit={onSave}>
          <section className="company-config-panel stack" aria-label="mailer provider">
            <div className="company-config-section-heading">
              <div>
                <p className="eyebrow">Provider</p>
                <h3>Outgoing Mailer</h3>
              </div>
              <StatusPill status={configuration.status} />
            </div>

            <div className="mailer-provider-grid" role="radiogroup" aria-label="Mailer provider">
              {providerOptions.map((provider) => (
                <button
                  aria-checked={form.provider === provider.value}
                  className={`choice-tile mailer-provider-option${form.provider === provider.value ? ' choice-tile-active' : ''}`}
                  disabled={provider.disabled}
                  key={provider.value}
                  onClick={() => setForm((prev) => prev ? { ...prev, provider: provider.value } : prev)}
                  role="radio"
                  type="button"
                >
                  <strong>{provider.label}</strong>
                  <span>{provider.status}</span>
                </button>
              ))}
            </div>

            <div className="mailer-status-grid">
              <div><span>Provider</span><strong>{selectedProvider.label}</strong></div>
              <div><span>Settings</span><strong>{configurationSourceLabel(configuration.configurationSource)}</strong></div>
              <div><span>Status</span><strong>{configuration.statusMessage ?? configuration.status}</strong></div>
              <div>
                <span>{form.provider === 'Microsoft365' ? 'Client secret' : 'Password'}</span>
                <strong>{form.provider === 'Microsoft365'
                  ? configuration.microsoft365ClientSecretSet ? 'Saved' : 'Not saved'
                  : configuration.smtpPasswordSet ? 'Saved' : 'Not saved'}</strong>
              </div>
            </div>
          </section>

          <section className="company-config-panel stack" aria-label={form.provider === 'Microsoft365' ? 'microsoft 365 graph settings' : 'smtp mailer settings'}>
            <div className="company-config-section-heading">
              <div>
                <p className="eyebrow">{form.provider === 'Microsoft365' ? 'Microsoft 365 Graph' : 'Manual SMTP'}</p>
                <h3>Connection</h3>
              </div>
            </div>

            <div className="company-config-grid">
              <label>
                Outgoing mail
                <select
                  value={form.enabled ? 'true' : 'false'}
                  onChange={(event) => setForm({ ...form, enabled: event.target.value === 'true' })}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </label>
              {form.provider === 'Microsoft365' ? (
                <>
                  <label>
                    Tenant ID or domain
                    <input
                      value={form.microsoft365TenantId ?? ''}
                      onChange={(event) => setForm({ ...form, microsoft365TenantId: event.target.value })}
                      maxLength={200}
                      placeholder="contoso.onmicrosoft.com"
                    />
                  </label>
                  <label>
                    Application client ID
                    <input
                      value={form.microsoft365ClientId ?? ''}
                      onChange={(event) => setForm({ ...form, microsoft365ClientId: event.target.value })}
                      maxLength={100}
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />
                  </label>
                  <label>
                    Client secret
                    <input
                      autoComplete="new-password"
                      type="password"
                      value={form.microsoft365ClientSecret}
                      onChange={(event) => setForm({ ...form, microsoft365ClientSecret: event.target.value, clearMicrosoft365ClientSecret: false })}
                      maxLength={2000}
                      placeholder={configuration.microsoft365ClientSecretSet ? 'Saved client secret' : ''}
                    />
                  </label>
                  <label>
                    Sender mailbox
                    <input
                      type="email"
                      value={form.microsoft365SenderEmail ?? ''}
                      onChange={(event) => setForm({ ...form, microsoft365SenderEmail: event.target.value })}
                      maxLength={320}
                      placeholder="dispatch@example.com"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    SMTP host
                    <input
                      value={form.smtpHost ?? ''}
                      onChange={(event) => setForm({ ...form, smtpHost: event.target.value })}
                      maxLength={255}
                      placeholder="smtp.example.com"
                    />
                  </label>
                  <label>
                    SMTP port
                    <input
                      type="number"
                      min={1}
                      max={65535}
                      value={form.smtpPort}
                      onChange={(event) => setForm({ ...form, smtpPort: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    SSL/TLS
                    <select
                      value={form.smtpEnableSsl ? 'true' : 'false'}
                      onChange={(event) => setForm({ ...form, smtpEnableSsl: event.target.value === 'true' })}
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                  <label>
                    SMTP username
                    <input
                      autoComplete="username"
                      value={form.smtpUsername ?? ''}
                      onChange={(event) => setForm({ ...form, smtpUsername: event.target.value })}
                      maxLength={320}
                    />
                  </label>
                  <label>
                    SMTP password
                    <input
                      autoComplete="new-password"
                      type="password"
                      value={form.smtpPassword}
                      onChange={(event) => setForm({ ...form, smtpPassword: event.target.value, clearSmtpPassword: false })}
                      maxLength={1000}
                      placeholder={configuration.smtpPasswordSet ? 'Saved password' : ''}
                    />
                  </label>
                </>
              )}
            </div>

            {form.provider === 'Microsoft365' && configuration.microsoft365ClientSecretSet ? (
              <label className="mailer-inline-check">
                <input
                  type="checkbox"
                  checked={Boolean(form.clearMicrosoft365ClientSecret)}
                  onChange={(event) => setForm({ ...form, clearMicrosoft365ClientSecret: event.target.checked, microsoft365ClientSecret: '' })}
                />
                Clear saved Microsoft 365 client secret
              </label>
            ) : null}

            {form.provider !== 'Microsoft365' && configuration.smtpPasswordSet ? (
              <label className="mailer-inline-check">
                <input
                  type="checkbox"
                  checked={form.clearSmtpPassword}
                  onChange={(event) => setForm({ ...form, clearSmtpPassword: event.target.checked, smtpPassword: '' })}
                />
                Clear saved SMTP password
              </label>
            ) : null}
          </section>

          <section className="company-config-panel stack" aria-label="sender identity">
            <div className="company-config-section-heading">
              <div>
                <p className="eyebrow">Sender</p>
                <h3>Identity</h3>
              </div>
            </div>

            <div className="company-config-grid">
              <label>
                From name
                <input
                  value={form.fromName ?? ''}
                  onChange={(event) => setForm({ ...form, fromName: event.target.value })}
                  maxLength={200}
                  placeholder="Service Dispatch"
                />
              </label>
              {form.provider === 'ManualSmtp' ? (
                <label>
                  From address
                  <input
                    type="email"
                    value={form.fromAddress ?? ''}
                    onChange={(event) => setForm({ ...form, fromAddress: event.target.value })}
                    maxLength={320}
                    placeholder="dispatch@example.com"
                  />
                </label>
              ) : null}
              <label>
                Reply-to address
                <input
                  type="email"
                  value={form.replyToAddress ?? ''}
                  onChange={(event) => setForm({ ...form, replyToAddress: event.target.value })}
                  maxLength={320}
                />
              </label>
              <label>
                App base URL
                <input
                  value={form.appBaseUrl ?? ''}
                  onChange={(event) => setForm({ ...form, appBaseUrl: event.target.value })}
                  maxLength={300}
                  placeholder="https://dev.mudbugdigital.com"
                />
              </label>
            </div>
          </section>

          <section className="company-config-panel stack" aria-label="test mailer">
            <div className="company-config-section-heading">
              <div>
                <p className="eyebrow">Test</p>
                <h3>Delivery Check</h3>
              </div>
              <span className={configuration.lastTestSucceeded ? 'success' : 'muted'}>
                {formatTimestamp(configuration.lastTestedAtUtc)}
              </span>
            </div>

            {configuration.lastTestMessage ? <p className="muted">{configuration.lastTestMessage}</p> : null}

            <div className="mailer-test-row">
              <label>
                Test recipient
                <input
                  type="email"
                  value={testRecipientEmail}
                  onChange={(event) => setTestRecipientEmail(event.target.value)}
                  maxLength={320}
                  placeholder="you@example.com"
                />
              </label>
              <button type="button" className="secondary-button" onClick={onSendTest} disabled={isTesting || !testRecipientEmail.trim()}>
                {isTesting ? 'Sending...' : 'Send test email'}
              </button>
            </div>
          </section>

          <div className="company-config-actions">
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save mailer settings'}</button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

function StatusPill({ status }: { status: string }) {
  const className = status === 'Ready'
    ? 'mailer-status-pill mailer-status-pill-ready'
    : status === 'Disabled'
      ? 'mailer-status-pill'
      : 'mailer-status-pill mailer-status-pill-review'

  return <span className={className}>{status}</span>
}
