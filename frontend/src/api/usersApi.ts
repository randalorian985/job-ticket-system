import type { UserDto } from '../types'
import { apiRequest } from './httpClient'

export const usersApi = {
  list: () => apiRequest<UserDto[]>('/api/users')
}
