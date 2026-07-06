import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { masterDataApi } from '../../api/masterDataApi'
import { reportsApi } from '../../api/reportsApi'
import type {
  EquipmentDto,
  EquipmentPartsHistoryItemDto,
  ReportServiceHistoryItemDto,
} from '../../types'
import { getJobTicketStatusLabel } from '../employee/jobDisplay'
import { formatDate } from './managerDisplay'

type HistoryTab = 'service' | 'parts'

export function EquipmentHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const [equipment, setEquipment] = useState<EquipmentDto | null>(null)
  const [serviceHistory, setServiceHistory] = useState<ReportServiceHistoryItemDto[]>([])
  const [partsHistory, setPartsHistory] = useState<EquipmentPartsHistoryItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<HistoryTab>('service')

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    Promise.all([
      masterDataApi.getEquipment(id),
      reportsApi.getEquipmentHistory(id, { offset: 0, limit: 100 }),
      masterDataApi.getEquipmentPartsHistory(id),
    ])
      .then(([equipmentRes, serviceRes, partsRes]) => {
        setEquipment(equipmentRes)
        setServiceHistory(serviceRes)
        setPartsHistory(partsRes)
        setError(null)
      })
      .catch(() => setError('Unable to load equipment history.'))
      .finally(() => setIsLoading(false))
  }, [id])

  const equipmentLabel = equipment?.name ?? 'Equipment History'
  const modelLine = [equipment?.manufacturer, equipment?.modelNumber].filter(Boolean).join(' ')

  return (
    <section className="stack">
      <nav className="breadcrumb-line" aria-label="Breadcrumb">
        <Link to="/manage">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <Link to="/manage/equipment">Equipment</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{equipmentLabel} — History</span>
      </nav>

      <div className="card stack">
        <h2>{equipmentLabel}</h2>
        {equipment && (
          <div className="fact-grid" aria-label="equipment details">
            {equipment.equipmentType && (
              <div><span>Type</span><strong>{equipment.equipmentType}</strong></div>
            )}
            {modelLine && (
              <div><span>Make / Model</span><strong>{modelLine}</strong></div>
            )}
            {equipment.year && (
              <div><span>Year</span><strong>{equipment.year}</strong></div>
            )}
            {equipment.unitNumber && (
              <div><span>Unit #</span><strong>{equipment.unitNumber}</strong></div>
            )}
            {equipment.serialNumber && (
              <div><span>Serial #</span><strong>{equipment.serialNumber}</strong></div>
            )}
            {equipment.equipmentNumber && (
              <div><span>Equipment #</span><strong>{equipment.equipmentNumber}</strong></div>
            )}
          </div>
        )}
        <div className="row">
          <Link to={`/manage/equipment`} className="secondary-button">Back to Equipment</Link>
        </div>
      </div>

      {isLoading && <p className="muted" role="status">Loading equipment history…</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {!isLoading && !error && (
        <>
          <div className="tab-bar" role="tablist" aria-label="Equipment history tabs">
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'service'}
              className={activeTab === 'service' ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveTab('service')}
            >
              Service History ({serviceHistory.length})
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'parts'}
              className={activeTab === 'parts' ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveTab('parts')}
            >
              Parts Used ({partsHistory.length})
            </button>
          </div>

          {activeTab === 'service' && (
            <section aria-label="service history" className="stack">
              {serviceHistory.length === 0 ? (
                <p className="muted">No service tickets found for this equipment.</p>
              ) : (
                <ul className="master-data-list compact-master-list">
                  {serviceHistory.map((item) => (
                    <li key={item.jobTicketId} className="master-data-item compact-master-list-item">
                      <div className="compact-list-primary">
                        <div className="master-data-title-row">
                          <strong className="master-data-title">
                            <Link to={`/manage/job-tickets/${item.jobTicketId}`}>
                              {item.jobTicketNumber} — {item.title}
                            </Link>
                          </strong>
                          <span className="status-pill">{getJobTicketStatusLabel(item.jobStatus)}</span>
                        </div>
                        <span className="compact-list-subtext">{item.customer}</span>
                      </div>
                      <div className="compact-list-meta">
                        <span className="muted">Created {formatDate(item.createdAtUtc)}</span>
                        {item.completedAtUtc && (
                          <span className="muted">Completed {formatDate(item.completedAtUtc)}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeTab === 'parts' && (
            <section aria-label="parts history" className="stack">
              {partsHistory.length === 0 ? (
                <p className="muted">No parts usage records found for this equipment.</p>
              ) : (
                <ul className="master-data-list compact-master-list">
                  {partsHistory.map((item, index) => (
                    <li key={`${item.jobTicketId}-${item.partNumber}-${index}`} className="master-data-item compact-master-list-item">
                      <div className="compact-list-primary">
                        <div className="master-data-title-row">
                          <strong className="master-data-title">{item.partNumber} — {item.partName}</strong>
                          <span className={`status-pill ${item.approvalStatus === 'Approved' ? 'active' : ''}`}>
                            {item.approvalStatus}
                          </span>
                        </div>
                        <span className="compact-list-subtext">
                          <Link to={`/manage/job-tickets/${item.jobTicketId}`}>
                            {item.jobTicketNumber} — {item.jobTicketTitle}
                          </Link>
                        </span>
                      </div>
                      <div className="compact-list-meta">
                        <span className="muted">Qty {item.quantity}</span>
                        {item.vendorName && <span className="muted">{item.vendorName}</span>}
                        <span className="muted">
                          {item.installedAtUtc
                            ? `Installed ${formatDate(item.installedAtUtc)}`
                            : `Added ${formatDate(item.addedAtUtc)}`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </section>
  )
}
