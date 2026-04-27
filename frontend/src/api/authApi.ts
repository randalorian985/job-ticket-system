import type { AuthLoginRequestDto, AuthLoginResponseDto, AuthMeDto } from '../types'
import { apiRequest } from './httpClient'

export const authApi = {
  login: (payload: AuthLoginRequestDto) =>
    apiRequest<AuthLoginResponseDto>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  me: () => apiRequest<AuthMeDto>('/api/auth/me')
}
