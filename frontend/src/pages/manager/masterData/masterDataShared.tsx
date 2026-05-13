import { ApiError } from '../../../api/httpClient'
import type { CustomerDto, PartCategoryDto, ServiceLocationDto, VendorDto } from '../../../types'

export type ArchiveFilter = 'all' | 'active' | 'archived'

const normalizeSearchValue = (value?: string | number | null) => String(value ?? '').toLowerCase()
export const matchesTextSearch = (query: string, values: Array<string | number | null | undefined>) => {
  const normalizedQuery = query.trim().toLowerCase()
  return !normalizedQuery || values.some((value) => normalizeSearchValue(value).includes(normalizedQuery))
}
export const matchesArchiveFilter = (filter: ArchiveFilter, isArchived?: boolean) => {
  if (filter === 'active') return !isArchived
  if (filter === 'archived') return Boolean(isArchived)
  return true
}
export const archiveStatusLabel = (isArchived?: boolean) => isArchived ? 'Archived' : 'Active'
export const customerNameById = (customers: CustomerDto[], id?: string | null) => customers.find((customer) => customer.id === id)?.name ?? ''
export const locationNameById = (locations: ServiceLocationDto[], id?: string | null) => locations.find((location) => location.id === id)?.locationName ?? ''
export const categoryNameById = (categories: PartCategoryDto[], id?: string | null) => categories.find((category) => category.id === id)?.name ?? ''
export const vendorNameById = (vendors: VendorDto[], id?: string | null) => vendors.find((vendor) => vendor.id === id)?.name ?? ''

export function MasterDataFilters({
  label,
  search,
  searchPlaceholder,
  archiveFilter,
  onSearchChange,
  onArchiveFilterChange,
  onReset,
  children
}: {
  label: string
  search: string
  searchPlaceholder: string
  archiveFilter: ArchiveFilter
  onSearchChange: (value: string) => void
  onArchiveFilterChange: (value: ArchiveFilter) => void
  onReset: () => void
  children?: JSX.Element | JSX.Element[]
}) {
  return <div className="master-data-filters" aria-label={`${label} filters`}>
    <label>Search {label}<input value={search} placeholder={searchPlaceholder} onChange={(event) => onSearchChange(event.target.value)} /></label>
    <label>Status<select value={archiveFilter} onChange={(event) => onArchiveFilterChange(event.target.value as ArchiveFilter)}><option value="all">All records</option><option value="active">Active only</option><option value="archived">Archived only</option></select></label>
    {children}
    <button type="button" className="secondary-button" onClick={onReset}>Reset filters</button>
  </div>
}

export function MasterDataListState({ loading, totalCount, filteredCount, noun }: { loading: boolean, totalCount: number, filteredCount: number, noun: string }) {
  if (loading) return <p className="muted">Loading {noun}…</p>
  if (totalCount === 0) return <p className="muted">No {noun} have been created yet.</p>
  if (filteredCount === 0) return <p className="muted">No {noun} match the current filters.</p>
  return null
}

type ArchivableRecord = { isArchived?: boolean }

const visibleLoadedCountText = (visibleCount: number, totalCount: number, noun: string) => `Showing ${visibleCount} of ${totalCount} loaded ${noun}.`

export function MasterDataListSummary<T extends ArchivableRecord>({
  loading,
  totalCount,
  filteredItems,
  noun
}: {
  loading: boolean
  totalCount: number
  filteredItems: T[]
  noun: string
}) {
  if (loading || totalCount === 0) return null

  const activeCount = filteredItems.filter((record) => !record.isArchived).length
  const archivedCount = filteredItems.length - activeCount

  return <div className="master-data-summary" aria-live="polite">
    <strong>{visibleLoadedCountText(filteredItems.length, totalCount, noun)}</strong>
    <span>{activeCount} active / {archivedCount} archived visible.</span>
    <span>Counts reflect currently loaded records only.</span>
  </div>
}

export function MasterDataItem({
  title,
  statusArchived,
  meta,
  actions
}: {
  title: string
  statusArchived?: boolean
  meta: Array<string | number | null | undefined | JSX.Element>
  actions: JSX.Element
}) {
  const visibleMeta = meta.filter((value) => value !== null && value !== undefined && value !== '')

  return <li className="master-data-item">
    <div className="master-data-item-main">
      <div className="master-data-title-row">
        <strong className="master-data-title">{title}</strong>
        <span className={`status-pill ${statusArchived ? 'inactive' : 'active'}`}>{archiveStatusLabel(statusArchived)}</span>
      </div>
      <div className="master-data-meta">
        {visibleMeta.map((value, index) => <span key={index}>{value}</span>)}
      </div>
    </div>
    <div className="master-data-actions">{actions}</div>
  </li>
}

export const masterDataRequestErrorMessage = (requestError: unknown, fallback: string) => {
  if (requestError instanceof ApiError) {
    if (requestError.status === 400) return requestError.message
    if (requestError.status === 401 || requestError.status === 403) return 'You do not have permission to manage master data.'
    if (requestError.status === 404) return 'The selected master-data record could not be found. Refresh the list and try again.'
    if (requestError.status >= 500) return 'The server could not complete this master-data request right now.'
  }

  return fallback
}


