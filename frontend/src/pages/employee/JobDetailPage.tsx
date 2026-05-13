import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { filesApi } from '../../api/filesApi'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { partsApi } from '../../api/partsApi'
import { timeEntriesApi } from '../../api/timeEntriesApi'
import { useAuth } from '../../features/auth/AuthContext'
import type { JobTicketDto, JobTicketFileDto, JobTicketPartDto, JobWorkEntryDto, PartLookupDto, TimeEntryDto } from '../../types'
import { getJobTicketPriorityLabel, getJobTicketStatusLabel } from './jobDisplay'

const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function JobDetailPage() {
  const { jobTicketId } = useParams<{ jobTicketId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [job, setJob] = useState<JobTicketDto | null>(null)
  const [workEntries, setWorkEntries] = useState<JobWorkEntryDto[]>([])
  const [partsUsed, setPartsUsed] = useState<JobTicketPartDto[]>([])
  const [files, setFiles] = useState<JobTicketFileDto[]>([])
  const [openEntry, setOpenEntry] = useState<TimeEntryDto | null>(null)
  const [partsCatalog, setPartsCatalog] = useState<PartLookupDto[]>([])

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [workNote, setWorkNote] = useState('')
  const [partId, setPartId] = useState('')
  const [partQuantity, setPartQuantity] = useState('1')
  const [partNotes, setPartNotes] = useState('')
  const [clockWorkSummary, setClockWorkSummary] = useState('')
  const [clockNote, setClockNote] = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadInvoiceAttachment, setUploadInvoiceAttachment] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [isSavingWork, setIsSavingWork] = useState(false)
  const [isSavingPart, setIsSavingPart] = useState(false)
  const [isClocking, setIsClocking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const partOptions = useMemo(
    () => partsCatalog.map((part) => ({ value: part.id, label: `${part.partNumber} - ${part.name}` })),
    [partsCatalog]
  )

  const refreshDetails = async () => {
    if (!jobTicketId || !user) {
      return
    }

    const [jobResponse, entriesResponse, partsResponse, filesResponse] = await Promise.all([
      jobTicketsApi.get(jobTicketId),
      jobTicketsApi.listWorkEntries(jobTicketId),
      jobTicketsApi.listParts(jobTicketId),
      filesApi.list(jobTicketId)
    ])

    setJob(jobResponse)
    setWorkEntries(entriesResponse)
    setPartsUsed(partsResponse)
    setFiles(filesResponse)

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

  useEffect(() => {
    if (!jobTicketId || !user) {
      return
    }

    let isMounted = true

    Promise.all([refreshDetails(), partsApi.list().catch(() => [])])
      .then(([, catalog]) => {
        if (isMounted) {
          setPartsCatalog(catalog)
          if (catalog.length && !partId) {
            setPartId(catalog[0].id)
          }
        }
      })
      .catch((requestError) => {
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

          setError(requestError.message)
          return
        }

        setError('Unable to load job details.')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [jobTicketId, user, navigate, logout])

  const getLocation = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not available on this device.'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      })
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
        clockInLatitude: position.coords.latitude,
        clockInLongitude: position.coords.longitude,
        clockInAccuracy: position.coords.accuracy,
        deviceMetadata: navigator.userAgent,
        note: clockNote || null
      })
      setClockNote('')
      await refreshDetails()
    } catch (clockError) {
      if (clockError instanceof ApiError) {
        setError(clockError.message)
      } else {
        setError('Unable to clock in.')
      }
    } finally {
      setIsClocking(false)
    }
  }

  const onClockOut = async () => {
    if (!openEntry || !user) {
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
        clockOutLatitude: position.coords.latitude,
        clockOutLongitude: position.coords.longitude,
        clockOutAccuracy: position.coords.accuracy,
        workSummary: clockWorkSummary,
        note: clockNote || null
      })
      setClockWorkSummary('')
      setClockNote('')
      await refreshDetails()
    } catch (clockError) {
      if (clockError instanceof ApiError) {
        setError(clockError.message)
      } else {
        setError('Unable to clock out.')
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
      await refreshDetails()
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to save work note.')
    } finally {
      setIsSavingWork(false)
    }
  }

  const onAddPart = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !partId) {
      setError('Select a part before submitting.')
      return
    }

    setIsSavingPart(true)
    setError(null)
    try {
      await jobTicketsApi.addPart(jobTicketId, {
        partId,
        quantity: Number(partQuantity),
        notes: partNotes || null,
        isBillable: true,
        addedByEmployeeId: user?.employeeId,
        addedAtUtc: null,
        adjustInventory: true,
        allowManagerOverride: false
      })
      setPartQuantity('1')
      setPartNotes('')
      await refreshDetails()
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to add part used.')
    } finally {
      setIsSavingPart(false)
    }
  }

  const onUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (!jobTicketId || !uploadFile) {
      return
    }

    if (!allowedFileTypes.includes(uploadFile.type)) {
      setError('Unsupported file type. Allowed: jpg, jpeg, png, webp, pdf.')
      return
    }

    const formData = new FormData()
    formData.append('File', uploadFile)
    formData.append('Caption', uploadCaption)
    formData.append('IsInvoiceAttachment', String(uploadInvoiceAttachment))

    setIsUploading(true)
    setError(null)
    try {
      await filesApi.upload(jobTicketId, formData)
      setUploadFile(null)
      setUploadCaption('')
      setUploadInvoiceAttachment(false)
      await refreshDetails()
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
    <main className="mobile-shell">
      <p>
        <Link to="/jobs">← Back to My Jobs</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h1>{job.ticketNumber}</h1>
        <p>{job.title}</p>
        <p className="muted">Status: {getJobTicketStatusLabel(job.status)}</p>
        <p className="muted">Priority: {getJobTicketPriorityLabel(job.priority)}</p>
        <p className="muted">Customer ID: {job.customerId}</p>
        <p className="muted">Service Location ID: {job.serviceLocationId}</p>
        <p className="muted">Billing Party ID: {job.billingPartyCustomerId}</p>
        <p className="muted">Equipment ID: {job.equipmentId ?? 'None'}</p>
        <p>{job.description ?? 'No description provided.'}</p>
      </section>

      <section className="card stack">
        <h2>Clock In / Clock Out</h2>
        <p className="muted">Open entry: {openEntry ? `Started ${new Date(openEntry.startedAtUtc).toLocaleString()}` : 'No open entry'}</p>

        <label>
          Clock note (optional)
          <input value={clockNote} onChange={(event) => setClockNote(event.target.value)} />
        </label>

        {openEntry ? (
          <>
            <label>
              Work summary (required)
              <textarea value={clockWorkSummary} onChange={(event) => setClockWorkSummary(event.target.value)} required />
            </label>
            <button onClick={onClockOut} disabled={isClocking}>
              {isClocking ? 'Clocking out...' : 'Clock Out with GPS'}
            </button>
          </>
        ) : (
          <button onClick={onClockIn} disabled={isClocking}>
            {isClocking ? 'Clocking in...' : 'Clock In with GPS'}
          </button>
        )}
      </section>

      <section className="card stack">
        <h2>Add Work Note</h2>
        <form onSubmit={onAddWorkNote} className="stack">
          <textarea value={workNote} onChange={(event) => setWorkNote(event.target.value)} required placeholder="Describe work performed" />
          <button type="submit" disabled={isSavingWork}>
            {isSavingWork ? 'Saving note...' : 'Save Work Note'}
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2>Add Part Used</h2>
        <form onSubmit={onAddPart} className="stack">
          {partOptions.length ? (
            <label>
              Part
              <select value={partId} onChange={(event) => setPartId(event.target.value)}>
                {partOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="muted">Part lookup unavailable for this role. Enter Part ID manually.</p>
          )}

          {!partOptions.length ? (
            <label>
              Part ID
              <input value={partId} onChange={(event) => setPartId(event.target.value)} required />
            </label>
          ) : null}

          <label>
            Quantity
            <input type="number" min="0.01" step="0.01" value={partQuantity} onChange={(event) => setPartQuantity(event.target.value)} required />
          </label>
          <label>
            Notes
            <input value={partNotes} onChange={(event) => setPartNotes(event.target.value)} />
          </label>
          <button type="submit" disabled={isSavingPart}>
            {isSavingPart ? 'Adding part...' : 'Add Part Used'}
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2>Upload Photo / File</h2>
        <form onSubmit={onUpload} className="stack">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            required
          />
          <label>
            Caption
            <input value={uploadCaption} onChange={(event) => setUploadCaption(event.target.value)} />
          </label>
          <label className="row">
            <input type="checkbox" checked={uploadInvoiceAttachment} onChange={(event) => setUploadInvoiceAttachment(event.target.checked)} />
            Invoice attachment
          </label>
          <button type="submit" disabled={isUploading}>
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

      <section className="card">
        <h2>Parts Used</h2>
        <ul>
          {partsUsed.map((part) => (
            <li key={part.id}>
              Part ID {part.partId} · Qty {part.quantity} · {part.notes ?? 'No notes'}
            </li>
          ))}
        </ul>
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
    </main>
  )
}
