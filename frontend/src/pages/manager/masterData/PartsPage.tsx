import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { masterDataApi } from '../../../api/masterDataApi'
import type {
  CreatePartCategoryDto,
  CreatePartDto,
  CreateVendorDto,
  PartCategoryDto,
  PartDto,
  VendorDto
} from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  MasterDataFilters,
  MasterDataItem,
  MasterDataListState,
  MasterDataListSummary,
  archiveStatusLabel,
  categoryNameById,
  masterDataRequestErrorMessage,
  matchesArchiveFilter,
  matchesTextSearch,
  useScrollToError,
  vendorNameById,
  type ArchiveFilter
} from './masterDataShared'
import {
  activeFilterId,
  activeOrSelected,
  compactListField,
  confirmArchiveAction,
  emptyPartCategoryDraft,
  emptyPartDraft,
  emptyVendorDraft,
  hasNonNegativeNumbers,
  hasRequiredText,
  partDraftFromFilters
} from './masterDataPageUtils'

// ── Part-specific types and helpers ──────────────────────────────────────────

type PartsWorkspaceScreen = 'parts' | 'vendors' | 'categories'
type PartWorkflowFilter = 'all' | 'ready' | 'needsDetails' | 'noVendor'
type PartSortMode = 'workflow' | 'partNumber' | 'name' | 'vendor'
type PartCatalogReadiness = 'ready' | 'needsDetails' | 'noVendor'

const partCatalogReadiness = (part: PartDto): PartCatalogReadiness => {
  if (!part.vendorId) return 'noVendor'
  if (!part.description?.trim()) return 'needsDetails'
  return 'ready'
}

const partCatalogReadinessLabel = (part: PartDto) => {
  const readiness = partCatalogReadiness(part)
  if (readiness === 'noVendor') return 'Missing vendor link'
  if (readiness === 'needsDetails') return 'Needs part details'
  return 'Ready for ticket use'
}

const partSortPriorityRank = (part: PartDto) => {
  const readiness = partCatalogReadiness(part)
  if (readiness === 'noVendor') return 0
  if (readiness === 'needsDetails') return 1
  return 2
}

