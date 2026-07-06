import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobTicketsApi } from '../../../api/jobTicketsApi'
import { masterDataApi } from '../../../api/masterDataApi'
import { reportsApi } from '../../../api/reportsApi'
import { usersApi } from '../../../api/usersApi'
import { useCompanyBranding } from '../../../features/companyBranding/CompanyBrandingContext'
import { csvDataUri } from '../../../utils/csv'
import { downloadReportPdf, type PdfReportColumn } from '../../../utils/reportPdf'
import type {
  AssignableEmployeeDto,
  CustomerDto,
  EquipmentDto,
  JobTicketListItemDto,
  ServiceLocationDto
} from '../../../types'
import { Errorable } from '../common/Errorable'
import {
  type ReportMode,
  type ReportRow,
  type ReportColumn,
  type FilterField,
  type ReportSourceSelections,
  type ReportFiltersByMode,
  type ReportSavedDefaults,
  type ReportFilterLabels,
  defaultFilters,
  reportTitleMap,
  reportDescriptions,
  reportSections,
  reportFilterFields,
  reportBrandName,
  isReportMode,
  readSavedReportDefaults,
  writeSavedReportDefaults,
  clearSavedReportDefaults,
  money,
  quantity,
  hours,
  dateForExport,
  dateUtc,
  getJobStatusLabel,
  getInvoiceStatusLabel,
  columnsByMode,
  userMessageForReportError,
  reportUsesField,
  filtersForMode,
  buildFilterSummary,
  csvFileName,
  reportSlug,
  generatedAtLabel,
  generatedDateStamp,
  reportCsvWithMetadata
} from './reportDefinitions'
export function ReportsPage() {
  const {
    configuration: companyConfiguration,
    logoUrl: companyLogoUrl,
    initials: companyInitials,
    addressLines: companyAddressLines
  } = useCompanyBranding()
  const savedDefaults = useMemo(readSavedReportDefaults, [])
  const [activeScreen, setActiveScreen] = useState<'catalog' | 'results'>('catalog')
  const [filtersByMode, setFiltersByMode] = useState<ReportFiltersByMode>(savedDefaults.filtersByMode ?? {})
  const [sourceSelections, setSourceSelections] = useState<ReportSourceSelections>(savedDefaults.sourceSelections ?? {})
  const [jobTickets, setJobTickets] = useState<JobTicketListItemDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [serviceLocations, setServiceLocations] = useState<ServiceLocationDto[]>([])
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [employees, setEmployees] = useState<AssignableEmployeeDto[]>([])
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [mode, setMode] = useState<ReportMode | null>(null)
  const [loadingMode, setLoadingMode] = useState<ReportMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [generatedFileDate, setGeneratedFileDate] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadReferences = async () => {
      try {
        setReferenceError(null)
        const [jobTicketRows, customerRows, serviceLocationRows, equipmentRows, employeeRows] = await Promise.all([
          jobTicketsApi.listAll(),
          masterDataApi.listCustomers(),
          masterDataApi.listServiceLocations(),
          masterDataApi.listEquipment(),
          usersApi.listAssignableEmployees()
        ])

        if (!isMounted) return
        setJobTickets(jobTicketRows)
        setCustomers(customerRows)
        setServiceLocations(serviceLocationRows)
        setEquipment(equipmentRows)
        setEmployees(employeeRows)
      } catch {
        if (isMounted) {
          setReferenceError('Report selectors could not be loaded. Refresh the page before running source-specific reports.')
        }
      } finally {
        if (isMounted) setReferenceLoading(false)
      }
    }

    loadReferences()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    writeSavedReportDefaults({ filtersByMode, sourceSelections })
  }, [filtersByMode, sourceSelections])

  const activeCustomers = useMemo(() => customers.filter((customer) => !customer.isArchived), [customers])
  const activeServiceLocations = useMemo(() => serviceLocations.filter((location) => !location.isArchived && location.isActive), [serviceLocations])
  const activeEquipment = useMemo(() => equipment.filter((item) => !item.isArchived), [equipment])

  const jobTicketLabelById = useMemo(
    () => new Map(jobTickets.map((job) => [job.id, `${job.ticketNumber} - ${job.title}`])),
    [jobTickets]
  )
  const customerLabelById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name])),
    [customers]
  )
  const equipmentLabelById = useMemo(
    () => new Map(equipment.map((item) => [item.id, item.equipmentNumber ? `${item.name} (${item.equipmentNumber})` : item.name])),
    [equipment]
  )
  const serviceLocationLabelById = useMemo(
    () => new Map(serviceLocations.map((location) => [
      location.id,
      [location.companyName, location.locationName].filter(Boolean).join(' - ')
    ])),
    [serviceLocations]
  )
  const employeeLabelById = useMemo(
    () => new Map(employees.map((employee) => [
      employee.id,
      `${employee.firstName} ${employee.lastName}`.trim()
    ])),
    [employees]
  )

  const clearFilters = () => {
    clearSavedReportDefaults()
    setFiltersByMode({})
    setSourceSelections({})
    setRows([])
    setMode(null)
    setError(null)
    setReportMessage(null)
    setGeneratedAt(null)
    setGeneratedFileDate(null)
    setActiveScreen('catalog')
  }

  const requireSourceId = (message: string) => {
    setRows([])
    setMode(null)
    setError(message)
    setReportMessage(null)
    setGeneratedAt(null)
    setGeneratedFileDate(null)
  }

  const validateScopedFilters = (nextMode: ReportMode) => {
    const scopedFilters = filtersForMode(nextMode, filtersByMode[nextMode] ?? defaultFilters)

    if (scopedFilters.dateFromUtc && scopedFilters.dateToUtc && scopedFilters.dateFromUtc > scopedFilters.dateToUtc) {
      return 'From date must be on or before the to date.'
    }

    if (typeof scopedFilters.offset === 'number' && scopedFilters.offset < 0) {
      return 'Offset must be zero or greater.'
    }

    if (typeof scopedFilters.limit === 'number' && scopedFilters.limit < 1) {
      return 'Limit must be at least 1.'
    }

    return null
  }

  const apply = async (nextMode: ReportMode) => {
    const selectedSourceId = sourceSelections[nextMode]?.trim() ?? ''

    if ((nextMode === 'invoiceReady' || nextMode === 'jobCost') && !selectedSourceId) {
      requireSourceId(`Select a job ticket before running ${reportTitleMap[nextMode]}.`)
      return
    }

    if (nextMode === 'customerHistory' && !selectedSourceId) {
      requireSourceId('Select a customer before running Customer Service History.')
      return
    }

    if (nextMode === 'equipmentHistory' && !selectedSourceId) {
      requireSourceId('Select equipment before running Equipment Service History.')
      return
    }

    const filterValidationError = validateScopedFilters(nextMode)
    if (filterValidationError) {
      setRows([])
      setMode(null)
      setError(filterValidationError)
      setReportMessage(null)
      setGeneratedAt(null)
      setGeneratedFileDate(null)
      setActiveScreen('catalog')
      return
    }

    try {
      setError(null)
      setReportMessage(null)
      setLoadingMode(nextMode)
      setRows([])
      setMode(nextMode)
      setActiveScreen('results')
      setGeneratedAt(null)
      setGeneratedFileDate(null)

      const scopedFilters = filtersForMode(nextMode, filtersByMode[nextMode] ?? defaultFilters)
      const data =
        nextMode === 'invoiceReady'
          ? [await reportsApi.getInvoiceReadySummary(selectedSourceId)]
          : nextMode === 'jobsReady'
            ? await reportsApi.getJobsReadyToInvoice(scopedFilters)
            : nextMode === 'laborJob'
              ? await reportsApi.getLaborByJob(scopedFilters)
              : nextMode === 'laborEmployee'
                ? await reportsApi.getLaborByEmployee(scopedFilters)
                : nextMode === 'partsJob'
                  ? await reportsApi.getPartsByJob(scopedFilters)
                  : nextMode === 'jobCost'
                    ? [await reportsApi.getCostSummary(selectedSourceId)]
                    : nextMode === 'customerHistory'
                      ? await reportsApi.getCustomerHistory(selectedSourceId, scopedFilters)
                      : await reportsApi.getEquipmentHistory(selectedSourceId, scopedFilters)

      setRows(data as ReportRow[])
      setReportMessage(`${reportTitleMap[nextMode]} loaded with ${data.length} visible row${data.length === 1 ? '' : 's'}.`)
      setGeneratedAt(generatedAtLabel())
      setGeneratedFileDate(generatedDateStamp())
    } catch (requestError) {
      setRows([])
      setError(userMessageForReportError(requestError))
      setReportMessage(null)
      setGeneratedAt(null)
      setGeneratedFileDate(null)
    } finally {
      setLoadingMode(null)
    }
  }

  const columns = mode ? columnsByMode[mode] : []
  const title = mode ? reportTitleMap[mode] : ''
  const hasRows = rows.length > 0
  const activeSourceId = mode ? sourceSelections[mode] : undefined
  const sourceLabel = mode === 'invoiceReady' || mode === 'jobCost'
    ? jobTicketLabelById.get(activeSourceId ?? '')
    : mode === 'customerHistory'
      ? customerLabelById.get(activeSourceId ?? '')
      : mode === 'equipmentHistory'
        ? equipmentLabelById.get(activeSourceId ?? '')
        : undefined
  const filterSummary = useMemo(
    () => (mode
      ? buildFilterSummary(mode, filtersForMode(mode, filtersByMode[mode] ?? defaultFilters), {
        customers: customerLabelById,
        serviceLocations: serviceLocationLabelById,
        employees: employeeLabelById
      }, sourceLabel)
      : ''),
    [customerLabelById, employeeLabelById, filtersByMode, mode, serviceLocationLabelById, sourceLabel]
  )
  const companyReportDetails = useMemo(
    () => [
      companyConfiguration.legalName && companyConfiguration.legalName !== companyConfiguration.companyName
        ? companyConfiguration.legalName
        : null,
      companyConfiguration.contactName ? `Contact: ${companyConfiguration.contactName}` : null,
      ...companyAddressLines,
      companyConfiguration.phone,
      companyConfiguration.email,
      companyConfiguration.website
    ].filter((line): line is string => Boolean(line)),
    [companyAddressLines, companyConfiguration.companyName, companyConfiguration.contactName, companyConfiguration.email, companyConfiguration.legalName, companyConfiguration.phone, companyConfiguration.website]
  )
  const csv = useMemo(
    () => reportCsvWithMetadata(
      title,
      generatedAt,
      filterSummary,
      companyConfiguration.companyName,
      companyReportDetails,
      rows,
      columns as Array<ReportColumn<ReportRow>>
    ),
    [columns, companyConfiguration.companyName, companyReportDetails, filterSummary, generatedAt, rows, title]
  )
  const csvHref = useMemo(() => csvDataUri(csv), [csv])

  const updateFilters = (reportMode: ReportMode, nextFilters: Partial<ReportQueryFilters>) => {
    setFiltersByMode((current) => ({
      ...current,
      [reportMode]: { ...(current[reportMode] ?? defaultFilters), ...nextFilters }
    }))
  }

  const updateSourceSelection = (reportMode: ReportMode, value: string) => {
    setSourceSelections((current) => ({ ...current, [reportMode]: value }))
  }

  const downloadPdf = () => {
    if (!mode || !hasRows || !generatedAt) return

    downloadReportPdf<ReportRow>({
      brandName: reportBrandName,
      companyName: companyConfiguration.companyName,
      companyDetails: companyReportDetails,
      title,
      description: reportDescriptions[mode],
      generatedAt,
      filterSummary,
      fileName: `report-${reportSlug(title)}${generatedFileDate ? `-${generatedFileDate}` : ''}.pdf`,
      rows,
      columns: columns as Array<PdfReportColumn<ReportRow>>
    })
  }

  const renderSourceControl = (reportMode: ReportMode) => {
    const titleForMode = reportTitleMap[reportMode]
    const selectedSourceId = sourceSelections[reportMode] ?? ''

    if (reportMode === 'invoiceReady' || reportMode === 'jobCost') {
      return (
        <div className="report-card-controls">
          <label>
            Job ticket
            <select
              aria-label={`${titleForMode} job ticket`}
              value={selectedSourceId}
              onChange={(event) => updateSourceSelection(reportMode, event.target.value)}
              disabled={referenceLoading}
            >
              <option value="">{referenceLoading ? 'Loading job tickets...' : 'Select job ticket'}</option>
              {jobTickets.map((job) => (
                <option key={job.id} value={job.id}>{job.ticketNumber} - {job.title}</option>
              ))}
            </select>
          </label>
          <small className="muted">Required for this single-ticket report.</small>
        </div>
      )
    }

    if (reportMode === 'customerHistory') {
      return (
        <div className="report-card-controls">
          <label>
            Customer
            <select
              aria-label="Customer Service History customer"
              value={selectedSourceId}
              onChange={(event) => updateSourceSelection(reportMode, event.target.value)}
              disabled={referenceLoading}
            >
              <option value="">{referenceLoading ? 'Loading customers...' : 'Select customer'}</option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name}
                </option>
              ))}
            </select>
          </label>
          <small className="muted">Required for this service-history report.</small>
        </div>
      )
    }

    if (reportMode === 'equipmentHistory') {
      return (
        <div className="report-card-controls">
          <label>
            Equipment
            <select
              aria-label="Equipment Service History equipment"
              value={selectedSourceId}
              onChange={(event) => updateSourceSelection(reportMode, event.target.value)}
              disabled={referenceLoading}
            >
              <option value="">{referenceLoading ? 'Loading equipment...' : 'Select equipment'}</option>
              {activeEquipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.equipmentNumber ? `${item.name} (${item.equipmentNumber})` : item.name}
                </option>
              ))}
            </select>
          </label>
          <small className="muted">Required for this service-history report.</small>
        </div>
      )
    }

    return null
  }

  const renderFilterControls = (reportMode: ReportMode) => {
    const fields = reportFilterFields[reportMode]
    if (!fields.length) return null

    const titleForMode = reportTitleMap[reportMode]
    const filters = filtersByMode[reportMode] ?? defaultFilters
    const controls: JSX.Element[] = []

    if (fields.includes('dateRange')) {
      controls.push(
        <label key="dateFrom">
          From date
          <input
            aria-label={`${titleForMode} from date filter`}
            type="date"
            value={filters.dateFromUtc?.slice(0, 10) ?? ''}
            onChange={(event) => updateFilters(reportMode, { dateFromUtc: event.target.value ? `${event.target.value}T00:00:00Z` : undefined })}
          />
        </label>,
        <label key="dateTo">
          To date
          <input
            aria-label={`${titleForMode} to date filter`}
            type="date"
            value={filters.dateToUtc?.slice(0, 10) ?? ''}
            onChange={(event) => updateFilters(reportMode, { dateToUtc: event.target.value ? `${event.target.value}T23:59:59Z` : undefined })}
          />
        </label>
      )
    }

    if (fields.includes('customer')) {
      controls.push(
        <label key="customer">
          Customer
          <select
            aria-label={`${titleForMode} customer filter`}
            value={filters.customerId ?? ''}
            onChange={(event) => updateFilters(reportMode, { customerId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any customer</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('billingParty')) {
      controls.push(
        <label key="billingParty">
          Billing party
          <select
            aria-label={`${titleForMode} billing party filter`}
            value={filters.billingPartyCustomerId ?? ''}
            onChange={(event) => updateFilters(reportMode, { billingPartyCustomerId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any billing party</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.accountNumber ? `${customer.name} (${customer.accountNumber})` : customer.name}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('serviceLocation')) {
      controls.push(
        <label key="serviceLocation">
          Service location
          <select
            aria-label={`${titleForMode} service location filter`}
            value={filters.serviceLocationId ?? ''}
            onChange={(event) => updateFilters(reportMode, { serviceLocationId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any service location</option>
            {activeServiceLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.companyName} - {location.locationName}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('employee')) {
      controls.push(
        <label key="employee">
          Employee
          <select
            aria-label={`${titleForMode} employee filter`}
            value={filters.employeeId ?? ''}
            onChange={(event) => updateFilters(reportMode, { employeeId: event.target.value || undefined })}
            disabled={referenceLoading}
          >
            <option value="">Any employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
            ))}
          </select>
        </label>
      )
    }

    if (fields.includes('jobStatus')) {
      controls.push(
        <label key="jobStatus">
          Job status
          <select
            aria-label={`${titleForMode} job status filter`}
            value={filters.jobStatus ?? ''}
            onChange={(event) => updateFilters(reportMode, { jobStatus: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">Any job status</option>
            <option value="7">Completed</option>
            <option value="9">Invoiced</option>
            <option value="10">Reviewed</option>
          </select>
        </label>
      )
    }

    if (fields.includes('invoiceStatus')) {
      controls.push(
        <label key="invoiceStatus">
          Invoice status
          <select
            aria-label={`${titleForMode} invoice status filter`}
            value={filters.invoiceStatus ?? ''}
            onChange={(event) => updateFilters(reportMode, { invoiceStatus: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">Any invoice status</option>
            <option value="1">Not Ready</option>
            <option value="2">Ready</option>
            <option value="3">Drafted</option>
            <option value="4">Sent</option>
            <option value="5">Paid</option>
            <option value="6">Void</option>
          </select>
        </label>
      )
    }

    if (fields.includes('paging')) {
      controls.push(
        <label key="offset">
          Offset
          <input
            aria-label={`${titleForMode} offset filter`}
            type="number"
            min={0}
            value={filters.offset ?? 0}
            onChange={(event) => updateFilters(reportMode, { offset: Number(event.target.value) || 0 })}
          />
        </label>,
        <label key="limit">
          Limit
          <input
            aria-label={`${titleForMode} limit filter`}
            type="number"
            min={1}
            value={filters.limit ?? 50}
            onChange={(event) => updateFilters(reportMode, { limit: Number(event.target.value) || 50 })}
          />
        </label>
      )
    }

    return (
      <details className="report-filter-details">
        <summary>Show optional filters</summary>
        <div className="report-inline-filters">
          {controls}
        </div>
      </details>
    )
  }

  return (
    <section className="report-hub stack">
      <header className="card stack report-hub-hero">
        <div className="report-hero-layout">
          <div>
            <p className="eyebrow">Reporting</p>
            <h2>Reports</h2>
            <p className="muted">
              Pick the report you need, set its source or optional filters in the same panel, then run it.
            </p>
          </div>
          <div className="row">
            <Link className="button-link secondary-link" to="/manage/wiki#reports">Wiki</Link>
            <button type="button" className="secondary-button" onClick={clearFilters}>Reset report inputs</button>
          </div>
        </div>
        <div className="report-note-panel">
          <strong>Labor totals</strong>
          <span>Run reports from this panel, then export to CSV or PDF after rows load. Labor totals reflect the rate captured at the time each entry was approved.</span>
        </div>
        {referenceLoading ? <p className="muted" role="status">Loading report selectors...</p> : null}
      </header>
      <Errorable error={referenceError} />
      {activeScreen === 'catalog' ? <Errorable error={error} /> : null}

      <section className="card stack report-preview-panel print-report-surface" aria-label="report preview" aria-live="polite" aria-busy={loadingMode !== null} hidden={activeScreen !== 'results'}>
        <div className="report-results-toolbar no-print">
          <div className="report-toolbar-title">
            <h3>{title || 'Report'}</h3>
            <p className="muted">
              {mode
                ? `${rows.length} visible row${rows.length === 1 ? '' : 's'} loaded for review.`
                : 'Run a report from the hub to load export-friendly rows here.'}
            </p>
          </div>
          <div className="row report-result-actions">
            <button type="button" className="secondary-button" onClick={() => setActiveScreen('catalog')}>
              Report catalog
            </button>
            {mode ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => apply(mode)}
                disabled={loadingMode !== null}
                title="Run this report again with the current source and filters."
                aria-label={`Run ${title} again`}
              >
                {loadingMode === mode ? 'Running...' : 'Run again'}
              </button>
            ) : null}
            {hasRows ? (
              <button type="button" className="secondary-button" onClick={() => window.print()}>
                Print
              </button>
            ) : null}
            {hasRows ? (
              <button type="button" className="secondary-button" onClick={downloadPdf}>
                Download PDF
              </button>
            ) : null}
            {hasRows ? (
              <a className="button-link" href={csvHref} download={csvFileName(title, generatedFileDate)}>
                Export CSV
              </a>
            ) : null}
          </div>
        </div>
        {mode ? (
          <div className="report-document-head" aria-label="report header">
            <div className="report-letterhead" aria-label="report company header">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={`${companyConfiguration.companyName} logo`} />
              ) : (
                <span className="product-mark" aria-hidden="true">{companyInitials}</span>
              )}
              <strong>{companyConfiguration.companyName}</strong>
            </div>
            <div className="report-report-heading" aria-label="report summary">
              <h2>{title}</h2>
              <p className="report-print-subtitle">{reportDescriptions[mode]}</p>
              <p className="report-head-meta">
                {[
                  generatedAt ? `Generated ${generatedAt}` : null,
                  `${rows.length} row${rows.length === 1 ? '' : 's'}`,
                  filterSummary || null
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="report-print-full-header no-screen" aria-hidden="true">
              <p className="report-print-brand-eyebrow">{reportBrandName.toUpperCase()}</p>
              <div className="report-print-co-block">
                <strong>{companyConfiguration.companyName}</strong>
                {companyReportDetails.length ? <span>{companyReportDetails.join(' | ')}</span> : null}
              </div>
              <h2 className="report-print-title-block">{title}</h2>
              <p className="report-print-desc-block">{reportDescriptions[mode]}</p>
              <div className="report-print-metrics-row">
                <div><span>Generated</span><strong>{generatedAt ?? 'Pending'}</strong></div>
                <div><span>Rows</span><strong>{rows.length}</strong></div>
                <div><span>Columns</span><strong>{columns.length}</strong></div>
              </div>
              <hr className="report-print-rule" />
              <div className="report-print-scope-block">
                <span>Applied scope</span>
                <strong>{filterSummary}</strong>
              </div>
            </div>
          </div>
        ) : null}
        {mode && hasRows ? (
          <div className="report-print-page-footer no-screen" aria-hidden="true">
            <span>{reportBrandName} · {title}</span>
          </div>
        ) : null}
        {activeScreen === 'results' ? <Errorable error={error} /> : null}
        {loadingMode ? (
          <div className="report-result-state" role="status">
            <strong>Loading {reportTitleMap[loadingMode]}</strong>
            <span>Preparing rows for review and export.</span>
          </div>
        ) : null}
        {mode && !loadingMode && !hasRows && !error ? (
          <div className="report-result-state">
            <strong>No rows found</strong>
            <span>No rows match the current report and filters. Adjust the filters or selected record, then run the report again.</span>
          </div>
        ) : null}
        {hasRows ? (
          <div className="table-scroll report-results-table">
            <table className="report-results-grid" aria-label={`${title} results`}>
              <caption>{title} results table with {rows.length} visible row{rows.length === 1 ? '' : 's'}.</caption>
              <thead>
                <tr>
                  {columns.map((column, columnIndex) => (
                    <th
                      key={column.header}
                      className={[
                        'report-table-cell',
                        columnIndex === 0 ? 'primary-cell' : '',
                        column.align === 'number' ? 'numeric-cell' : 'text-cell'
                      ].filter(Boolean).join(' ')}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((column, columnIndex) => (
                      <td
                        key={column.header}
                        className={[
                          'report-table-cell',
                          columnIndex === 0 ? 'primary-cell' : '',
                          column.align === 'number' ? 'numeric-cell' : 'text-cell'
                        ].filter(Boolean).join(' ')}
                      >
                        {column.render ? column.render(row as never) : column.value(row as never)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="report-catalog stack" role="region" aria-label="report catalog" hidden={activeScreen !== 'catalog'}>
        {reportSections.map((section) => (
          <section className="report-section report-section-panel stack" key={section.title} aria-label={section.title}>
            <div className="report-section-heading">
              <div>
                <h3>{section.title}</h3>
                <p className="muted">{section.description}</p>
              </div>
            </div>
            <div className="report-action-grid">
              {section.modes.map((reportMode) => (
                <article className="report-card report-run-card" key={reportMode} aria-label={`${reportTitleMap[reportMode]} report`} aria-busy={loadingMode === reportMode}>
                  <div className="report-card-top">
                    <h4>{reportTitleMap[reportMode]}</h4>
                    <span>{reportFilterFields[reportMode].length ? 'Optional filters' : 'Choose source'}</span>
                  </div>
                  <div className="report-card-body">
                    <p className="muted">{reportDescriptions[reportMode]}</p>
                    <div className="report-card-inputs">
                      {renderSourceControl(reportMode)}
                      {renderFilterControls(reportMode)}
                    </div>
                  </div>
                  <div className="report-card-footer">
                    <button type="button" onClick={() => apply(reportMode)} disabled={loadingMode !== null}>
                      {loadingMode === reportMode ? 'Loading...' : `Run ${reportTitleMap[reportMode]}`}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}