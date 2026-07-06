import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { filesApi } from '../../api/filesApi'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { partRequestsApi } from '../../api/partRequestsApi'
import { partsApi } from '../../api/partsApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketDto, JobTicketFileDto, JobTicketPartDto, JobWorkEntryDto, PartLookupDto, TimeEntryDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel, getWorkLocationTypeLabel } from './jobDisplay'

const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const activeFieldWorkStatuses = new Set([2, 3, 4, 5, 6])

const formatOptionalDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : 'Not set')
const displayRelatedName = (value: string | null | undefined, unavailableLabel: string) =>
  value?.trim() || unavailableLabel
const getPartUsedDisplay = (part: JobTicketPartDto) => {
  if (part.isUnlistedPart) {
    return part.partName?.trim() || part.notes?.trim() || 'Part request'
  }

  if (part.partNumber && part.partName) {
    return `${part.partNumber} - ${part.partName}`
  }

  return part.partName || part.partNumber || 'Unnamed part'
}

const getPartApprovalLabel = (status: number) => {
  switch (status) {
    case 2:
      return 'Approved'
    case 3:
      return 'Rejected'
    default:
      return 'Pending review'
  }
}

const getPartRequestContext = (part: JobTicketPartDto) => {
  const statusLabel = getPartApprovalLabel(part.approvalStatus)
  if (part.officeOrderRequested) {
    return `Needs ordered - ${statusLabel}`
  }

  return `Added to ticket - ${statusLabel}`
}

