import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/httpClient'
import { jobTicketsApi } from '../../api/jobTicketsApi'
import { masterDataApi } from '../../api/masterDataApi'
import type { CreateJobTicketDto, CustomerDto, EquipmentDto, ServiceLocationDto } from '../../types'
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
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([masterDataApi.listCustomers(), masterDataApi.listServiceLocations(), masterDataApi.listEquipment()])
      .then(([c, l, e]) => {
        setCustomers(c)
        setLocations(l)
        setEquipment(e)
      })
      .catch(() => setError('Unable to load create form data.'))
  }, [])

  const onSubmit = async (payload: CreateJobTicketDto) => {
    try {
      const created = await jobTicketsApi.create(payload)
      navigate(`/manage/job-tickets/${created.id}`)
    } catch (requestError) {
      if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
        setError('You do not have permission to create job tickets.')
        return
      }
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to create ticket.')
    }
  }

  return <section className="card stack"><p><Link to="/manage/job-tickets">← Back to Job Tickets</Link></p><h2>Create Job Ticket</h2>{error ? <p className="error">{error}</p> : null}<JobTicketEditorForm initial={defaultForm} customers={customers} serviceLocations={locations} equipment={equipment} onSubmit={onSubmit} submitLabel="Create Ticket" /></section>
}
