import { useState } from 'react'
import type {
  AddNewTicketNotificationRecipientDto,
  NewTicketNotificationRecipientDto,
  UpdateCompanyConfigurationDto
} from '../../../types'

type AlertsConfigurationPanelProps = {
  form: UpdateCompanyConfigurationDto
  onFormChange: (updates: Partial<UpdateCompanyConfigurationDto>) => void
  recipients: NewTicketNotificationRecipientDto[]
  isLoadingRecipients: boolean
  recipientError: string | null
  isAddingRecipient: boolean
  removingId: string | null
  onAddRecipient: (dto: AddNewTicketNotificationRecipientDto) => Promise<void>
  onRemoveRecipient: (id: string) => Promise<void>
}

export function AlertsConfigurationPanel({
  form,
  onFormChange,
  recipients,
  isLoadingRecipients,
  recipientError,
  isAddingRecipient,
  removingId,
  onAddRecipient,
  onRemoveRecipient,
}: AlertsConfigurationPanelProps) {
  const [addForm, setAddForm] = useState<AddNewTicketNotificationRecipientDto>({ label: '', email: '' })

  const handleAdd = async () => {
    if (!addForm.label.trim() || !addForm.email.trim()) return
    await onAddRecipient({ label: addForm.label.trim(), email: addForm.email.trim() })
    setAddForm({ label: '', email: '' })
  }

  return (
    <>
      <section className="company-config-panel stack" aria-label="part order routing">
        <div className="company-config-section-heading">
          <div>
            <p className="eyebrow">Alerts</p>
            <h3>Part order requests</h3>
            <p className="muted">
              Receives part order notification emails. Falls back to contact email if left blank.
            </p>
          </div>
        </div>
        <div className="company-config-grid company-config-grid-single">
          <div className="company-config-field">
            <label htmlFor="cc-partOrderRequestsEmail">Part order requests email</label>
            <input
              id="cc-partOrderRequestsEmail"
              type="email"
              value={form.partOrderRequestsEmail ?? ''}
              onChange={(e) => onFormChange({ partOrderRequestsEmail: e.target.value })}
              maxLength={320}
              placeholder="parts@yourcompany.com"
            />
            <CharCount value={form.partOrderRequestsEmail ?? ''} max={320} />
          </div>
        </div>
      </section>

      <section className="company-config-panel stack" aria-label="notification settings">
        <div className="company-config-section-heading">
          <div>
            <p className="eyebrow">Alerts</p>
            <h3>New ticket alerts</h3>
            <p className="muted">Configure who receives an email when a new ticket is created.</p>
          </div>
        </div>

        <div className="company-config-grid">
          <label>
            Enable new ticket notifications
            <select
              value={form.newTicketNotificationsEnabled ? 'true' : 'false'}
              onChange={(e) => onFormChange({ newTicketNotificationsEnabled: e.target.value === 'true' })}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label>
            Minimum priority to notify
            <select
              value={form.newTicketNotificationMinimumPriority}
              onChange={(e) => onFormChange({ newTicketNotificationMinimumPriority: Number(e.target.value) })}
              disabled={!form.newTicketNotificationsEnabled}
            >
              <option value={1}>Low — notify on all tickets</option>
              <option value={2}>Normal and above</option>
              <option value={3}>High and above</option>
              <option value={4}>Urgent only</option>
            </select>
          </label>
        </div>

        {recipientError ? <p className="error" role="alert">{recipientError}</p> : null}
        {isLoadingRecipients ? <p className="muted">Loading recipients...</p> : null}

        {!isLoadingRecipients && recipients.length === 0 ? (
          <p className="muted">No notification recipients configured.</p>
        ) : (
          <ul className="alert-recipients-list">
            {recipients.map((r) => (
              <li key={r.id} className="alert-recipient-item">
                <span className="alert-recipient-label">{r.label}</span>
                <span className="alert-recipient-email muted">{r.email}</span>
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
        )}

        <div className="alert-recipient-add-form">
          <p className="eyebrow">Add recipient</p>
          <div className="company-config-grid">
            <div className="company-config-field">
              <label htmlFor="cc-addRecipientLabel">Label</label>
              <input
                id="cc-addRecipientLabel"
                type="text"
                placeholder="e.g. Office Manager"
                value={addForm.label}
                onChange={(e) => setAddForm((prev) => ({ ...prev, label: e.target.value }))}
                maxLength={200}
              />
              <CharCount value={addForm.label} max={200} />
            </div>
            <div className="company-config-field">
              <label htmlFor="cc-addRecipientEmail">Email address</label>
              <input
                id="cc-addRecipientEmail"
                type="email"
                placeholder="e.g. manager@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                maxLength={320}
              />
              <CharCount value={addForm.email} max={320} />
            </div>
          </div>
          <div className="company-config-actions">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAddingRecipient || !addForm.label.trim() || !addForm.email.trim()}
            >
              {isAddingRecipient ? 'Adding...' : 'Add recipient'}
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const className =
    len >= max ? 'char-count char-count-limit' :
    len > max * 0.85 ? 'char-count char-count-warn' :
    'char-count'
  return <span className={className}>{len} / {max}</span>
}
