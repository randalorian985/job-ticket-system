import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { masterDataApi } from '../../../api/masterDataApi'
import type { CreateServiceLocationDto, CustomerDto, ServiceLocationDto } from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  MasterDataFilters,
  MasterDataListState,
  MasterDataListSummary,
  archiveStatusLabel,
  customerNameById,
  masterDataRequestErrorMessage,
  matchesArchiveFilter,
  matchesTextSearch,
  useScrollToError,
  type ArchiveFilter
} from './masterDataShared'
import {
  activeFilterId,
  activeOrSelected,
  compactListField,
  compactListStackedField,
  confirmArchiveAction,
  customerHasBillingAddress,
  emptyServiceLocationDraft,
  fallbackText,
  hasRequiredText,
  serviceLocationAddress,
  serviceLocationDraftFromFilter
} from './masterDataPageUtils'

export function ServiceLocationsPage() {
  const [editorOpen, setEditorOpen] = useState(true)
  const [items, setItems] = useState<ServiceLocationDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [draft, setDraft] = useState<CreateServiceLocationDto>(emptyServiceLocationDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [customerFilter, setCustomerFilter] = useState('')

  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listServiceLocations(), masterDataApi.listCustomers()])
      .then(([l, c]) => {
        setItems(l)
        setCustomers(c)
        setEditorOpen(l.length === 0)
      })
      .catch(() => setError('Unable to load service locations.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!editId) setDraft((current) => ({ ...current, customerId: activeFilterId(customers, customerFilter) || null }))
  }, [customerFilter, editId])

  const customerOptions = useMemo(
    () => activeOrSelected(customers, [draft.customerId]),
    [customers, draft.customerId]
  )
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === draft.customerId),
    [customers, draft.customerId]
  )

  useScrollToError(error, fieldErrors)

  const filteredItems = useMemo(
    () => items.filter((x) =>
      matchesArchiveFilter(archiveFilter, x.isArchived) &&
      (!customerFilter || x.customerId === customerFilter) &&
      matchesTextSearch(search, [
        x.locationName, x.companyName, customerNameById(customers, x.customerId),
        x.onSiteContactName, x.onSiteContactPhone, x.onSiteContactEmail,
        x.addressLine1, x.addressLine2, x.city, x.state, x.postalCode,
        x.parishCounty, x.country, x.gateCode, x.accessInstructions,
        x.safetyRequirements, x.siteNotes
      ])
    ),
    [items, customers, search, archiveFilter, customerFilter]
  )

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const newFieldErrors: Record<string, string> = {
      locationName: !hasRequiredText(draft.locationName) ? 'Location Name is required.' : '',
      companyName: !hasRequiredText(draft.companyName) ? 'Company Name is required.' : '',
      addressLine1: !hasRequiredText(draft.addressLine1) ? 'Address is required.' : '',
      city: !hasRequiredText(draft.city) ? 'City is required.' : '',
      state: !hasRequiredText(draft.state) ? 'State is required.' : '',
      postalCode: !hasRequiredText(draft.postalCode) ? 'Postal Code / ZIP is required.' : '',
      country: !hasRequiredText(draft.country) ? 'Country is required.' : ''
    }
    const hasErrors = Object.values(newFieldErrors).some(Boolean)
    setFieldErrors(newFieldErrors)
    if (hasErrors) { setSuccess(null); return }

    try {
      const action = editId ? 'updated' : 'created'
      const locationName = draft.locationName.trim()
      setError(null); setSuccess(null); setFieldErrors({}); setIsSaving(true)
      if (editId) await masterDataApi.updateServiceLocation(editId, draft)
      else await masterDataApi.createServiceLocation(draft)
      setDraft(serviceLocationDraftFromFilter(customers, customerFilter)); setEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Service location "${locationName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save service location.'))
    } finally {
      setIsSaving(false)
    }
  }

  const closeEditor = () => {
    setDraft(serviceLocationDraftFromFilter(customers, customerFilter))
    setEditId(null); setError(null); setSuccess(null); setFieldErrors({}); setEditorOpen(false)
  }

  const startEdit = (location: ServiceLocationDto) => {
    setDraft(location)
    setEditId(location.id); setError(null); setSuccess(null); setFieldErrors({}); setEditorOpen(true)
  }

  const useCustomerAddress = () => {
    if (!selectedCustomer) {
      setSuccess(null)
      setError('Select a related customer before using customer address.')
      return
    }
    if (!customerHasBillingAddress(selectedCustomer)) {
      setSuccess(null)
      setError('Selected customer has no billing address to copy.')
      return
    }
    setDraft((current) => ({
      ...current,
      companyName: current.companyName || selectedCustomer.name,
      onSiteContactName: current.onSiteContactName || selectedCustomer.contactName || '',
      onSiteContactPhone: current.onSiteContactPhone || selectedCustomer.phone || '',
      onSiteContactEmail: current.onSiteContactEmail || selectedCustomer.email || '',
      addressLine1: selectedCustomer.billingAddressLine1 || current.addressLine1,
      addressLine2: selectedCustomer.billingAddressLine2 || current.addressLine2,
      city: selectedCustomer.billingCity || current.city,
      state: selectedCustomer.billingState || current.state,
      postalCode: selectedCustomer.billingPostalCode || current.postalCode
    }))
    setError(null)
    setSuccess('Customer address copied into the service location form.')
  }

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Service Locations</h2>
          <p className="muted">{editorOpen ? (editId ? 'Edit service-location details.' : 'Create a service location.') : 'Search and manage service locations.'}</p>
        </div>
        {!editorOpen ? (
          <button type="button" onClick={() => { setDraft(serviceLocationDraftFromFilter(customers, customerFilter)); setEditId(null); setError(null); setSuccess(null); setEditorOpen(true) }}>
            Create Location
          </button>
        ) : null}
      </div>
      <Errorable error={error} />
      {success ? <p className="success action-feedback-panel">{success}</p> : null}

      <form onSubmit={save} className="stack" aria-label="service location form" hidden={!editorOpen}>
        <label>Related customer
          <select value={draft.customerId ?? ''} onChange={(e) => setDraft({ ...draft, customerId: e.target.value || null })}>
            <option value="">No customer</option>
            {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <div className="copy-helper-row">
          <button type="button" className="secondary-button" onClick={useCustomerAddress} disabled={!selectedCustomer}>Use customer address</button>
        </div>
        <label>Company
          <input placeholder="Company" value={draft.companyName} onChange={(e) => { setDraft({ ...draft, companyName: e.target.value }); setFieldErrors((fe) => ({ ...fe, companyName: '' })) }} />
          {fieldErrors.companyName ? <small className="field-error">{fieldErrors.companyName}</small> : null}
        </label>
        <label>Location name
          <input placeholder="Location Name" value={draft.locationName} onChange={(e) => { setDraft({ ...draft, locationName: e.target.value }); setFieldErrors((fe) => ({ ...fe, locationName: '' })) }} />
          {fieldErrors.locationName ? <small className="field-error">{fieldErrors.locationName}</small> : null}
        </label>
        <div className="row">
          <label>On-site contact<input placeholder="On-site contact" value={draft.onSiteContactName ?? ''} onChange={(e) => setDraft({ ...draft, onSiteContactName: e.target.value })} /></label>
          <label>On-site phone<input placeholder="On-site phone" value={draft.onSiteContactPhone ?? ''} onChange={(e) => setDraft({ ...draft, onSiteContactPhone: e.target.value })} /></label>
          <label>On-site email<input placeholder="On-site email" value={draft.onSiteContactEmail ?? ''} onChange={(e) => setDraft({ ...draft, onSiteContactEmail: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Address
            <input placeholder="Address" value={draft.addressLine1} onChange={(e) => { setDraft({ ...draft, addressLine1: e.target.value }); setFieldErrors((fe) => ({ ...fe, addressLine1: '' })) }} />
            {fieldErrors.addressLine1 ? <small className="field-error">{fieldErrors.addressLine1}</small> : null}
          </label>
          <label>Address line 2<input placeholder="Address line 2" value={draft.addressLine2 ?? ''} onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>City
            <input placeholder="City" value={draft.city} onChange={(e) => { setDraft({ ...draft, city: e.target.value }); setFieldErrors((fe) => ({ ...fe, city: '' })) }} />
            {fieldErrors.city ? <small className="field-error">{fieldErrors.city}</small> : null}
          </label>
          <label>State
            <input placeholder="State" value={draft.state} onChange={(e) => { setDraft({ ...draft, state: e.target.value }); setFieldErrors((fe) => ({ ...fe, state: '' })) }} />
            {fieldErrors.state ? <small className="field-error">{fieldErrors.state}</small> : null}
          </label>
        </div>
        <div className="row">
          <label>Postal code
            <input placeholder="Postal" value={draft.postalCode} onChange={(e) => { setDraft({ ...draft, postalCode: e.target.value }); setFieldErrors((fe) => ({ ...fe, postalCode: '' })) }} />
            {fieldErrors.postalCode ? <small className="field-error">{fieldErrors.postalCode}</small> : null}
          </label>
          <label>Parish / county<input placeholder="Parish / county" value={draft.parishCounty ?? ''} onChange={(e) => setDraft({ ...draft, parishCounty: e.target.value })} /></label>
          <label>Country
            <input placeholder="Country" value={draft.country} onChange={(e) => { setDraft({ ...draft, country: e.target.value }); setFieldErrors((fe) => ({ ...fe, country: '' })) }} />
            {fieldErrors.country ? <small className="field-error">{fieldErrors.country}</small> : null}
          </label>
        </div>
        <div className="row">
          <label>Gate code<input placeholder="Gate code" value={draft.gateCode ?? ''} onChange={(e) => setDraft({ ...draft, gateCode: e.target.value })} /></label>
        </div>
        <label>
          Access instructions
          <textarea rows={3} maxLength={2000} placeholder="Access instructions" value={draft.accessInstructions ?? ''} onChange={(e) => setDraft({ ...draft, accessInstructions: e.target.value })} />
          <span className={`field-char-count${(draft.accessInstructions?.length ?? 0) > 1800 ? ' field-char-count--warn' : ''}`}>{draft.accessInstructions?.length ?? 0} / 2,000</span>
        </label>
        <label>
          Safety requirements
          <textarea rows={3} maxLength={2000} placeholder="Safety requirements" value={draft.safetyRequirements ?? ''} onChange={(e) => setDraft({ ...draft, safetyRequirements: e.target.value })} />
          <span className={`field-char-count${(draft.safetyRequirements?.length ?? 0) > 1800 ? ' field-char-count--warn' : ''}`}>{draft.safetyRequirements?.length ?? 0} / 2,000</span>
        </label>
        <label>
          Site notes
          <textarea rows={4} maxLength={4000} placeholder="Site notes" value={draft.siteNotes ?? ''} onChange={(e) => setDraft({ ...draft, siteNotes: e.target.value })} />
          <span className={`field-char-count${(draft.siteNotes?.length ?? 0) > 3600 ? ' field-char-count--warn' : ''}`}>{draft.siteNotes?.length ?? 0} / 4,000</span>
        </label>
        <label>
          <input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Active
        </label>
        {editId ? <p className="muted">Editing service location. Save changes or return to the location list.</p> : null}
        <div className="row">
          <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (editId ? 'Save Location' : 'Create Location')}</button>
          <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel service-location edit' : 'Back to service locations'}</button>
        </div>
      </form>

      <div className="stack" hidden={editorOpen}>
        <MasterDataFilters
          label="service locations"
          search={search}
          searchPlaceholder="Search by location, customer, company, contact, phone, or address"
          archiveFilter={archiveFilter}
          onSearchChange={setSearch}
          onArchiveFilterChange={setArchiveFilter}
          onReset={() => { setSearch(''); setArchiveFilter('all'); setCustomerFilter('') }}
        >
          <label>Customer
            <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
              <option value="">All customers</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
        </MasterDataFilters>
        <MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="service locations" />
        <MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="service locations" />
        <ul className="master-data-list compact-master-list service-location-list">
          {filteredItems.map((location) => {
            const accessNotes = [
              location.gateCode ? `Gate: ${location.gateCode}` : null,
              location.parishCounty ? `County: ${location.parishCounty}` : null
            ]
            return (
              <li className="master-data-item compact-master-list-item service-location-list-item" key={location.id}>
                <div className="compact-list-primary">
                  <div className="master-data-title-row">
                    <strong className="master-data-title">{location.locationName}</strong>
                    <span className={`status-pill ${location.isArchived ? 'inactive' : 'active'}`}>{archiveStatusLabel(location.isArchived)}</span>
                    <span className={`status-pill ${location.isActive ? 'active' : 'inactive'}`}>{location.isActive ? 'Service active' : 'Service inactive'}</span>
                  </div>
                  <span className="compact-list-subtext">{fallbackText(location.companyName, 'No company')}</span>
                </div>
                {compactListField('Customer', customerNameById(customers, location.customerId), 'No customer')}
                {compactListStackedField('Contact', [location.onSiteContactName, location.onSiteContactPhone, location.onSiteContactEmail], 'No site contact')}
                {compactListField('Address', serviceLocationAddress(location), 'No address', 'service-location-address compact-list-address')}
                {compactListStackedField('Access', accessNotes, 'No access notes', 'service-location-access')}
                <div className="master-data-actions compact-list-actions">
                  <button type="button" onClick={() => startEdit(location)}>Edit</button>
                  <button type="button" onClick={async () => {
                    if (!confirmArchiveAction('service location', location.locationName, location.isArchived)) return
                    const action = location.isArchived ? 'unarchived' : 'archived'
                    try {
                      setError(null); setSuccess(null)
                      if (location.isArchived) await masterDataApi.unarchiveServiceLocation(location.id)
                      else await masterDataApi.archiveServiceLocation(location.id)
                      await load()
                      setSuccess(`Service location "${location.locationName}" was ${action}.`)
                    } catch {
                      setSuccess(null)
                      setError('Unable to update service location archive state.')
                    }
                  }}>{location.isArchived ? 'Unarchive' : 'Archive'}</button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
