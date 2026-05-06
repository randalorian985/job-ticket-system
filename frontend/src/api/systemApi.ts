import type { SystemInfoDto } from '../types'
import { apiRequest } from './httpClient'

export const systemApi = {
  getInfo: () => apiRequest<SystemInfoDto>('/api/system/info')
}
