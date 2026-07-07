import type {
  MailerConfigurationDto,
  MailerTestResultDto,
  SendMailerTestRequestDto,
  UpdateMailerConfigurationDto
} from '../types'
import { apiRequest } from './httpClient'

const mailerConfigurationPath = '/api/mailer-configuration'

export const mailerConfigurationApi = {
  get: () => apiRequest<MailerConfigurationDto>(mailerConfigurationPath),
  update: (payload: UpdateMailerConfigurationDto) =>
    apiRequest<MailerConfigurationDto>(mailerConfigurationPath, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  sendTest: (payload: SendMailerTestRequestDto) =>
    apiRequest<MailerTestResultDto>(`${mailerConfigurationPath}/test`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