export function JobDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [job, setJob] = useState<JobTicketDto | null>(null)
  const [workEntries, setWorkEntries] = useState<JobWorkEntryDto[]>([])
  const [partsUsed, setPartsUsed] = useState<JobTicketPartDto[]>([])
  const [partLookupItems, setPartLookupItems] = useState<PartLookupDto[]>([])
  const [files, setFiles] = useState<JobTicketFileDto[]>([])
  const [openEntry, setOpenEntry] = useState<TimeEntryDto | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [workNote, setWorkNote] = useState('')
  const [partRequestDescription, setPartRequestDescription] = useState('')
  const [selectedPartId, setSelectedPartId] = useState('')
  const [partNeedsOrdered, setPartNeedsOrdered] = useState(true)
  const [partRequestQuantity, setPartRequestQuantity] = useState('1')
  const [partRequestNotes, setPartRequestNotes] = useState('')
  const [partRequestUrgency, setPartRequestUrgency] = useState('')
  const [partRequestNeededBy, setPartRequestNeededBy] = useState('')
  const [clockWorkSummary, setClockWorkSummary] = useState('')
  const [clockNote, setClockNote] = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [isSavingWork, setIsSavingWork] = useState(false)
  const [isSubmittingPartRequest, setIsSubmittingPartRequest] = useState(false)
  const [isClocking, setIsClocking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Restore part form from localStorage on mount
  useEffect(() => {
    const partFormKey = `part-form-${jobTicketId}`
    const savedForm = localStorage.getItem(partFormKey)
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm)
        setPartRequestDescription(parsed.description || '')
        setPartRequestQuantity(parsed.quantity || '1')
        setPartRequestNotes(parsed.notes || '')
        setPartNeedsOrdered(parsed.needsOrdered ?? true)
        setPartRequestUrgency(parsed.urgency || '')
        setPartRequestNeededBy(parsed.neededBy || '')
      } catch {
        // Ignore parse errors
      }
    }
  }, [jobTicketId])

  // Persist part form to localStorage whenever it changes
  useEffect(() => {
    const partFormKey = `part-form-${jobTicketId}`
    const formState = {
      description: partRequestDescription,
      quantity: partRequestQuantity,
      notes: partRequestNotes,
      needsOrdered: partNeedsOrdered,
      urgency: partRequestUrgency,
      neededBy: partRequestNeededBy
    }
    localStorage.setItem(partFormKey, JSON.stringify(formState))
  }, [jobTicketId, partRequestDescription, partRequestQuantity, partRequestNotes, partNeedsOrdered, partRequestUrgency, partRequestNeededBy])

  const selectedPart = useMemo(
    () => partLookupItems.find((part) => part.id === selectedPartId) ?? null,
    [partLookupItems, selectedPartId]
  )

  const partLookupMatches = useMemo(() => {
    const search = partRequestDescription.trim().toLowerCase()
    if (!search) {
      return partLookupItems.slice(0, 8)
    }

    return partLookupItems
      .filter((part) => {
        const searchable = `${part.partNumber} ${part.name} ${part.description ?? ''}`.toLowerCase()
        return searchable.includes(search)
      })
      .slice(0, 8)
  }, [partLookupItems, partRequestDescription])

  const onPartRequestDescriptionChange = (value: string) => {
    setPartRequestDescription(value)
    if (selectedPartId) {
      setSelectedPartId('')
    }
  }

  const employeeJobReadiness = useMemo(() => {
    const hasJobInstructions = Boolean(job?.description?.trim() || job?.customerFacingNotes?.trim())
    const isActiveFieldWork = Boolean(job && activeFieldWorkStatuses.has(job.status))
    const checks = [
      {
        label: 'Ticket availability',
        isReady: isActiveFieldWork,
        detail: isActiveFieldWork
          ? 'Ticket is available for field work.'
          : 'Ticket is no longer available for field work.'
      },
      {
        label: 'Scheduled start',
        isReady: Boolean(job?.scheduledStartAtUtc),
        detail: job?.scheduledStartAtUtc
          ? `Scheduled start: ${formatOptionalDateTime(job.scheduledStartAtUtc)}`
          : 'No scheduled start is set.'
      },
      {
        label: 'Due date',
        isReady: Boolean(job?.dueAtUtc),
        detail: job?.dueAtUtc ? `Due date: ${formatOptionalDateTime(job.dueAtUtc)}` : 'No due date is set.'
      },
      {
        label: 'Customer',
        isReady: Boolean(job?.customerId),
        detail: job?.customerId
          ? `Customer: ${displayRelatedName(job.customerName, 'Customer details unavailable')}`
          : 'Customer is not selected.'
      },
      {
        label: 'Service location',
        isReady: Boolean(job?.serviceLocationId),
        detail: job?.serviceLocationId
          ? `Service location: ${displayRelatedName(job.serviceLocationName, 'Location details unavailable')}`
          : 'Service location is not selected.'
      },
      {
        label: 'Equipment being serviced',
        isReady: Boolean(job),
        detail: job?.equipmentId
          ? `Equipment being serviced: ${displayRelatedName(job.equipmentName, 'Equipment details unavailable')}`
          : 'No equipment record is listed. Check the job instructions for the component or part being serviced.'
      },
      {
        label: 'Job instructions',
        isReady: hasJobInstructions,
        detail: hasJobInstructions ? 'Job instructions are available.' : 'No job instructions are available yet.'
      }
    ]
    const warnings = checks.filter((check) => !check.isReady).map((check) => check.detail)

    return {
      checks,
      readyCount: checks.length - warnings.length,
      warnings,
      statusLabel: !isActiveFieldWork
        ? 'Not active field work'
        : warnings.length ? 'Needs manager review' : 'Ready to start work',
      nextRequiredUpdate: warnings[0] ?? 'This ticket has the information needed to start work.',
      guidance: warnings.length
        ? 'Review the open job requirements with a manager before starting work.'
        : 'The job requirements are complete for assigned work.'
    }
  }, [job])
  const isClockedIntoThisJob = Boolean(openEntry && openEntry.jobTicketId === jobTicketId)
  const isClockedIntoAnotherJob = Boolean(openEntry && openEntry.jobTicketId !== jobTicketId)
  const fieldRecordGateMessage = isClockedIntoAnotherJob
    ? 'You are clocked into another job. Open that ticket or clock out before recording field work here.'
    : 'Clock in to this ticket before adding work notes, parts, or photos.'
  const canUseActiveJobTools = isClockedIntoThisJob
  const nextActionTitle = isClockedIntoAnotherJob
    ? 'Finish the active ticket first'
    : isClockedIntoThisJob
      ? 'Capture one field update at a time'
      : employeeJobReadiness.warnings.length
        ? 'Review setup before clock-in'
        : 'Clock in when you are ready to work'
  const nextActionBody = isClockedIntoAnotherJob
    ? 'This ticket stays locked so notes, parts, and photos do not land on the wrong time entry.'
    : isClockedIntoThisJob
      ? 'Use one shortcut, save the update, then return here for the next step. These tools are tied to this ticket and time entry.'
      : employeeJobReadiness.warnings.length
        ? 'The ticket can still be opened, but the missing setup items should be reviewed with a Manager/Admin before starting work.'
        : 'Clock in first. Notes, parts, and photos appear after this ticket is the active time entry.'

  const refreshDetails = async () => {
    if (!jobTicketId || !user) {
      return
    }

    const [jobResponse, entriesResponse, partsResponse, filesResponse, partLookupResponse] = await Promise.all([
      jobTicketsApi.get(jobTicketId),
      jobTicketsApi.listWorkEntries(jobTicketId),
      jobTicketsApi.listParts(jobTicketId),
      filesApi.list(jobTicketId),
      partsApi.list()
    ])

    setJob(jobResponse)
    setWorkEntries(entriesResponse)
    setPartsUsed(partsResponse)
    setFiles(filesResponse)
    setPartLookupItems(partLookupResponse)

    try {
      setOpenEntry(await timeEntriesApi.getOpen(user.employeeId))
    } catch (openError) {
      if (openError instanceof ApiError && openError.status === 404) {
        setOpenEntry(null)
      } else {
        throw openError
      }
    }
  }

  const handleRefreshError = (requestError: unknown, fallbackMessage: string, preferFallbackMessage = false) => {
    if (requestError instanceof ApiError) {
      if (requestError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }

      if (requestError.status === 403) {
        setError('Access denied. You can only view jobs assigned to you.')
        return
      }

      setError(preferFallbackMessage ? fallbackMessage : requestError.message)
      return
    }

    setError(fallbackMessage)
  }

  const refreshAfterAction = async (successContext: string) => {
    try {
      await refreshDetails()
    } catch (requestError) {
      handleRefreshError(
        requestError,
        `${successContext}, but refreshed job details could not be loaded. Refresh this page before continuing.`,
        true
      )
    }
  }

  useEffect(() => {
    if (!jobTicketId || !user) {
      return
    }

    let isMounted = true

    refreshDetails()
      .catch((requestError) => handleRefreshError(requestError, 'Unable to load job details.'))
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [jobTicketId, user, navigate, logout])

  const getLocation = (): Promise<GeolocationPosition | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      // First attempt: high accuracy
      navigator.geolocation.getCurrentPosition(
        resolve,
        () => {
          // Second attempt: low accuracy fallback (faster, works indoors)
          navigator.geolocation.getCurrentPosition(
            resolve,
            () => resolve(null), // GPS fully unavailable — proceed without coords
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
          )
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      )
    })

  const onClockIn = async () => {
    if (!jobTicketId || !user) {
      return
    }

    setIsClocking(true)
    setError(null)

    try {
      const position = await getLocation()
      await timeEntriesApi.clockIn({
        jobTicketId,
        employeeId: user.employeeId,
        clockInLatitude: position?.coords.latitude,
        clockInLongitude: position?.coords.longitude,
        clockInAccuracy: position?.coords.accuracy,
        deviceMetadata: navigator.userAgent,
        note: clockNote || null
      })
      setClockNote('')
      await refreshAfterAction(position ? 'Clock-in saved' : 'Clock-in saved (no GPS signal)')
    } catch (clockError) {
      if (clockError instanceof ApiError) {
        setError(clockError.message)
      } else if (clockError instanceof Error) {
        setError(clockError.message)
      } else {
        setError('Unable to clock in. Try again.')
      }
    } finally {
      setIsClocking(false)
    }
  }

  const onClockOut = async () => {
    if (!user) {
      return
    }

    if (!isClockedIntoThisJob || !openEntry) {
      setError(isClockedIntoAnotherJob ? 'Open the active job ticket to clock out.' : 'Clock in to this ticket before clocking out.')
      return
    }

    if (!clockWorkSummary.trim()) {
      setError('Work summary is required for clock out.')
      return
    }

    setIsClocking(true)
    setError(null)

    try {
      const position = await getLocation()
      await timeEntriesApi.clockOut({
        timeEntryId: openEntry.id,
        employeeId: user.employeeId,
        clockOutLatitude: position?.coords.latitude,
        clockOutLongitude: position?.coords.longitude,
        clockOutAccuracy: position?.coords.accuracy,
        workSummary: clockWorkSummary,
        note: clockNote || null
      })
      setClockWorkSummary('')
      setClockNote('')
      await refreshAfterAction(position ? 'Clock-out saved' : 'Clock-out saved (no GPS signal)')
    } catch (clockError) {
      if (clockError instanceof ApiError) {
        setError(clockError.message)
      } else if (clockError instanceof Error) {
        setError(clockError.message)
      } else {
        setError('Unable to clock out. Try again.')
      }
    } finally {
      setIsClocking(false)
    }
  }

  const onAddWorkNote = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !workNote.trim()) {
      return
    }

    if (!isClockedIntoThisJob) {
      setError(fieldRecordGateMessage)
      return
    }

    setIsSavingWork(true)
    setError(null)
    try {
      await jobTicketsApi.addWorkEntry(jobTicketId, {
        employeeId: user?.employeeId,
        entryType: 1,
        notes: workNote,
        performedAtUtc: null
      })
      setWorkNote('')
      await refreshAfterAction('Work note saved')
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to save work note.')
    } finally {
      setIsSavingWork(false)
    }
  }

  const onSubmitPartRequest = async (event: FormEvent) => {
    event.preventDefault()
    const partDescription = selectedPart?.name ?? partRequestDescription.trim()
    const quantity = Number(partRequestQuantity)

    if (!isClockedIntoThisJob) {
      setError(fieldRecordGateMessage)
      return
    }

    if (!jobTicketId || !partDescription) {
      setError('Select an existing part or enter a new part name or description.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    // Check for duplicate parts already added
    const isDuplicate = partsUsed.some((part) => {
      if (selectedPart) {
        return part.partId === selectedPart.id && !part.isUnlistedPart
      }
      return part.isUnlistedPart && part.partName?.toLowerCase() === partDescription.toLowerCase()
    })

    if (isDuplicate) {
      setError(`This part ("${partDescription}") has already been added to this ticket. You can add it again if needed, but double-check that this is intentional.`)
      return
    }

    setIsSubmittingPartRequest(true)
    setError(null)
    try {
      await partRequestsApi.createForJobTicket(jobTicketId, {
        partDescription,
        partId: selectedPart?.id ?? null,
        needsOrdered: partNeedsOrdered,
        quantity,
        notes: partRequestNotes || null,
        urgency: partNeedsOrdered ? partRequestUrgency || null : null,
        neededByUtc: partNeedsOrdered && partRequestNeededBy ? new Date(partRequestNeededBy).toISOString() : null
      })
      setPartRequestDescription('')
      setSelectedPartId('')
      setPartNeedsOrdered(true)
      setPartRequestQuantity('1')
      setPartRequestNotes('')
      setPartRequestUrgency('')
      setPartRequestNeededBy('')
      localStorage.removeItem(`part-form-${jobTicketId}`)
      await refreshAfterAction('Part entry saved')
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to add or request part.')
    } finally {
      setIsSubmittingPartRequest(false)
    }
  }

  const onUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !uploadFile) {
      return
    }

    if (!isClockedIntoThisJob) {
      setError(fieldRecordGateMessage)
      return
    }

    if (!allowedFileTypes.includes(uploadFile.type)) {
      setError('Unsupported file type. Allowed: jpg, jpeg, png, webp, pdf.')
      return
    }

    const formData = new FormData()
    formData.append('File', uploadFile)
    formData.append('Caption', uploadCaption)
    formData.append('IsInvoiceAttachment', 'false')

    setIsUploading(true)
    setError(null)
    try {
      await filesApi.upload(jobTicketId, formData)
      setUploadFile(null)
      setUploadCaption('')
      await refreshAfterAction('Photo/file uploaded')
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : 'Unable to upload file.')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return <main className="mobile-shell">Loading job details...</main>
  }

  if (!job) {
    return (
      <main className="mobile-shell">
        <p>Job not found.</p>
        <Link to="/jobs">Back to My Jobs</Link>
      </main>
    )
  }

  return (
    <main className="mobile-shell employee-shell employee-detail-page">
      <p>
        <Link to="/jobs">Back to My Jobs</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}

      <section className="card employee-job-overview-card">
        <div className="employee-job-heading">
          <div>
            <h1>{job.ticketNumber}</h1>
            <p className="employee-job-title">{job.title}</p>
          </div>
          <span className="status-pill">{getJobTicketStatusLabel(job.status)}</span>
        </div>
        <div className="employee-job-context">
          <div><span>Customer</span><strong>{displayRelatedName(job.customerName, 'Customer unavailable')}</strong></div>
          <div><span>Service location</span><strong>{displayRelatedName(job.serviceLocationName, 'Service location unavailable')}</strong></div>
          <div><span>Equipment Being Serviced</span><strong>{job.equipmentId ? displayRelatedName(job.equipmentName, 'Equipment unavailable') : 'See job instructions'}</strong></div>
          <div><span>Priority</span><strong>{getJobTicketPriorityLabel(job.priority)}</strong></div>
          <div><span>Work Location</span><strong>{getWorkLocationTypeLabel(job.locationType || 1)}</strong></div>
        </div>
        <p className="employee-job-description">{job.description ?? 'No description provided.'}</p>
      </section>

      <section className="card stack employee-readiness-card" aria-label="job readiness review">
        <h2>Before You Start</h2>
        <div className="review-grid">
          <div>
            <span className="muted">Work Status</span>
            <strong>{employeeJobReadiness.statusLabel}</strong>
          </div>
          <div>
            <span className="muted">Requirements Ready</span>
            <strong>{employeeJobReadiness.readyCount} / {employeeJobReadiness.checks.length}</strong>
          </div>
          <div>
            <span className="muted">Open Requirements</span>
            <strong>{employeeJobReadiness.warnings.length}</strong>
          </div>
          <div>
            <span className="muted">Next Required Update</span>
            <strong>{employeeJobReadiness.nextRequiredUpdate}</strong>
          </div>
        </div>
        <p className="muted">{employeeJobReadiness.guidance}</p>
        {employeeJobReadiness.warnings.length ? (
          <ul className="muted check-list" aria-label="open job requirements">
            {employeeJobReadiness.warnings.map((warning) => (
              <li key={warning} className="check-item-open">{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="success">Ready for field work.</p>
        )}
      </section>

      <section className={`card stack employee-next-action-card ${isClockedIntoThisJob ? 'is-active' : 'is-locked'}`} aria-label="next job action">
        <div>
          <p className="employee-eyebrow">Next action</p>
          <h2>{nextActionTitle}</h2>
          <p className="muted">{nextActionBody}</p>
        </div>
        {isClockedIntoThisJob ? (
          <div className="employee-action-strip" aria-label="active job shortcuts">
            <a className="button-link" href="#work-note-panel">Add Note</a>
            <a className="button-link" href="#part-request-panel">Add Part</a>
            <a className="button-link" href="#photo-upload-panel">Upload Photo</a>
            <a className="button-link secondary-link" href="#clock-card">Clock Out</a>
          </div>
        ) : isClockedIntoAnotherJob ? (
          <Link className="button-link" to={`/jobs/${openEntry?.jobTicketId}`}>Go to Active Ticket</Link>
        ) : (
          <a className="button-link" href="#clock-card">Clock In</a>
        )}
      </section>

      <section id="clock-card" className="card stack employee-clock-card">
        <h2>{isClockedIntoThisJob ? 'Active Job Time' : 'Clock In to Start Job'}</h2>
        <p className="muted">
          Open entry: {openEntry
            ? isClockedIntoThisJob
              ? `Started ${new Date(openEntry.startedAtUtc).toLocaleString()} for this ticket`
              : `Started ${new Date(openEntry.startedAtUtc).toLocaleString()} on another ticket`
            : 'No open entry'}
        </p>
        <p className="muted">
          {employeeJobReadiness.warnings.length
            ? 'Job setup needs manager review before starting new work.'
            : isClockedIntoThisJob ? 'Job setup is ready for active work.' : 'Job setup is ready for clock-in.'}
        </p>
        {isClockedIntoAnotherJob ? (
          <p className="warning">
            ⏱ You are clocked into another ticket. The system enforces one active time entry per tech to keep all your field notes, parts, and photos on the correct ticket. <Link to={`/jobs/${openEntry?.jobTicketId}`}>Open active ticket</Link> to clock out before starting this one.
          </p>
        ) : null}

        <label>
          Clock note (optional)
          <input
            value={clockNote}
            onChange={(event) => setClockNote(event.target.value)}
            disabled={isClockedIntoAnotherJob}
          />
        </label>

        {isClockedIntoThisJob ? (
          <>
            <label>
              Work summary (required)
              <textarea
                aria-describedby="clock-work-summary-help"
                value={clockWorkSummary}
                onChange={(event) => setClockWorkSummary(event.target.value)}
                required
              />
            </label>
            <p id="clock-work-summary-help" className="field-help">Summarize the work completed before clocking out.</p>
            <button onClick={onClockOut} disabled={isClocking}>
              {isClocking ? 'Clocking out...' : 'Clock Out with GPS'}
            </button>
          </>
        ) : (
          <button onClick={onClockIn} disabled={isClocking || isClockedIntoAnotherJob}>
            {isClocking ? 'Clocking in...' : 'Clock In with GPS'}
          </button>
        )}
      </section>

      {!canUseActiveJobTools ? (
        <section className="card stack employee-field-tools-gate" aria-label="field tools locked">
          <h2>Clock in to add notes, parts, and photos</h2>
          <p className="muted">{fieldRecordGateMessage}</p>
          <p className="muted">The active job tools appear here after clock-in so field updates stay tied to the correct ticket and time entry.</p>
        </section>
      ) : null}

      {canUseActiveJobTools ? (
        <section className="employee-active-job-tools stack" aria-label="active job tools">
          <section id="work-note-panel" className="card stack">
            <h2>Add Work Note</h2>
            {!isClockedIntoThisJob ? <p className="muted">{fieldRecordGateMessage}</p> : null}
            <form onSubmit={onAddWorkNote} className="stack">
              <label>
                Work note
                <textarea
                  aria-describedby="work-note-help"
                  value={workNote}
                  onChange={(event) => setWorkNote(event.target.value)}
                  required
                  placeholder="Describe work performed"
                  disabled={!isClockedIntoThisJob}
                />
              </label>
              <p id="work-note-help" className="field-help">Use this for progress notes, site conditions, or details the office should review.</p>
              <button type="submit" disabled={isSavingWork || !isClockedIntoThisJob}>
                {isSavingWork ? 'Saving note...' : 'Save Work Note'}
              </button>
            </form>
          </section>

          <section id="part-request-panel" className="card stack">
            <h2>Add / Request Part</h2>
            {!isClockedIntoThisJob ? <p className="muted">{fieldRecordGateMessage}</p> : null}
            <form onSubmit={onSubmitPartRequest} className="stack employee-part-request-form">
              <label>
                Find existing part or enter new part
                <input
                  aria-describedby="part-description-help"
                  value={partRequestDescription}
                  onChange={(event) => onPartRequestDescriptionChange(event.target.value)}
                  placeholder="Search part number, name, or type a new part"
                  disabled={!isClockedIntoThisJob}
                />
              </label>
              <p id="part-description-help" className="field-help">Select a matching stocked part when available, or submit the typed value as an unlisted part.</p>
              <label>
                Existing parts match
                <select
                  aria-describedby="part-match-help"
                  value={selectedPartId}
                  onChange={(event) => setSelectedPartId(event.target.value)}
                  disabled={!isClockedIntoThisJob}
                >
                  <option value="">Use typed new/unlisted part</option>
                  {partLookupMatches.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.partNumber} - {part.name}
                    </option>
                  ))}
                </select>
              </label>
              <p id="part-match-help" className="field-help">Changing the typed search clears the selected match so the submitted part stays intentional.</p>
              <div className="employee-part-match-summary" aria-label="part matching context">
                <span className="employee-part-match-pill">{partLookupMatches.length} suggested matches</span>
                <span className="employee-part-match-pill">{partsUsed.length} parts already on this ticket</span>
              </div>
              {selectedPart ? (
                <p className="muted employee-part-match-selected">Selected existing part: {selectedPart.partNumber} - {selectedPart.name}</p>
              ) : (
                <p className="muted employee-part-match-unlisted">No match selected; the typed value will be submitted as a new/unlisted part.</p>
              )}
              <label>
                Quantity needed
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={partRequestQuantity}
                  onChange={(event) => setPartRequestQuantity(event.target.value)}
                  required
                  placeholder="Enter quantity (e.g., 2)"
                  disabled={!isClockedIntoThisJob}
                />
              </label>
              <p id="quantity-help" className="field-help">How many of this part do you need? You can add the same part multiple times if you need different quantities or want to note them separately.</p>
              <label>
                Notes
                <input
                  value={partRequestNotes}
                  onChange={(event) => setPartRequestNotes(event.target.value)}
                  disabled={!isClockedIntoThisJob}
                />
              </label>
              <label className="row employee-part-order-toggle">
                <input type="checkbox" checked={partNeedsOrdered} onChange={(event) => setPartNeedsOrdered(event.target.checked)} disabled={!isClockedIntoThisJob} />
                Needs ordered
              </label>
              {partNeedsOrdered ? (
                <>
                  <label>
                    Urgency
                    <select
                      value={partRequestUrgency}
                      onChange={(event) => setPartRequestUrgency(event.target.value)}
                      disabled={!isClockedIntoThisJob}
                    >
                      <option value="">Routine</option>
                      <option value="Soon">Soon</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </label>
                  <label>
                    Needed by
                    <input
                      type="date"
                      value={partRequestNeededBy}
                      onChange={(event) => setPartRequestNeededBy(event.target.value)}
                      disabled={!isClockedIntoThisJob}
                    />
                  </label>
                </>
              ) : null}
              <button type="submit" disabled={isSubmittingPartRequest || !isClockedIntoThisJob}>
                {isSubmittingPartRequest ? 'Adding part...' : 'Add / Request Part'}
              </button>
            </form>
          </section>

          <section id="photo-upload-panel" className="card stack">
            <h2>Upload Photo / File</h2>
            {!isClockedIntoThisJob ? <p className="muted">{fieldRecordGateMessage}</p> : null}
            <form onSubmit={onUpload} className="stack">
              <label>
                Photo or file
                <input
                  aria-describedby="upload-file-help"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                  required
                  disabled={!isClockedIntoThisJob}
                />
              </label>
              <p id="upload-file-help" className="field-help">Allowed file types: JPG, PNG, WebP, or PDF.</p>
              <label>
                Caption
                <input
                  value={uploadCaption}
                  onChange={(event) => setUploadCaption(event.target.value)}
                  disabled={!isClockedIntoThisJob}
                />
              </label>
              <button type="submit" disabled={isUploading || !isClockedIntoThisJob}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Work Entries</h2>
            <ul>
              {workEntries.map((entry) => (
                <li key={entry.id}>
                  {new Date(entry.performedAtUtc).toLocaleString()} - {entry.notes}
                </li>
              ))}
            </ul>
          </section>

          <section className="card employee-parts-used-card">
            <h2>Parts Requests & Usage</h2>
            <p className="muted employee-parts-used-summary">{partsUsed.length} part entries linked to this ticket.</p>
            {partsUsed.length ? (
              <ul className="employee-parts-used-list">
                {partsUsed.map((part) => (
                  <li key={part.id} className="employee-parts-used-item">
                    <p className="employee-parts-used-line">
                      {getPartUsedDisplay(part)}
                      {part.isUnlistedPart ? ' (unlisted)' : ''} - Qty {part.quantity} - {part.notes ?? 'No notes'} - {getPartRequestContext(part)}
                      {part.officeOrderRequested && part.officeOrderNotes ? `: ${part.officeOrderNotes}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No parts have been added yet.</p>
            )}
          </section>

          <section className="card">
            <h2>Files / Photos</h2>
            <ul>
              {files.map((file) => (
                <li key={file.id}>
                  {file.originalFileName} ({Math.round(file.fileSizeBytes / 1024)} KB) - {new Date(file.uploadedAtUtc).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        </section>
      ) : null}
    </main>
  )
}
