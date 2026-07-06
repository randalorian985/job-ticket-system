import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../../api/httpClient'
import { companyConfigurationApi } from '../../../api/companyConfigurationApi'
import {
  companyAddressLines,
  companyInitials,
  defaultCompanyConfiguration,
  useCompanyBranding
} from '../../../features/companyBranding/CompanyBrandingContext'
import type {
  AddNewTicketNotificationRecipientDto,
  CompanyConfigurationDto,
  NewTicketNotificationRecipientDto,
  UpdateCompanyConfigurationDto
} from '../../../types'
import { CompanyConfigurationForm } from './CompanyConfigurationForm'
import { CompanyConfigurationPreview } from './CompanyConfigurationPreview'
import './CompanyConfigurationPage.css'

const toFormValue = (configuration: CompanyConfigurationDto): UpdateCompanyConfigurationDto => ({
  companyName: configuration.companyName,
  legalName: configuration.legalName ?? '',
  contactName: configuration.contactName ?? '',
  email: configuration.email ?? '',
  partOrderRequestsEmail: configuration.partOrderRequestsEmail ?? '',
  phone: configuration.phone ?? '',
  website: configuration.website ?? '',
  addressLine1: configuration.addressLine1 ?? '',
  addressLine2: configuration.addressLine2 ?? '',
  city: configuration.city ?? '',
  state: configuration.state ?? '',
  postalCode: configuration.postalCode ?? '',
  country: configuration.country ?? '',
  primaryColor: configuration.primaryColor,
  secondaryColor: configuration.secondaryColor,
  accentColor: configuration.accentColor,
  newTicketNotificationsEnabled: configuration.newTicketNotificationsEnabled,
  newTicketNotificationMinimumPriority: configuration.newTicketNotificationMinimumPriority
})

const normalizeOptionalFields = (form: UpdateCompanyConfigurationDto): UpdateCompanyConfigurationDto => ({
  ...form,
  legalName: form.legalName?.trim() || null,
  contactName: form.contactName?.trim() || null,
  email: form.email?.trim() || null,
  partOrderRequestsEmail: form.partOrderRequestsEmail?.trim() || null,
  phone: form.phone?.trim() || null,
  website: form.website?.trim() || null,
  addressLine1: form.addressLine1?.trim() || null,
  addressLine2: form.addressLine2?.trim() || null,
  city: form.city?.trim() || null,
  state: form.state?.trim() || null,
  postalCode: form.postalCode?.trim() || null,
  country: form.country?.trim() || null
})

const messageForError = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback

