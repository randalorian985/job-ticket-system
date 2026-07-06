import { FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../../../api/httpClient'
import { companyConfigurationApi } from '../../../api/companyConfigurationApi'
import type {
  AddNewTicketNotificationRecipientDto,
  CompanyConfigurationDto,
  NewTicketNotificationRecipientDto,
  UpdateCompanyConfigurationDto
} from '../../../types'
import { AlertsConfigurationPanel } from './AlertsConfigurationPanel'
import './CompanyConfigurationPage.css'

const toFormValue = (config: CompanyConfigurationDto): UpdateCompanyConfigurationDto => ({
  companyName: config.companyName,
  legalName: config.legalName ?? '',
  contactName: config.contactName ?? '',
  email: config.email ?? '',
  partOrderRequestsEmail: config.partOrderRequestsEmail ?? '',
  phone: config.phone ?? '',
  website: config.website ?? '',
  addressLine1: config.addressLine1 ?? '',
  addressLine2: config.addressLine2 ?? '',
  city: config.city ?? '',
  state: config.state ?? '',
  postalCode: config.postalCode ?? '',
  country: config.country ?? '',
  primaryColor: config.primaryColor,
  secondaryColor: config.secondaryColor,
  accentColor: config.accentColor,
  newTicketNotificationsEnabled: config.newTicketNotificationsEnabled,
  newTicketNotificationMinimumPriority: config.newTicketNotificationMinimumPriority
})

const messageForError = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

export function AlertsConfigurationPage() {
  const [form, setForm] = useState<UpdateCompanyConfigurationDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [recipients, setRecipients] = useState<NewTicketNotificationRecipientDto[]>([])
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true)
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [isAddingRecipient, setIsAddingRecipient] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    companyConfigurationApi
      .get()
      .then((loaded) => {
        if (isMounted) setForm(toFormValue(loaded))
      })
      .catch((loadError) => {
        if (isMounted) setError(messageForError(loadError, 'Alert configuration could not be loaded.'))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    companyConfigurationApi
      .getNotificationRecipients()
      .then((loaded) => {
        if (isMounted) setRecipients(loaded)
      })
      .catch(() => {
        if (isMounted) setRecipientError('Notification recipients could not be loaded.')
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecipients(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    setIsSaving(true)
    setError(null)
    setMessage(null)

    const normalized: UpdateCompanyConfigurationDto = {
      ...form,
      partOrderRequestsEmail: form.partOrderRequestsEmail?.trim() || null
    }

    try {
      await companyConfigurationApi.update(normalized)
      setForm(normalized)
      setMessage('Alert settings saved.')
    } catch (saveError) {
      setError(messageForError(saveError, 'Alert settings could not be saved.'))
    } finally {
      setIsSaving(false)
    }
  }

  const onAddRecipient = async (dto: AddNewTicketNotificationRecipientDto) => {
    setIsAddingRecipient(true)
    setRecipientError(null)

    try {
      const created = await companyConfigurationApi.addNotificationRecipient(dto)
      setRecipients((prev) => [...prev, created])
    } catch (addError) {
      setRecipientError(messageForError(addError, 'Could not add notification recipient.'))
      throw addError
    } finally {
      setIsAddingRecipient(false)
    }
  }

  const onRemoveRecipient = async (id: string) => {
    setRemovingId(id)
    setRecipientError(null)

    try {
      await companyConfigurationApi.removeNotificationRecipient(id)
      setRecipients((prev) => prev.filter((r) => r.id !== id))
    } catch (removeError) {
      setRecipientError(messageForError(removeError, 'Could not remove notification recipient.'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section className="company-config-page stack" aria-busy={isLoading || isSaving}>
      <header className="dashboard-hero-strip company-config-hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Alerts &amp; Notifications</h2>
          <p className="muted">Email alerts and notification routing.</p>
        </div>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {isLoading ? <p className="muted" role="status">Loading alert configuration...</p> : null}

      {form ? (
        <form className="stack" onSubmit={onSave}>
          <AlertsConfigurationPanel
            form={form}
            onFormChange={(updates) => setForm((prev) => prev ? { ...prev, ...updates } : prev)}
            recipients={recipients}
            isLoadingRecipients={isLoadingRecipients}
            recipientError={recipientError}
            isAddingRecipient={isAddingRecipient}
            removingId={removingId}
            onAddRecipient={onAddRecipient}
            onRemoveRecipient={onRemoveRecipient}
          />
          <div className="company-config-actions">
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save alert settings'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
