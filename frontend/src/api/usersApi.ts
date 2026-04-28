import type { CreateUserDto, ResetPasswordDto, UpdateUserDto, UserDto } from '../types'
import { apiRequest } from './httpClient'

export const usersApi = {
  list: () => apiRequest<UserDto[]>('/api/users'),
  create: (payload: CreateUserDto) => apiRequest<UserDto>('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateUserDto) => apiRequest<UserDto>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (id: string) => apiRequest<UserDto>(`/api/users/${id}/archive`, { method: 'POST' }),
  resetPassword: (id: string, payload: ResetPasswordDto) => apiRequest<UserDto>(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(payload) })
}
