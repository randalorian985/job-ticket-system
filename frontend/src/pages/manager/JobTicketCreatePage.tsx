import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import { usersApi } from '../../api/usersApi'
import type { AssignableEmployeeDto, CreateJobTicketDto, CustomerDto, EquipmentDto, ServiceLocationDto } from '../../types'
import { JobTicketEditorForm } from './JobTicketEditorForm'

const defaultForm: CreateJobTicketDto = {
  customerId: '',
  serviceLocationId: '',
  billingPartyCustomerId: '',
  equipmentId: null,
  title: '',
  description: null,
  priority: 2,
  status: 1,
  locationType: 1,
  requestedAtUtc: null,
  scheduledStartAtUtc: null,
  dueAtUtc: null,
  internalNotes: null,
  customerFacingNotes: null
}

export function JobTicketCreatePage() {
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [locations, setLocations] = useState<ServiceLocationDto[]>([])
  const [equipment, setEquipment] = useState<EquipmentDto[]>([])
  const [assignableEmployees, setAssignableEmployees] = useState<AssignableEmployeeDto[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [leadEmployeeId, setLeadEmployeeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const selectedEmployeeSummaries = useMemo(
    () => selectedEmployeeIds
      .map((id) => {
        const employee = assignableEmployees.find((item) => item.id === id)
        return employee ? `${employee.firstName} ${employee.lastName}`.trim() : null
      })
      .filter((name): name is string => Boolean(name)),
    [assignableEmployees, selectedEmployeeIds]
  )

  useEffect(() => {
    Promise.all([
      masterDataApi.listCustomers(),
      masterDataApi.listServiceLocations(),
      masterDataApi.listEquipment(),
      usersApi.listAssignableEmployees()
    ])
      .then(([customerResponse, locationResponse, equipmentResponse, employeeResponse]) => {
        setCustomers(customerResponse)
        setLocations(locationResponse)
        setEquipment(equipmentResponse)
        setAssignableEmployees(employeeResponse)
      })
      .catch(() => setError('Unable to load create form data.'))
  }, [])

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        const next = prev.filter((id) => id !== employeeId)
        if (leadEmployeeId === employeeId) {
          setLeadEmployeeId(next[0] ?? '')
        }
        return next
      }

      const next = [...prev, employeeId]
      if (!leadEmployeeId) {
        setLeadEmployeeId(employeeId)
      }
      return next
    })
  }

  const onSubmit = async (payload: CreateJobTicketDto) => {
    try {
      const created = await jobTicketsApi.create(payload)

      if (selectedEmployeeIds.length > 0) {
        const assignmentResults = await Promise.allSettled(
          selectedEmployeeIds.map((employeeId) =>
            jobTicketsApi.addAssignment(created.id, {
              employeeId,
              isLead: employeeId === leadEmployeeId
            })
          )
        )

        const failedAssignments = assignmentResults.filter((result) => result.status === 'rejected').length
        if (failedAssignments > 0) {
          setError(`Ticket created, but ${failedAssignments} technician assignment${failedAssignments === 1 ? '' : 's'} failed. Open the ticket to finish assignments.`)
        }
      }

      navigate(`/manage/job-tickets/${created.id}`)
    } catch (requestError) {
      if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
        setError('You do not have permission to create job tickets.')
        return
      }
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to create ticket.')
    }
  }

  return (
    <section className="card stack">
      <p><Link to="/manage/job-tickets">Back to Job Tickets</Link></p>
      <h2>Create Job Ticket</h2>
      {error ? <p className="error">{error}</p> : null}

      <JobTicketEditorForm
        initial={defaultForm}
        customers={customers}
        serviceLocations={locations}
        equipment={equipment}
        scheduleAssignmentPanel={(
          <section className="quick-add-panel stack" aria-label="optional technician assignment during ticket creation">
            <h4>Assign Technicians (Optional)</h4>
            <p className="muted">Set lead and additional technicians now, or leave blank and assign later on the ticket detail page.</p>
            <p className="muted">You can select multiple technicians and choose one lead.</p>
            {selectedEmployeeSummaries.length ? (
              <p className="muted">Selected technicians: {selectedEmployeeSummaries.join(', ')}</p>
            ) : (
              <p className="muted">No technicians selected yet.</p>
            )}
            {assignableEmployees.length === 0 ? (
              <p className="muted">No assignable technicians are currently available.</p>
            ) : (
              <>
                <div className="stack">
                  {assignableEmployees.map((employee) => {
                    const id = employee.id
                    const displayName = `${employee.firstName} ${employee.lastName}`.trim()
                    return (
                      <label key={id} className="row">
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(id)}
                          onChange={() => toggleEmployee(id)}
                        />
                        <span>{displayName}</span>
                        {selectedEmployeeIds.includes(id) && leadEmployeeId === id ? (
                          <span className="status-chip">Lead</span>
                        ) : null}
                      </label>
                    )
                  })}
                </div>

                <label>
                  Lead Technician
                  <select
                    value={leadEmployeeId}
                    onChange={(event) => setLeadEmployeeId(event.target.value)}
                    disabled={selectedEmployeeIds.length === 0}
                  >
                    <option value="">No lead selected</option>
                    {selectedEmployeeIds.map((employeeId) => {
                      const employee = assignableEmployees.find((item) => item.id === employeeId)
                      const name = employee ? `${employee.firstName} ${employee.lastName}`.trim() : employeeId
                      return <option key={employeeId} value={employeeId}>{name}</option>
                    })}
                  </select>
                </label>
              </>
            )}
          </section>
        )}
        onSubmit={onSubmit}
        onServiceLocationCreated={(created) => setLocations((prev) => [created, ...prev.filter((item) => item.id !== created.id)])}
        onEquipmentCreated={(created) => setEquipment((prev) => [created, ...prev.filter((item) => item.id !== created.id)])}
        submitLabel="Create Ticket"
      />
    </section>
  )
}
