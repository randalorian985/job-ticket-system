import type {
  AddNewTicketNotificationRecipientDto,
  CompanyConfigurationDto,
  NewTicketNotificationRecipientDto,
  UpdateCompanyConfigurationDto
} from '../types'
import { apiRequest } from './httpClient'

const logoPath = '/api/company-configuration/logo'
const notificationRecipientsPath = '/api/company-configuration/notification-recipients'

export const companyConfigurationApi = {
  get: () => apiRequest<CompanyConfigurationDto>('/api/company-configuration'),
  update: (payload: UpdateCompanyConfigurationDto) =>
    apiRequest<CompanyConfigurationDto>('/api/company-configuration', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest<CompanyConfigurationDto>(logoPath, {
      method: 'POST',
      body: formData
    })
  },
  getLogoUrl: (version?: string | null) => `${logoPath}${version ? `?v=${encodeURIComponent(version)}` : ''}`,
  getNotificationRecipients: () =>
    apiRequest<NewTicketNotificationRecipientDto[]>(notificationRecipientsPath),
  addNotificationRecipient: (payload: AddNewTicketNotificationRecipientDto) =>
    apiRequest<NewTicketNotificationRecipientDto>(notificationRecipientsPath, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  removeNotificationRecipient: (id: string) =>
    apiRequest<void>(`${notificationRecipientsPath}/${id}`, { method: 'DELETE' })
}