export function CompanyConfigurationPage() {
  const branding = useCompanyBranding()
  const [configuration, setConfiguration] = useState<CompanyConfigurationDto>(branding.configuration)
  const [form, setForm] = useState<UpdateCompanyConfigurationDto>(toFormValue(branding.configuration))
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [recipients, setRecipients] = useState<NewTicketNotificationRecipientDto[]>([])
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true)
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<AddNewTicketNotificationRecipientDto>({ label: '', email: '' })
  const [isAddingRecipient, setIsAddingRecipient] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    companyConfigurationApi
      .get()
      .then((loaded) => {
        if (!isMounted) return
        setConfiguration(loaded)
        setForm(toFormValue(loaded))
      })
      .catch((loadError) => {
        if (isMounted) setError(messageForError(loadError, 'Company configuration could not be loaded.'))
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

  const previewConfiguration = useMemo<CompanyConfigurationDto>(() => ({
    ...configuration,
    ...normalizeOptionalFields(form),
    companyName: form.companyName,
    primaryColor: form.primaryColor,
    secondaryColor: form.secondaryColor,
    accentColor: form.accentColor
  }), [configuration, form])

  const logoUrl = previewConfiguration.hasLogo
    ? companyConfigurationApi.getLogoUrl(previewConfiguration.logoUploadedAtUtc ?? previewConfiguration.updatedAtUtc)
    : null

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await companyConfigurationApi.update(normalizeOptionalFields(form))
      setConfiguration(updated)
      setForm(toFormValue(updated))
      await branding.refresh()
      setMessage('Company profile saved.')
    } catch (saveError) {
      setError(messageForError(saveError, 'Company profile could not be saved.'))
    } finally {
      setIsSaving(false)
    }
  }

  const onUploadLogo = async () => {
    if (!logoFile) {
      setError('Select a logo file before uploading.')
      return
    }

    setIsUploading(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await companyConfigurationApi.uploadLogo(logoFile)
      setConfiguration(updated)
      setForm(toFormValue(updated))
      setLogoFile(null)
      await branding.refresh()
      setMessage('Company logo uploaded.')
    } catch (uploadError) {
      setError(messageForError(uploadError, 'Company logo could not be uploaded.'))
    } finally {
      setIsUploading(false)
    }
  }

  const onAddRecipient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!addForm.label.trim() || !addForm.email.trim()) return
    setIsAddingRecipient(true)
    setRecipientError(null)

    try {
      const created = await companyConfigurationApi.addNotificationRecipient({
        label: addForm.label.trim(),
        email: addForm.email.trim()
      })
      setRecipients((prev) => [...prev, created])
      setAddForm({ label: '', email: '' })
    } catch (addError) {
      setRecipientError(messageForError(addError, 'Could not add notification recipient.'))
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
    <section className="company-config-page stack" aria-busy={isLoading || isSaving || isUploading}>
      <header className="dashboard-hero-strip company-config-hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Company Configuration</h2>
          <p className="muted">Company profile and brand assets.</p>
        </div>
      </header>

      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {isLoading ? <p className="muted" role="status">Loading company configuration...</p> : null}

      <div className="company-config-layout">
        <div className="stack">
          <section className="company-config-panel stack" aria-label="company logo">
            <div className="company-config-section-heading">
              <div>
                <p className="eyebrow">Logo</p>
                <h3>Company mark</h3>
              </div>
            </div>
            <div className="company-logo-upload">
              <label>
                Logo file
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button type="button" className="secondary-button" onClick={onUploadLogo} disabled={isUploading || !logoFile}>
                {isUploading ? 'Uploading...' : 'Upload logo'}
              </button>
            </div>
            <p className="muted">PNG, JPG, or WebP up to 2 MB.</p>
          </section>

          <CompanyConfigurationForm value={form} isSaving={isSaving} onChange={setForm} onSubmit={onSave} />
        </div>

        <CompanyConfigurationPreview
          configuration={previewConfiguration}
          logoUrl={logoUrl}
          initials={companyInitials(previewConfiguration.companyName || defaultCompanyConfiguration.companyName)}
          addressLines={companyAddressLines(previewConfiguration)}
        />
      </div>

      <section className="company-config-panel stack" aria-label="notification recipients">
        <div className="company-config-section-heading">
          <div>
            <p className="eyebrow">Notifications</p>
            <h3>New ticket notification recipients</h3>
            <p className="muted">Email addresses that receive a notification when a new ticket is created.</p>
          </div>
        </div>

        {recipientError ? <p className="error" role="alert">{recipientError}</p> : null}
        {isLoadingRecipients ? <p className="muted">Loading recipients...</p> : null}

        {recipients.length > 0 ? (
          <ul className="notification-recipients-list">
            {recipients.map((r) => (
              <li key={r.id} className="notification-recipient-item">
                <span className="notification-recipient-label">{r.label}</span>
                <span className="notification-recipient-email muted">{r.email}</span>
                <button
                  type="button"
                  className="secondary-button danger-button"
                  onClick={() => onRemoveRecipient(r.id)}
                  disabled={removingId === r.id}
                  aria-label={`Remove ${r.label}`}
                >
                  {removingId === r.id ? 'Removing...' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !isLoadingRecipients ? <p className="muted">No notification recipients configured.</p> : null
        )}

        <form className="notification-recipient-add-form" onSubmit={onAddRecipient}>
          <p className="eyebrow">Add recipient</p>
          <div className="company-config-grid">
            <label>
              Label
              <input
                type="text"
                placeholder="e.g. Office Manager"
                value={addForm.label}
                onChange={(e) => setAddForm((prev) => ({ ...prev, label: e.target.value }))}
                maxLength={200}
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                placeholder="e.g. manager@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                maxLength={320}
                required
              />
            </label>
          </div>
          <div className="company-config-actions">
            <button type="submit" disabled={isAddingRecipient || !addForm.label.trim() || !addForm.email.trim()}>
              {isAddingRecipient ? 'Adding...' : 'Add recipient'}
            </button>
          </div>
        </form>
      </section>
    </section>
  )
}
