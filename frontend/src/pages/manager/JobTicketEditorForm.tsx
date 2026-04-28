import { FormEvent, useMemo, useState } from 'react'
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

export function JobTicketEditorForm({ initial, customers, serviceLocations, equipment, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<CreateJobTicketDto>(initial)
  const [error, setError] = useState<string | null>(null)

  const filteredLocations = useMemo(
    () => serviceLocations.filter((item) => !form.customerId || item.customerId === form.customerId),
    [serviceLocations, form.customerId]
  )

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
      <label>Title<input value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
      <label>Customer<select value={form.customerId} onChange={(e) => update('customerId', e.target.value)}><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Service Location<select value={form.serviceLocationId} onChange={(e) => update('serviceLocationId', e.target.value)}><option value="">Select location</option>{filteredLocations.map((c) => <option key={c.id} value={c.id}>{c.locationName}</option>)}</select></label>
      <label>Billing Party<select value={form.billingPartyCustomerId} onChange={(e) => update('billingPartyCustomerId', e.target.value)}><option value="">Select billing party</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Equipment<select value={form.equipmentId ?? ''} onChange={(e) => update('equipmentId', e.target.value || null)}><option value="">None</option>{equipment.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Priority<select value={form.priority} onChange={(e) => update('priority', Number(e.target.value))}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={(e) => update('status', Number(e.target.value))}>{jobStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Description<textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value || null)} /></label>
      <label>Internal Notes<textarea value={form.internalNotes ?? ''} onChange={(e) => update('internalNotes', e.target.value || null)} /></label>
      <label>Customer Notes<textarea value={form.customerFacingNotes ?? ''} onChange={(e) => update('customerFacingNotes', e.target.value || null)} /></label>
      <label>Requested (UTC)<input type="datetime-local" value={(form.requestedAtUtc ?? '').slice(0, 16)} onChange={(e) => update('requestedAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label>Scheduled Start (UTC)<input type="datetime-local" value={(form.scheduledStartAtUtc ?? '').slice(0, 16)} onChange={(e) => update('scheduledStartAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label>Due (UTC)<input type="datetime-local" value={(form.dueAtUtc ?? '').slice(0, 16)} onChange={(e) => update('dueAtUtc', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}
