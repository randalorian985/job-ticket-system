import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { masterDataApi } from '../../api/masterDataApi'
import type { PartCategoryDto, PartDto, VendorDto } from '../../types'

type StockFilter = 'all' | 'out' | 'low' | 'watch' | 'healthy'

type PurchasingRow = {
  categoryName: string
  estimatedReorderCost: number
  recommendedReorderQuantity: number
  status: Exclude<StockFilter, 'all'>
  vendorName: string
} & PartDto

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
})

const quantityFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4
})

function getStockStatus(part: PartDto): Exclude<StockFilter, 'all'> {
  if (part.quantityOnHand <= 0) {
    return 'out'
  }

  if (part.quantityOnHand < part.reorderThreshold) {
    return 'low'
  }

  if (part.quantityOnHand === part.reorderThreshold) {
    return 'watch'
  }

  return 'healthy'
}

function getStatusLabel(status: Exclude<StockFilter, 'all'>) {
  switch (status) {
    case 'out':
      return 'Out of stock'
    case 'low':
      return 'Below reorder threshold'
    case 'watch':
      return 'At reorder threshold'
    default:
      return 'Healthy'
  }
}

function normalizeSearchValue(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function escapeCsvValue(value: string | number) {
  const text = String(value)
  return `"${text.split('"').join('""')}"`
}

export function PurchasingWorkbenchPage() {
  const [categories, setCategories] = useState<PartCategoryDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [parts, setParts] = useState<PartDto[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<StockFilter>('all')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [vendors, setVendors] = useState<VendorDto[]>([])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      masterDataApi.listParts(),
      masterDataApi.listVendors(),
      masterDataApi.listPartCategories()
    ])
      .then(([partList, vendorList, categoryList]) => {
        setParts(partList)
        setVendors(vendorList)
        setCategories(categoryList)
        setError(null)
      })
      .catch(() => setError('Unable to load purchasing workbench data.'))
      .finally(() => setIsLoading(false))
  }, [])

  const activeCategories = useMemo(() => categories.filter((item) => !item.isArchived), [categories])
  const activeParts = useMemo(() => parts.filter((item) => !item.isArchived), [parts])
  const activeVendors = useMemo(() => vendors.filter((item) => !item.isArchived), [vendors])

  const rows = useMemo<PurchasingRow[]>(() => {
    const categoryNameById = new Map(activeCategories.map((item) => [item.id, item.name]))
    const vendorNameById = new Map(activeVendors.map((item) => [item.id, item.name]))

    return activeParts.map((part) => {
      const status = getStockStatus(part)
      const recommendedReorderQuantity = Math.max(part.reorderThreshold - part.quantityOnHand, 0)

      return {
        ...part,
        categoryName: categoryNameById.get(part.partCategoryId) ?? 'Uncategorized',
        estimatedReorderCost: recommendedReorderQuantity * part.unitCost,
        recommendedReorderQuantity,
        status,
        vendorName: part.vendorId ? (vendorNameById.get(part.vendorId) ?? 'Unknown vendor') : 'No vendor assigned'
      }
    })
  }, [activeCategories, activeParts, activeVendors])

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (selectedVendorId && row.vendorId !== selectedVendorId) {
        return false
      }

      if (selectedCategoryId && row.partCategoryId !== selectedCategoryId) {
        return false
      }

      if (selectedStatus !== 'all' && row.status !== selectedStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        row.partNumber,
        row.name,
        row.description,
        row.vendorName,
        row.categoryName,
        getStatusLabel(row.status)
      ].some((value) => normalizeSearchValue(value).includes(normalizedSearch))
    })
  }, [rows, search, selectedCategoryId, selectedStatus, selectedVendorId])

  const summary = useMemo(() => {
    const queue = rows.filter((row) => row.status === 'out' || row.status === 'low')
    return {
      healthyCount: rows.filter((row) => row.status === 'healthy').length,
      lowCount: rows.filter((row) => row.status === 'low').length,
      outCount: rows.filter((row) => row.status === 'out').length,
      queuedEstimatedCost: queue.reduce((sum, row) => sum + row.estimatedReorderCost, 0),
      queuedReorderCount: queue.length,
      watchCount: rows.filter((row) => row.status === 'watch').length
    }
  }, [rows])

  const exportCsv = () => {
    const header = ['Part Number', 'Part Name', 'Vendor', 'Category', 'Status', 'On Hand', 'Reorder Threshold', 'Recommended Reorder Qty', 'Unit Cost', 'Estimated Reorder Cost']
    const lines = [header.map(escapeCsvValue).join(',')]

    for (const row of filteredRows) {
      lines.push([
        row.partNumber,
        row.name,
        row.vendorName,
        row.categoryName,
        getStatusLabel(row.status),
        row.quantityOnHand,
        row.reorderThreshold,
        row.recommendedReorderQuantity,
        row.unitCost,
        row.estimatedReorderCost
      ].map(escapeCsvValue).join(','))
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = 'purchasing-workbench.csv'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
  }

  return (
    <section className="stack">
      <div className="card stack">
        <div>
          <h2>Purchasing Workbench</h2>
          <p className="muted">
            Manager/Admin visibility into reorder-ready parts using existing master-data cost, vendor, and stock fields.
            This slice does not add purchase orders, receiving, vendor invoice tracking, or advanced inventory transactions yet.
          </p>
        </div>

        <div className="row" aria-label="purchasing summary">
          <div>
            <strong>{summary.queuedReorderCount}</strong>
            <p className="muted">Reorder-ready parts</p>
          </div>
          <div>
            <strong>{summary.outCount}</strong>
            <p className="muted">Out of stock</p>
          </div>
          <div>
            <strong>{summary.lowCount}</strong>
            <p className="muted">Below threshold</p>
          </div>
          <div>
            <strong>{summary.watchCount}</strong>
            <p className="muted">At threshold</p>
          </div>
          <div>
            <strong>{currencyFormatter.format(summary.queuedEstimatedCost)}</strong>
            <p className="muted">Estimated reorder spend</p>
          </div>
        </div>

        <div className="row" aria-label="purchasing filters">
          <label>
            Search
            <input
              aria-label="Search parts"
              placeholder="Part, vendor, category, or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Vendor
            <select aria-label="Vendor" value={selectedVendorId} onChange={(event) => setSelectedVendorId(event.target.value)}>
              <option value="">All vendors</option>
              {activeVendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select aria-label="Category" value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
              <option value="">All categories</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            Stock status
            <select aria-label="Stock status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as StockFilter)}>
              <option value="all">All statuses</option>
              <option value="out">Out of stock</option>
              <option value="low">Below threshold</option>
              <option value="watch">At threshold</option>
              <option value="healthy">Healthy</option>
            </select>
          </label>
        </div>

        <div className="inline-links">
          <button type="button" onClick={exportCsv} disabled={!filteredRows.length}>Export CSV</button>
          <Link to="/manage/parts">Open parts master data</Link>
        </div>
      </div>

      {isLoading ? <p className="muted" role="status">Loading purchasing workbench…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <article className="card stack">
        <h3>Reorder candidates and stock watch</h3>
        {filteredRows.length ? (
          <ul className="stack">
            {filteredRows.map((row) => (
              <li key={row.id} className="card stack">
                <div>
                  <strong>{row.partNumber} · {row.name}</strong>
                  <p className="muted">{row.vendorName} · {row.categoryName} · {getStatusLabel(row.status)}</p>
                </div>
                <div className="row">
                  <span>On hand: {quantityFormatter.format(row.quantityOnHand)}</span>
                  <span>Threshold: {quantityFormatter.format(row.reorderThreshold)}</span>
                  <span>Recommended reorder: {quantityFormatter.format(row.recommendedReorderQuantity)}</span>
                </div>
                <div className="row">
                  <span>Unit cost: {currencyFormatter.format(row.unitCost)}</span>
                  <span>Unit price: {currencyFormatter.format(row.unitPrice)}</span>
                  <span>Estimated reorder cost: {currencyFormatter.format(row.estimatedReorderCost)}</span>
                </div>
                {row.description ? <p>{row.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No parts match the current purchasing filters.</p>
        )}
      </article>

      <article className="card stack">
        <h3>Current limits</h3>
        <p className="muted">
          This first purchasing slice is a workbench over existing part master data only. Purchase orders, receiving, vendor invoice matching,
          landed cost, truck or warehouse inventory transactions, and automatic replenishment stay out of scope for this PR.
        </p>
        <p className="muted">Healthy parts currently tracked: {summary.healthyCount}</p>
      </article>
    </section>
  )
}
