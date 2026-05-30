import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { CreateJobTicketDto, CustomerDto, EquipmentDto, ServiceLocationDto } from '../../types'
import { priorityOptions, jobStatusOptions } from './managerDisplay'

type Props = {
  initial: CreateJobTicketDto
  customers: CustomerDto[]
  serviceLocations: ServiceLocationDto[]
  equipment: EquipmentDto[]
  onSubmit: (payload: CreateJobTicketDto) => Promise<void>
  submitLabel: string
}

type DispatchEditCheck = {
  label: string
  isReady: boolean
  detail: string
}

export function buildDispatchEditChecks(form: CreateJobTicketDto): DispatchEditCheck[] {
  return [
    {
      label: 'Customer',
      isReady: Boolean(form.customerId),
      detail: form.customerId ? 'Customer is selected.' : 'Select the customer before dispatch review.'
    },
    {
      label: 'Service location',
      isReady: Boolean(form.serviceLocationId),
      detail: form.serviceLocationId ? 'Service location is selected.' : 'Select the service location before dispatch review.'
    },
    {
      label: 'Equipment context',
      isReady: Boolean(form.equipmentId),
      detail: form.equipmentId ? 'Equipment context is selected.' : 'Confirm whether this ticket needs equipment context.'
    },
    {
      label: 'Scheduled start',
      isReady: Boolean(form.scheduledStartAtUtc),
      detail: form.scheduledStartAtUtc ? 'Scheduled start is set.' : 'Set a scheduled start before dispatch.'
    },
    {
      label: 'Due date',
      isReady: Boolean(form.dueAtUtc),
      detail: form.dueAtUtc ? 'Due date is set.' : 'Add a due date so dispatch can see timing expectations.'
    },
    {
      label: 'Job instructions',
      isReady: Boolean(form.description?.trim() || form.internalNotes?.trim() || form.customerFacingNotes?.trim()),
      detail: form.description?.trim() || form.internalNotes?.trim() || form.customerFacingNotes?.trim()
        ? 'Job instructions or notes are present.'
        : 'Add job instructions or notes for field context.'
    }
  ]
}

export function JobTicketEditorForm({ initial, customers, serviceLocations, equipment, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<CreateJobTicketDto>(initial)
  const [error, setError] = useState<string | null>(null)

  const filteredLocations = useMemo(
    () => serviceLocations.filter((item) => !form.customerId || item.customerId === form.customerId),
    [serviceLocations, form.customerId]
  )

  const filteredEquipment = useMemo(
    () => equipment.filter((item) => {
      if (form.serviceLocationId) {
        return item.serviceLocationId === form.serviceLocationId
      }

      if (form.customerId) {
        return item.customerId === form.customerId
      }

      return true
    }),
    [equipment, form.customerId, form.serviceLocationId]
  )

  const dispatchEditChecks = useMemo(() => buildDispatchEditChecks(form), [form])
  const dispatchReadyCount = dispatchEditChecks.filter((check) => check.isReady).length
  const dispatchOpenItems = dispatchEditChecks.filter((check) => !check.isReady)

  useEffect(() => {
    if (form.serviceLocationId && !filteredLocations.some((item) => item.id === form.serviceLocationId)) {
      setForm((prev) => ({ ...prev, serviceLocationId: '', equipmentId: null }))
    }
  }, [filteredLocations, form.serviceLocationId])

  useEffect(() => {
    if (form.equipmentId && !filteredEquipment.some((item) => item.id === form.equipmentId)) {
      setForm((prev) => ({ ...prev, equipmentId: null }))
    }
  }, [filteredEquipment, form.equipmentId])

  const update = <K extends keyof CreateJobTicketDto>(key: K, value: CreateJobTicketDto[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.customerId || !form.serviceLocationId || !form.billingPartyCustomerId || !form.title.trim()) {
      setError('Customer, location, billing party, and title are required.')
      return
    }

    setError(null)
    await onSubmit({ ...form, title: form.title.trim() })
  }

  return (
    <form onSubmit={submit} className="stack">
      {error ? <p className="error">{error}</p> : null}
      <section className="stack" aria-label="dispatch edit readiness review">
        <h3>Dispatch Edit Readiness</h3>
        <div className="review-grid">
          <div>
            <span className="muted">Review Status</span>
            <strong>{dispatchOpenItems.length ? 'Needs dispatch review' : 'Ready for dispatch review'}</strong>
          </div>
          <div>
            <span className="muted">Ready Checks</span>
            <strong>{dispatchReadyCount} / {dispatchEditChecks.length}</strong>
          </div>
          <div>
            <span className="muted">Open Items</span>
            <strong>{dispatchOpenItems.length}</strong>
          </div>
        </div>
        {dispatchOpenItems.length ? (
          <ul className="muted" aria-label="dispatch edit readiness warnings">
            {dispatchOpenItems.map((check) => (
              <li key={check.label}>{check.detail}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Customer, location, equipment, schedule, due date, and job instructions are ready for dispatch review.</p>
        )}
      </section>
      <label>Title<input value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
      <label>Job Type<input value={form.jobType ?? ''} onChange={(e) => update('jobType', e.target.value || null)} placeholder="Repair, inspection, warranty, install" /></label>
      <label>Customer<select value={form.customerId} onChange={(e) => update('customerId', e.target.value)}><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Service Location<select value={form.serviceLocationId} onChange={(e) => update('serviceLocationId', e.target.value)}><option value="">Select location</option>{filteredLocations.map((c) => <option key={c.id} value={c.id}>{c.locationName}</option>)}</select></label>
      <label>Billing Party<select value={form.billingPartyCustomerId} onChange={(e) => update('billingPartyCustomerId', e.target.value)}><option value="">Select billing party</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Equipment<select value={form.equipmentId ?? ''} onChange={(e) => update('equipmentId', e.target.value || null)}><option value="">None</option>{filteredEquipment.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Priority<select value={form.priority} onChange={(e) => update('priority', Number(e.target.value))}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={(e) => update('status', Number(e.target.value))}>{jobStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Description<textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value || null)} /></label>
      <label>Purchase Order Number<input value={form.purchaseOrderNumber ?? ''} onChange={(e) => update('purchaseOrderNumber', e.target.value || null)} placeholder="Customer or internal PO reference" /></label>
      <label>Billing Contact Name<input value={form.billingContactName ?? ''} onChange={(e) => update('billingContactName', e.target.value || null)} /></label>
      <label>Billing Contact Phone<input value={form.billingContactPhone ?? ''} onChange={(e) => update('billingContactPhone', e.target.value || null)} /></label>
      <label>Billing Contact Email<input type="email" value={form.billingContactEmail ?? ''} onChange={(e) => update('billingContactEmail', e.target.value || null)} /></label>
      <label>Internal Notes<textarea value={form.internalNotes ?? ''} onChange={(e) => update('internalNotes', e.target.value || null)} /></label>
      <label>Customer Notes<textarea value={form.customerFacingNotes ?? ''} onChange={(e) => update('customerFacingNotes', e.target.value || null)} /></label>
      <label>Requested (UTC)<input type="datetime-local" value={(form.requestedAtUtc ?? '').slice(0, 16)} onChange={(e) => update('requestedAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label>Scheduled Start (UTC)<input type="datetime-local" value={(form.scheduledStartAtUtc ?? '').slice(0, 16)} onChange={(e) => update('scheduledStartAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label>Due (UTC)<input type="datetime-local" value={(form.dueAtUtc ?? '').slice(0, 16)} onChange={(e) => update('dueAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}
