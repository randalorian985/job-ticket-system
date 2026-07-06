import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { masterDataApi } from '../../../api/masterDataApi'
import type {
  AddEquipmentCompatiblePartDto,
  CreateEquipmentDto,
  CustomerDto,
  EquipmentCompatiblePartsDto,
  EquipmentDto,
  PartDto,
  ServiceLocationDto,
  UpdateEquipmentCompatiblePartDto
} from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  MasterDataFilters,
  MasterDataListState,
  MasterDataListSummary,
  archiveStatusLabel,
  customerNameById,
  locationNameById,
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
  emptyEquipmentDraft,
  equipmentDraftFromFilter,
  hasMatchingEquipmentServiceLocation,
  hasRequiredText,
  hasValidEquipmentYear
} from './masterDataPageUtils'

export function EquipmentPage() {
  const [editorOpen, setEditorOpen] = useState(true)
  const [items, setItems] = useState<EquipmentDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [locations, setLocations] = useState<ServiceLocationDto[]>([])
  const [draft, setDraft] = useState<CreateEquipmentDto>(emptyEquipmentDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const [customerFilter, setCustomerFilter] = useState('')

  // Compatible parts tab state
  const [activeEquipmentTab, setActiveEquipmentTab] = useState<'details' | 'parts'>('details')
  const [allParts, setAllParts] = useState<PartDto[]>([])
  const [compatiblePartsData, setCompatiblePartsData] = useState<EquipmentCompatiblePartsDto | null>(null)
  const [partsTabLoading, setPartsTabLoading] = useState(false)
  const [partsTabError, setPartsTabError] = useState<string | null>(null)
  const [addPartDraft, setAddPartDraft] = useState<AddEquipmentCompatiblePartDto & { partId: string }>({ partId: '', notes: '', isRecommendedForPM: false })
  const [addPartError, setAddPartError] = useState<string | null>(null)
  const [editingCompatPartId, setEditingCompatPartId] = useState<string | null>(null)
  const [editCompatDraft, setEditCompatDraft] = useState<UpdateEquipmentCompatiblePartDto>({ notes: '', isRecommendedForPM: false })

  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listEquipment(), masterDataApi.listCustomers(), masterDataApi.listServiceLocations()])
      .then(([equipment, customerList, locationList]) => {
        setItems(equipment)
        setCustomers(customerList)
        setLocations(locationList)
        setEditorOpen(equipment.length === 0)
      })
      .catch(() => setError('Unable to load equipment.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!editId) setDraft((current) => ({ ...current, customerId: activeFilterId(customers, customerFilter), serviceLocationId: '' }))
  }, [customerFilter, editId])

  useEffect(() => {
    setActiveEquipmentTab('details')
    setCompatiblePartsData(null)
    setAddPartDraft({ partId: '', notes: '', isRecommendedForPM: false })
    setAddPartError(null)
    setEditingCompatPartId(null)
  }, [editId])

  useEffect(() => {
    if (activeEquipmentTab !== 'parts' || !editId) return
    setPartsTabLoading(true)
    setPartsTabError(null)
    Promise.all([masterDataApi.getEquipmentCompatibleParts(editId), masterDataApi.listParts()])
      .then(([catalog, partsList]) => {
        setCompatiblePartsData(catalog)
        setAllParts(partsList)
      })
      .catch(() => setPartsTabError('Unable to load compatible parts.'))
      .finally(() => setPartsTabLoading(false))
  }, [activeEquipmentTab, editId])

  const filteredItems = useMemo(
    () => items.filter((x) =>
      matchesArchiveFilter(archiveFilter, x.isArchived) &&
      (!customerFilter || x.customerId === customerFilter || x.ownerCustomerId === customerFilter || x.responsibleBillingCustomerId === customerFilter) &&
      matchesTextSearch(search, [
        x.name, x.equipmentNumber, x.unitNumber, x.serialNumber, x.modelNumber,
        x.manufacturer, x.equipmentType,
        customerNameById(customers, x.customerId),
        customerNameById(customers, x.ownerCustomerId),
        customerNameById(customers, x.responsibleBillingCustomerId),
        locationNameById(locations, x.serviceLocationId)
      ])
    ),
    [items, customers, locations, search, archiveFilter, customerFilter]
  )

  const customerOptions = useMemo(
    () => activeOrSelected(customers, [draft.customerId, draft.ownerCustomerId, draft.responsibleBillingCustomerId]),
    [customers, draft.customerId, draft.ownerCustomerId, draft.responsibleBillingCustomerId]
  )

  const availableServiceLocations = useMemo(
    () => locations.filter((location) =>
      (!location.isArchived || location.id === draft.serviceLocationId) &&
      (!draft.customerId || location.customerId === draft.customerId)
    ),
    [locations, draft.customerId, draft.serviceLocationId]
  )

  const editingEquipment = useMemo(() => items.find((item) => item.id === editId), [items, editId])

  const unavailableCurrentServiceLocationId =
    editingEquipment &&
    editingEquipment.customerId === draft.customerId &&
    editingEquipment.serviceLocationId === draft.serviceLocationId &&
    !locations.some((location) => location.id === draft.serviceLocationId)
      ? draft.serviceLocationId
      : null

  useScrollToError(error)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.customerId || !draft.serviceLocationId || !hasRequiredText(draft.name)) {
      setSuccess(null); return setError('Customer, location, and equipment name are required.')
    }
    if (!hasMatchingEquipmentServiceLocation(draft.customerId, draft.serviceLocationId, locations, editingEquipment)) {
      setSuccess(null); return setError('Equipment service location must belong to the selected customer.')
    }
    if (!hasValidEquipmentYear(draft.year)) {
      setSuccess(null); return setError('Equipment year must be a whole year from 1900 through 2100.')
    }
    try {
      const action = editId ? 'updated' : 'created'
      const equipmentName = draft.name.trim()
      setError(null); setSuccess(null); setIsSaving(true)
      if (editId) await masterDataApi.updateEquipment(editId, draft)
      else await masterDataApi.createEquipment(draft)
      setDraft(equipmentDraftFromFilter(customers, customerFilter)); setEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Equipment "${equipmentName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save equipment.'))
    } finally {
      setIsSaving(false)
    }
  }

  const closeEditor = () => {
    setDraft(equipmentDraftFromFilter(customers, customerFilter))
    setEditId(null); setError(null); setSuccess(null); setEditorOpen(false)
  }

  const startEdit = (equipment: EquipmentDto) => {
    setDraft(equipment)
    setEditId(equipment.id); setError(null); setSuccess(null); setEditorOpen(true)
  }

  return (
    <section className="card stack">
      <div className="report-results-heading">
        <div>
          <h2>Equipment</h2>
          <p className="muted">{editorOpen ? (editId ? 'Edit equipment details.' : 'Create an equipment record.') : 'Search and manage equipment records.'}</p>
        </div>
        {!editorOpen ? (
          <button type="button" onClick={() => { setDraft(equipmentDraftFromFilter(customers, customerFilter)); setEditId(null); setError(null); setSuccess(null); setEditorOpen(true) }}>
            Create Equipment
          </button>
        ) : null}
      </div>
      <Errorable error={error} />
      {success ? <p className="success action-feedback-panel">{success}</p> : null}

      {editorOpen && editId && (
        <div className="compat-parts-tab-nav">
          <button type="button" className={`tab-btn${activeEquipmentTab === 'details' ? ' tab-btn--active' : ''}`} onClick={() => setActiveEquipmentTab('details')}>Equipment Details</button>
          <button type="button" className={`tab-btn${activeEquipmentTab === 'parts' ? ' tab-btn--active' : ''}`} onClick={() => setActiveEquipmentTab('parts')}>Compatible Parts</button>
        </div>
      )}

      <form onSubmit={save} className="stack" aria-label="equipment form" hidden={!editorOpen || activeEquipmentTab !== 'details'}>
        <div className="row">
          <label>Primary customer
            <select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value, serviceLocationId: '' })}>
              <option value="">Customer</option>
              {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label>Service location
            <select value={draft.serviceLocationId} onChange={(e) => setDraft({ ...draft, serviceLocationId: e.target.value })}>
              <option value="">Service location</option>
              {unavailableCurrentServiceLocationId ? <option value={unavailableCurrentServiceLocationId}>Current service location (unavailable)</option> : null}
              {availableServiceLocations.map((location) => <option key={location.id} value={location.id}>{location.locationName}</option>)}
            </select>
          </label>
        </div>
        <div className="row">
          <label>Owner customer
            <select value={draft.ownerCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, ownerCustomerId: e.target.value || null })}>
              <option value="">Same as customer</option>
              {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label>Billing customer
            <select value={draft.responsibleBillingCustomerId ?? ''} onChange={(e) => setDraft({ ...draft, responsibleBillingCustomerId: e.target.value || null })}>
              <option value="">No separate billing customer</option>
              {customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
        </div>
        <div className="row">
          <label>Equipment name<input placeholder="Equipment name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Equipment number<input placeholder="Equipment number" value={draft.equipmentNumber ?? ''} onChange={(e) => setDraft({ ...draft, equipmentNumber: e.target.value })} /></label>
          <label>Unit number<input placeholder="Unit number" value={draft.unitNumber ?? ''} onChange={(e) => setDraft({ ...draft, unitNumber: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Manufacturer<input placeholder="Manufacturer" value={draft.manufacturer ?? ''} onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })} /></label>
          <label>Model number<input placeholder="Model number" value={draft.modelNumber ?? ''} onChange={(e) => setDraft({ ...draft, modelNumber: e.target.value })} /></label>
          <label>Serial number<input placeholder="Serial number" value={draft.serialNumber ?? ''} onChange={(e) => setDraft({ ...draft, serialNumber: e.target.value })} /></label>
        </div>
        <div className="row">
          <label>Equipment type<input placeholder="Equipment type" value={draft.equipmentType ?? ''} onChange={(e) => setDraft({ ...draft, equipmentType: e.target.value })} /></label>
          <label>Year<input type="number" min="1900" max="2100" step="1" placeholder="Year" value={draft.year ?? ''} onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })} /></label>
        </div>
        {editId ? <p className="muted">Editing equipment. Save changes or return to the equipment list.</p> : null}
        <div className="row">
          <button type="submit">{editId ? 'Save Equipment' : 'Create Equipment'}</button>
          <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel equipment edit' : 'Back to equipment'}</button>
        </div>
      </form>

      {editorOpen && editId && activeEquipmentTab === 'parts' && (
        <div className="stack">
          {partsTabLoading && <p className="muted">Loading compatible parts…</p>}
          {partsTabError && <p className="error-message">{partsTabError}</p>}
          {compatiblePartsData && (
            <>
              <div className="stack">
                <h3>Catalog</h3>
                <p className="muted">Parts assigned as compatible with this equipment.</p>
                {compatiblePartsData.catalog.length === 0 ? (
                  <p className="muted">No compatible parts added yet.</p>
                ) : (
                  <ul className="master-data-list compact-master-list">
                    {compatiblePartsData.catalog.map((entry) => (
                      <li key={entry.partId} className="master-data-item compact-master-list-item">
                        <div className="compact-list-primary">
                          <div className="master-data-title-row">
                            <strong className="master-data-title">{entry.partNumber} — {entry.partName}</strong>
                            {entry.isRecommendedForPM && <span className="status-pill active">PM Part</span>}
                          </div>
                          {entry.partDescription && <span className="compact-list-subtext">{entry.partDescription}</span>}
                        </div>
                        {editingCompatPartId === entry.partId ? (
                          <div className="stack">
                            <label>Notes<textarea rows={2} maxLength={1000} value={editCompatDraft.notes ?? ''} onChange={(e) => setEditCompatDraft({ ...editCompatDraft, notes: e.target.value })} /></label>
                            <label><input type="checkbox" checked={editCompatDraft.isRecommendedForPM} onChange={(e) => setEditCompatDraft({ ...editCompatDraft, isRecommendedForPM: e.target.checked })} /> Recommended for PM</label>
                            <div className="row">
                              <button type="button" onClick={async () => {
                                try {
                                  await masterDataApi.updateEquipmentCompatiblePart(editId, entry.partId, editCompatDraft)
                                  setEditingCompatPartId(null)
                                  const updated = await masterDataApi.getEquipmentCompatibleParts(editId)
                                  setCompatiblePartsData(updated)
                                } catch {
                                  setPartsTabError('Unable to update compatible part.')
                                }
                              }}>Save</button>
                              <button type="button" className="secondary-button" onClick={() => setEditingCompatPartId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {entry.notes ? compactListField('Notes', entry.notes) : null}
                            {compactListField('Added by', `${entry.addedByUserName} on ${new Date(entry.addedAtUtc).toLocaleDateString()}`)}
                            <div className="master-data-actions compact-list-actions">
                              <button type="button" onClick={() => { setEditingCompatPartId(entry.partId); setEditCompatDraft({ notes: entry.notes ?? '', isRecommendedForPM: entry.isRecommendedForPM }) }}>Edit</button>
                              <button type="button" onClick={async () => {
                                if (!window.confirm(`Remove ${entry.partNumber} from compatible parts?`)) return
                                try {
                                  await masterDataApi.removeEquipmentCompatiblePart(editId, entry.partId)
                                  const updated = await masterDataApi.getEquipmentCompatibleParts(editId)
                                  setCompatiblePartsData(updated)
                                } catch {
                                  setPartsTabError('Unable to remove compatible part.')
                                }
                              }}>Remove</button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="stack">
                <h4>Add Compatible Part</h4>
                {addPartError && <p className="error-message">{addPartError}</p>}
                <label>Part
                  <select value={addPartDraft.partId} onChange={(e) => setAddPartDraft({ ...addPartDraft, partId: e.target.value })}>
                    <option value="">Select a part</option>
                    {allParts
                      .filter((p) => !p.isArchived && !compatiblePartsData.catalog.some((c) => c.partId === p.id))
                      .map((p) => <option key={p.id} value={p.id}>{p.partNumber} — {p.name}</option>)}
                  </select>
                </label>
                <label>Notes (optional)
                  <textarea rows={2} maxLength={1000} placeholder="Notes about this part for this equipment" value={addPartDraft.notes ?? ''} onChange={(e) => setAddPartDraft({ ...addPartDraft, notes: e.target.value })} />
                </label>
                <label>
                  <input type="checkbox" checked={addPartDraft.isRecommendedForPM} onChange={(e) => setAddPartDraft({ ...addPartDraft, isRecommendedForPM: e.target.checked })} /> Recommended for PM (preventive maintenance)
                </label>
                <div className="row">
                  <button type="button" onClick={async () => {
                    if (!addPartDraft.partId) { setAddPartError('Select a part to add.'); return }
                    setAddPartError(null)
                    try {
                      await masterDataApi.addEquipmentCompatiblePart(editId, { partId: addPartDraft.partId, notes: addPartDraft.notes || null, isRecommendedForPM: addPartDraft.isRecommendedForPM })
                      setAddPartDraft({ partId: '', notes: '', isRecommendedForPM: false })
                      const updated = await masterDataApi.getEquipmentCompatibleParts(editId)
                      setCompatiblePartsData(updated)
                    } catch (addErr) {
                      setAddPartError(masterDataRequestErrorMessage(addErr, 'Unable to add compatible part.'))
                    }
                  }}>Add Part</button>
                </div>
              </div>

              {compatiblePartsData.history.length > 0 && (
                <div className="stack">
                  <h4>Parts Used on Past Tickets</h4>
                  <p className="muted">Parts that have been used on service tickets for this equipment (read-only).</p>
                  <ul className="master-data-list compact-master-list">
                    {compatiblePartsData.history.map((h) => (
                      <li key={h.partId} className="master-data-item compact-master-list-item">
                        <div className="compact-list-primary">
                          <strong className="master-data-title">{h.partNumber} — {h.partName}</strong>
                        </div>
                        {compactListField('Times used', String(h.usageCount))}
                        {h.lastUsedAtUtc ? compactListField('Last used', new Date(h.lastUsedAtUtc).toLocaleDateString()) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="row" style={{ marginTop: '1rem' }}>
            <button type="button" className="secondary-button" onClick={closeEditor}>Back to equipment</button>
          </div>
        </div>
      )}

      <div className="stack" hidden={editorOpen}>
        <MasterDataFilters
          label="equipment"
          search={search}
          searchPlaceholder="Search by name, unit, serial, model, customer, or location"
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
        <MasterDataListSummary loading={isLoading} totalCount={items.length} filteredItems={filteredItems} noun="equipment records" />
        <MasterDataListState loading={isLoading} totalCount={items.length} filteredCount={filteredItems.length} noun="equipment records" />
        <ul className="master-data-list compact-master-list equipment-list">
          {filteredItems.map((equipment) => {
            const equipmentIdentity = [
              equipment.equipmentNumber ? `Equipment #: ${equipment.equipmentNumber}` : null,
              equipment.unitNumber ? `Unit: ${equipment.unitNumber}` : null
            ].filter(Boolean).join(' | ')
            const modelName = [equipment.manufacturer, equipment.modelNumber].filter(Boolean).join(' ')

            return (
              <li className="master-data-item compact-master-list-item equipment-list-item" key={equipment.id}>
                <div className="compact-list-primary">
                  <div className="master-data-title-row">
                    <strong className="master-data-title">{equipment.name}</strong>
                    <span className={`status-pill ${equipment.isArchived ? 'inactive' : 'active'}`}>{archiveStatusLabel(equipment.isArchived)}</span>
                  </div>
                  <span className="compact-list-subtext">{equipmentIdentity || 'No equipment number'}</span>
                </div>
                {compactListField('Location', locationNameById(locations, equipment.serviceLocationId), 'Service location unavailable')}
                {compactListStackedField('Customers', [
                  `Owner: ${customerNameById(customers, equipment.ownerCustomerId ?? equipment.customerId) || 'Customer unavailable'}`,
                  `Billing: ${equipment.responsibleBillingCustomerId ? customerNameById(customers, equipment.responsibleBillingCustomerId) || 'Customer unavailable' : 'No separate billing customer'}`
                ], 'No customer relationships')}
                {compactListStackedField('Model / serial', [
                  modelName ? `Model: ${modelName}` : null,
                  equipment.serialNumber ? `Serial: ${equipment.serialNumber}` : null,
                  equipment.equipmentType ? `Type: ${equipment.equipmentType}` : null,
                  equipment.year ? `Year: ${equipment.year}` : null
                ], 'No model details', 'equipment-model')}
                <div className="master-data-actions compact-list-actions">
                  <Link to={`/manage/equipment/${equipment.id}/history`} className="secondary-button">View History</Link>
                  <button type="button" onClick={() => startEdit(equipment)}>Edit</button>
                  <button type="button" onClick={async () => {
                    if (!confirmArchiveAction('equipment', equipment.name, equipment.isArchived)) return
                    const action = equipment.isArchived ? 'unarchived' : 'archived'
                    try {
                      setError(null); setSuccess(null)
                      if (equipment.isArchived) await masterDataApi.unarchiveEquipment(equipment.id)
                      else await masterDataApi.archiveEquipment(equipment.id)
                      await load()
                      setSuccess(`Equipment "${equipment.name}" was ${action}.`)
                    } catch {
                      setSuccess(null)
                      setError('Unable to update equipment archive state.')
                    }
                  }}>{equipment.isArchived ? 'Unarchive' : 'Archive'}</button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
