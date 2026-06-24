import type { CompanyConfigurationDto, UpdateCompanyConfigurationDto } from '../types'
import { apiRequest } from './httpClient'

const logoPath = '/api/company-configuration/logo'

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
  getLogoUrl: (version?: string | null) => `${logoPath}${version ? `?v=${encodeURIComponent(version)}` : ''}`
}