const partMatchesWorkflowFilter = (part: PartDto, workflowFilter: PartWorkflowFilter) => {
  if (workflowFilter === 'ready') return partCatalogReadiness(part) === 'ready'
  if (workflowFilter === 'needsDetails') return partCatalogReadiness(part) === 'needsDetails'
  if (workflowFilter === 'noVendor') return !part.vendorId
  return true
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PartsPage() {
  const [activeScreen, setActiveScreen] = useState<PartsWorkspaceScreen>('parts')
  const [editorOpen, setEditorOpen] = useState(true)
  const activePartEditId = useRef<string | null>(null)
  const [parts, setParts] = useState<PartDto[]>([])
  const [vendors, setVendors] = useState<VendorDto[]>([])
  const [categories, setCategories] = useState<PartCategoryDto[]>([])
  const [draft, setDraft] = useState<CreatePartDto>(emptyPartDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [vendorDraft, setVendorDraft] = useState<CreateVendorDto>(emptyVendorDraft)
  const [vendorEditId, setVendorEditId] = useState<string | null>(null)
  const [categoryDraft, setCategoryDraft] = useState<CreatePartCategoryDto>(emptyPartCategoryDraft)
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPartSaving, setIsPartSaving] = useState(false)
  const [isVendorSaving, setIsVendorSaving] = useState(false)
  const [isCategorySaving, setIsCategorySaving] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [partSearch, setPartSearch] = useState('')
  const [partArchiveFilter, setPartArchiveFilter] = useState<ArchiveFilter>('all')
  const [partCategoryFilter, setPartCategoryFilter] = useState('')
  const [partVendorFilter, setPartVendorFilter] = useState('')
  const [partWorkflowFilter, setPartWorkflowFilter] = useState<PartWorkflowFilter>('all')
  const [partSortMode, setPartSortMode] = useState<PartSortMode>('workflow')
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorArchiveFilter, setVendorArchiveFilter] = useState<ArchiveFilter>('all')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryArchiveFilter, setCategoryArchiveFilter] = useState<ArchiveFilter>('all')

  const load = () => {
    setIsLoading(true)
    return Promise.all([masterDataApi.listParts(), masterDataApi.listVendors(), masterDataApi.listPartCategories()])
      .then(([partRows, vendorRows, categoryRows]) => {
        setParts(partRows)
        setVendors(vendorRows)
        setCategories(categoryRows)
        if (!hasLoaded) {
          setEditorOpen(partRows.length === 0)
          setHasLoaded(true)
        }
      })
      .catch(() => setError('Unable to load parts, vendors, or categories.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!activePartEditId.current) {
      setDraft((current) => ({
        ...current,
        partCategoryId: activeFilterId(categories, partCategoryFilter),
        vendorId: activeFilterId(vendors, partVendorFilter) || null
      }))
    }
  }, [partCategoryFilter, partVendorFilter, editId])

  const filteredPartsBeforeWorkflow = useMemo(
    () => parts.filter((part) =>
      matchesArchiveFilter(partArchiveFilter, part.isArchived) &&
      (!partCategoryFilter || part.partCategoryId === partCategoryFilter) &&
      (!partVendorFilter || part.vendorId === partVendorFilter) &&
      matchesTextSearch(partSearch, [part.partNumber, part.name, part.description, categoryNameById(categories, part.partCategoryId), vendorNameById(vendors, part.vendorId)])
    ),
    [parts, vendors, categories, partSearch, partArchiveFilter, partCategoryFilter, partVendorFilter]
  )

  const filteredParts = useMemo(() => {
    const scopedParts = filteredPartsBeforeWorkflow.filter((part) => partMatchesWorkflowFilter(part, partWorkflowFilter))
    return [...scopedParts].sort((left, right) => {
      if (partSortMode === 'partNumber') return left.partNumber.localeCompare(right.partNumber)
      if (partSortMode === 'name') return left.name.localeCompare(right.name)
      if (partSortMode === 'vendor') return vendorNameById(vendors, left.vendorId).localeCompare(vendorNameById(vendors, right.vendorId))
      const priorityDifference = partSortPriorityRank(left) - partSortPriorityRank(right)
      if (priorityDifference !== 0) return priorityDifference
      return left.partNumber.localeCompare(right.partNumber)
    })
  }, [filteredPartsBeforeWorkflow, partWorkflowFilter, partSortMode, vendors])

  const partWorkflowCounts = useMemo(() => {
    let ready = 0; let needsDetails = 0; let noVendor = 0
    for (const part of filteredPartsBeforeWorkflow) {
      const readiness = partCatalogReadiness(part)
      if (readiness === 'ready') ready += 1
      else if (readiness === 'needsDetails') needsDetails += 1
      if (!part.vendorId) noVendor += 1
    }
    return { total: filteredPartsBeforeWorkflow.length, ready, needsDetails, noVendor }
  }, [filteredPartsBeforeWorkflow])

  const filteredVendors = useMemo(
    () => vendors.filter((vendor) =>
      matchesArchiveFilter(vendorArchiveFilter, vendor.isArchived) &&
      matchesTextSearch(vendorSearch, [vendor.name, vendor.accountNumber, vendor.contactName, vendor.email, vendor.phone])
    ),
    [vendors, vendorSearch, vendorArchiveFilter]
  )

  const filteredCategories = useMemo(
    () => categories.filter((category) =>
      matchesArchiveFilter(categoryArchiveFilter, category.isArchived) &&
      matchesTextSearch(categorySearch, [category.name, category.description])
    ),
    [categories, categorySearch, categoryArchiveFilter]
  )

  const partCategoryOptions = useMemo(() => activeOrSelected(categories, [draft.partCategoryId]), [categories, draft.partCategoryId])
  const partVendorOptions = useMemo(() => activeOrSelected(vendors, [draft.vendorId]), [vendors, draft.vendorId])

  const switchScreen = (screen: PartsWorkspaceScreen) => {
    activePartEditId.current = null
    setActiveScreen(screen); setEditorOpen(false); setEditId(null); setError(null); setSuccess(null)
  }

  const closeEditor = () => {
    setDraft(partDraftFromFilters(categories, partCategoryFilter, vendors, partVendorFilter))
    activePartEditId.current = null
    setVendorDraft(emptyVendorDraft); setCategoryDraft(emptyPartCategoryDraft)
    setEditId(null); setVendorEditId(null); setCategoryEditId(null)
    setError(null); setSuccess(null); setEditorOpen(false)
  }

  const savePart = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.partCategoryId || !hasRequiredText(draft.partNumber) || !hasRequiredText(draft.name)) {
      setSuccess(null); return setError('Category, part number, and name are required.')
    }
    if (!hasNonNegativeNumbers(draft.unitCost, draft.unitPrice, draft.quantityOnHand, draft.reorderThreshold)) {
      setSuccess(null); return setError('Part cost, price, quantity on hand, and reorder threshold must be zero or greater.')
    }
    try {
      const action = editId ? 'updated' : 'created'
      const partName = `${draft.partNumber.trim()} - ${draft.name.trim()}`
      setError(null); setSuccess(null); setIsPartSaving(true)
      if (editId) await masterDataApi.updatePart(editId, draft)
      else await masterDataApi.createPart(draft)
      setDraft(partDraftFromFilters(categories, partCategoryFilter, vendors, partVendorFilter))
      activePartEditId.current = null; setEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Part "${partName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save part.'))
    } finally {
      setIsPartSaving(false)
    }
  }

  const saveVendor = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredText(vendorDraft.name)) { setSuccess(null); return setError('Vendor name is required.') }
    try {
      const action = vendorEditId ? 'updated' : 'created'
      const vendorName = vendorDraft.name.trim()
      setError(null); setSuccess(null); setIsVendorSaving(true)
      if (vendorEditId) await masterDataApi.updateVendor(vendorEditId, vendorDraft)
      else await masterDataApi.createVendor(vendorDraft)
      setVendorDraft(emptyVendorDraft); setVendorEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Vendor "${vendorName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save vendor.'))
    } finally {
      setIsVendorSaving(false)
    }
  }

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasRequiredText(categoryDraft.name)) { setSuccess(null); return setError('Part category name is required.') }
    try {
      const action = categoryEditId ? 'updated' : 'created'
      const categoryName = categoryDraft.name.trim()
      setError(null); setSuccess(null); setIsCategorySaving(true)
      if (categoryEditId) await masterDataApi.updatePartCategory(categoryEditId, categoryDraft)
      else await masterDataApi.createPartCategory(categoryDraft)
      setCategoryDraft(emptyPartCategoryDraft); setCategoryEditId(null); await load()
      setEditorOpen(false)
      setSuccess(`Part category "${categoryName}" was ${action}.`)
    } catch (requestError) {
      setSuccess(null)
      setError(masterDataRequestErrorMessage(requestError, 'Unable to save part category.'))
    } finally {
      setIsCategorySaving(false)
    }
  }

  const activeTitle = activeScreen === 'parts' ? 'Parts' : activeScreen === 'vendors' ? 'Vendors' : 'Part Categories'
  useScrollToError(error)

  return (
    <section className="stack supply-v2-screen">
      <nav className="master-data-screen-tabs" aria-label="parts master-data screens">
        <div role="tablist" aria-label="parts workspace">
          {([
            ['parts', 'Parts'],
            ['vendors', 'Vendors'],
            ['categories', 'Part Categories']
          ] as Array<[PartsWorkspaceScreen, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeScreen === value}
              className={activeScreen === value ? 'ticket-workflow-tab-active' : ''}
              onClick={() => switchScreen(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <article className="card stack supply-v2-card">
        <div className="report-results-heading">
          <div>
            <h2>{activeTitle}</h2>
            <p className="muted">{editorOpen ? `Complete the focused ${activeTitle.toLowerCase()} editor.` : `Search and manage ${activeTitle.toLowerCase()}.`}</p>
          </div>
          {!editorOpen ? (
            <button type="button" onClick={() => {
              setError(null); setSuccess(null)
              if (activeScreen === 'parts') {
                setDraft(partDraftFromFilters(categories, partCategoryFilter, vendors, partVendorFilter))
                activePartEditId.current = null; setEditId(null)
              } else if (activeScreen === 'vendors') {
                setVendorDraft(emptyVendorDraft); setVendorEditId(null)
              } else {
                setCategoryDraft(emptyPartCategoryDraft); setCategoryEditId(null)
              }
              setEditorOpen(true)
            }}>
              {activeScreen === 'parts' ? 'Create Part' : activeScreen === 'vendors' ? 'Create Vendor' : 'Create Category'}
            </button>
          ) : null}
        </div>
        <Errorable error={error} />
        {success ? <p className="success action-feedback-panel">{success}</p> : null}

        {activeScreen === 'parts' ? (
          <>
            <form onSubmit={savePart} className="stack" aria-label="part form" hidden={!editorOpen}>
              <div className="row">
                <label>Part number<input placeholder="Part Number" value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} /></label>
                <label>Name<input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              </div>
              <label>Description<input placeholder="Description" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
              <div className="row">
                <label>Part category
                  <select value={draft.partCategoryId} onChange={(e) => setDraft({ ...draft, partCategoryId: e.target.value })}>
                    <option value="">Category</option>
                    {partCategoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label>Preferred vendor
                  <select value={draft.vendorId ?? ''} onChange={(e) => setDraft({ ...draft, vendorId: e.target.value || null })}>
                    <option value="">Vendor</option>
                    {partVendorOptions.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="row">
                <label>Unit cost<input type="number" min="0" step="0.01" placeholder="Cost" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: Number(e.target.value) })} /></label>
                <label>Billable price<input type="number" min="0" step="0.01" placeholder="Price" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })} /></label>
                <label>Quantity on hand<input type="number" min="0" step="0.01" placeholder="Quantity on hand" value={draft.quantityOnHand} onChange={(e) => setDraft({ ...draft, quantityOnHand: Number(e.target.value) })} /></label>
                <label>Reorder threshold<input type="number" min="0" step="0.01" placeholder="Reorder threshold" value={draft.reorderThreshold} onChange={(e) => setDraft({ ...draft, reorderThreshold: Number(e.target.value) })} /></label>
              </div>
              {editId ? <p className="muted">Editing part. Save changes or return to the parts list.</p> : null}
              <div className="row">
                <button type="submit" disabled={isPartSaving}>{isPartSaving ? 'Saving...' : (editId ? 'Save Part' : 'Create Part')}</button>
                <button type="button" className="secondary-button" onClick={closeEditor}>{editId ? 'Cancel part edit' : 'Back to parts'}</button>
              </div>
            </form>

            <div className="stack" hidden={editorOpen}>
              <div className="parts-workflow-panel" aria-label="parts workflow">
                <div className="parts-workflow-chips" role="group" aria-label="parts focus filters">
                  <button type="button" className={partWorkflowFilter === 'all' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setPartWorkflowFilter('all')}>All visible ({partWorkflowCounts.total})</button>
                  <button type="button" className={partWorkflowFilter === 'ready' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setPartWorkflowFilter('ready')}>Ready for ticket use ({partWorkflowCounts.ready})</button>
                  <button type="button" className={partWorkflowFilter === 'needsDetails' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setPartWorkflowFilter('needsDetails')}>Needs details ({partWorkflowCounts.needsDetails})</button>
                  <button type="button" className={partWorkflowFilter === 'noVendor' ? 'parts-workflow-chip-active' : 'secondary-button'} onClick={() => setPartWorkflowFilter('noVendor')}>Unassigned vendor ({partWorkflowCounts.noVendor})</button>
                </div>
                <label className="parts-workflow-sort">Sort by
                  <select value={partSortMode} onChange={(event) => setPartSortMode(event.target.value as PartSortMode)}>
                    <option value="workflow">Workflow priority</option>
                    <option value="partNumber">Part number (A-Z)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="vendor">Vendor (A-Z)</option>
                  </select>
                </label>
              </div>
              <MasterDataFilters
                label="parts"
                search={partSearch}
                searchPlaceholder="Search by part number, name, category, vendor, or description"
                archiveFilter={partArchiveFilter}
                onSearchChange={setPartSearch}
                onArchiveFilterChange={setPartArchiveFilter}
                onReset={() => { setPartSearch(''); setPartArchiveFilter('all'); setPartCategoryFilter(''); setPartVendorFilter(''); setPartWorkflowFilter('all'); setPartSortMode('workflow') }}
              >
                <label>Category
                  <select aria-label="Part category filter" value={partCategoryFilter} onChange={(event) => setPartCategoryFilter(event.target.value)}>
                    <option value="">All categories</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label>Vendor
                  <select aria-label="Part vendor filter" value={partVendorFilter} onChange={(event) => setPartVendorFilter(event.target.value)}>
                    <option value="">All vendors</option>
                    {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                  </select>
                </label>
              </MasterDataFilters>
              <MasterDataListSummary loading={isLoading} totalCount={parts.length} filteredItems={filteredParts} noun="parts" />
              <MasterDataListState loading={isLoading} totalCount={parts.length} filteredCount={filteredParts.length} noun="parts" />
              <ul className="master-data-list compact-master-list part-list">
                {filteredParts.map((part) => (
                  <li className="master-data-item compact-master-list-item part-list-item" key={part.id}>
                    <div className="compact-list-primary">
                      <div className="master-data-title-row">
                        <strong className="master-data-title">{part.partNumber} - {part.name}</strong>
                        <span className={`status-pill ${part.isArchived ? 'inactive' : 'active'}`}>{archiveStatusLabel(part.isArchived)}</span>
                      </div>
                      <span className="compact-list-subtext">{partCatalogReadinessLabel(part)}{part.description?.trim() ? ` · ${part.description}` : ''}</span>
                    </div>
                    {compactListField('Category', categoryNameById(categories, part.partCategoryId), 'No category')}
                    {compactListField('Vendor', vendorNameById(vendors, part.vendorId), 'No vendor')}
                    {compactListField('Cost / price', `$${part.unitCost} / $${part.unitPrice}`, 'Not priced')}
                    {compactListField('Stock', `On hand ${part.quantityOnHand ?? 0} · Reorder ${part.reorderThreshold ?? 0}`, 'No stock data', 'part-list-stock')}
                    <div className="master-data-actions compact-list-actions">
                      <button type="button" onClick={() => { activePartEditId.current = part.id; setDraft(part); setEditId(part.id); setError(null); setSuccess(null); setEditorOpen(true) }}>Edit</button>
                      <button type="button" onClick={async () => {
                        if (!confirmArchiveAction('part', `${part.partNumber} - ${part.name}`, part.isArchived)) return
                        try {
                          setError(null); setSuccess(null)
                          if (part.isArchived) await masterDataApi.unarchivePart(part.id)
                          else await masterDataApi.archivePart(part.id)
                          await load()
                          setSuccess(`Part "${part.partNumber} - ${part.name}" was ${part.isArchived ? 'unarchived' : 'archived'}.`)
                        } catch {
                          setSuccess(null)
                          setError('Unable to update archive state.')
                        }
                      }}>{part.isArchived ? 'Unarchive' : 'Archive'}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {activeScreen === 'vendors' ? (
          <>
            <form className="stack" aria-label="vendor form" onSubmit={saveVendor} hidden={!editorOpen}>
              <div className="row">
                <label>Vendor name<input placeholder="Vendor name" value={vendorDraft.name} onChange={(e) => setVendorDraft({ ...vendorDraft, name: e.target.value })} /></label>
                <label>Account number<input placeholder="Vendor account number" value={vendorDraft.accountNumber ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, accountNumber: e.target.value })} /></label>
              </div>
              <div className="row">
                <label>Contact name<input placeholder="Vendor contact name" value={vendorDraft.contactName ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, contactName: e.target.value })} /></label>
                <label>Email<input placeholder="Vendor email" value={vendorDraft.email ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, email: e.target.value })} /></label>
                <label>Phone<input placeholder="Vendor phone" value={vendorDraft.phone ?? ''} onChange={(e) => setVendorDraft({ ...vendorDraft, phone: e.target.value })} /></label>
              </div>
              {vendorEditId ? <p className="muted">Editing vendor. Save changes or return to the vendor list.</p> : null}
              <div className="row">
                <button type="submit" disabled={isVendorSaving}>{isVendorSaving ? 'Saving...' : (vendorEditId ? 'Save Vendor' : 'Create Vendor')}</button>
                <button type="button" className="secondary-button" onClick={closeEditor}>{vendorEditId ? 'Cancel vendor edit' : 'Back to vendors'}</button>
              </div>
            </form>

            <div className="stack" hidden={editorOpen}>
              <MasterDataFilters
                label="vendors"
                search={vendorSearch}
                searchPlaceholder="Search by name, account, contact, email, or phone"
                archiveFilter={vendorArchiveFilter}
                onSearchChange={setVendorSearch}
                onArchiveFilterChange={setVendorArchiveFilter}
                onReset={() => { setVendorSearch(''); setVendorArchiveFilter('all') }}
              />
              <MasterDataListSummary loading={isLoading} totalCount={vendors.length} filteredItems={filteredVendors} noun="vendors" />
              <MasterDataListState loading={isLoading} totalCount={vendors.length} filteredCount={filteredVendors.length} noun="vendors" />
              <ul className="master-data-list">
                {filteredVendors.map((vendor) => (
                  <MasterDataItem
                    key={vendor.id}
                    title={vendor.name}
                    statusArchived={vendor.isArchived}
                    meta={[
                      vendor.accountNumber ? `Account: ${vendor.accountNumber}` : 'Account: No account',
                      vendor.contactName ? `Contact: ${vendor.contactName}` : null,
                      vendor.email ? `Email: ${vendor.email}` : null,
                      vendor.phone ? `Phone: ${vendor.phone}` : null
                    ]}
                    actions={
                      <>
                        <button type="button" onClick={() => { setVendorDraft(vendor); setVendorEditId(vendor.id); setError(null); setSuccess(null); setEditorOpen(true) }}>Edit</button>
                        <button type="button" onClick={async () => {
                          if (!confirmArchiveAction('vendor', vendor.name, vendor.isArchived)) return
                          try {
                            setError(null); setSuccess(null)
                            if (vendor.isArchived) await masterDataApi.unarchiveVendor(vendor.id)
                            else await masterDataApi.archiveVendor(vendor.id)
                            await load()
                            setSuccess(`Vendor "${vendor.name}" was ${vendor.isArchived ? 'unarchived' : 'archived'}.`)
                          } catch {
                            setSuccess(null)
                            setError('Unable to update archive state.')
                          }
                        }}>{vendor.isArchived ? 'Unarchive' : 'Archive'}</button>
                      </>
                    }
                  />
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {activeScreen === 'categories' ? (
          <>
            <form className="stack" aria-label="part category form" onSubmit={saveCategory} hidden={!editorOpen}>
              <div className="row">
                <label>Category name<input placeholder="Category name" value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></label>
                <label>Description<input placeholder="Category description" value={categoryDraft.description ?? ''} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></label>
              </div>
              {categoryEditId ? <p className="muted">Editing part category. Save changes or return to the category list.</p> : null}
              <div className="row">
                <button type="submit" disabled={isCategorySaving}>{isCategorySaving ? 'Saving...' : (categoryEditId ? 'Save Category' : 'Create Category')}</button>
                <button type="button" className="secondary-button" onClick={closeEditor}>{categoryEditId ? 'Cancel category edit' : 'Back to categories'}</button>
              </div>
            </form>

            <div className="stack" hidden={editorOpen}>
              <MasterDataFilters
                label="part categories"
                search={categorySearch}
                searchPlaceholder="Search by name or description"
                archiveFilter={categoryArchiveFilter}
                onSearchChange={setCategorySearch}
                onArchiveFilterChange={setCategoryArchiveFilter}
                onReset={() => { setCategorySearch(''); setCategoryArchiveFilter('all') }}
              />
              <MasterDataListSummary loading={isLoading} totalCount={categories.length} filteredItems={filteredCategories} noun="part categories" />
              <MasterDataListState loading={isLoading} totalCount={categories.length} filteredCount={filteredCategories.length} noun="part categories" />
              <ul className="master-data-list">
                {filteredCategories.map((category) => (
                  <MasterDataItem
                    key={category.id}
                    title={category.name}
                    statusArchived={category.isArchived}
                    meta={[category.description ? `Description: ${category.description}` : 'Description: None']}
                    actions={
                      <>
                        <button type="button" onClick={() => { setCategoryDraft(category); setCategoryEditId(category.id); setError(null); setSuccess(null); setEditorOpen(true) }}>Edit</button>
                        <button type="button" onClick={async () => {
                          if (!confirmArchiveAction('part category', category.name, category.isArchived)) return
                          try {
                            setError(null); setSuccess(null)
                            if (category.isArchived) await masterDataApi.unarchivePartCategory(category.id)
                            else await masterDataApi.archivePartCategory(category.id)
                            await load()
                            setSuccess(`Part category "${category.name}" was ${category.isArchived ? 'unarchived' : 'archived'}.`)
                          } catch {
                            setSuccess(null)
                            setError('Unable to update archive state.')
                          }
                        }}>{category.isArchived ? 'Unarchive' : 'Archive'}</button>
                      </>
                    }
                  />
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </article>
    </section>
  )
}
