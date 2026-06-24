import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { companyConfigurationApi } from '../../../api/companyConfigurationApi'
import type { CompanyConfigurationDto } from '../../../types'
import { CompanyConfigurationPage } from './CompanyConfigurationPage'

vi.mock('../../../api/companyConfigurationApi', () => ({
  companyConfigurationApi: {
    get: vi.fn(),
    update: vi.fn(),
    uploadLogo: vi.fn(),
    getLogoUrl: vi.fn((version?: string | null) => `/api/company-configuration/logo${version ? `?v=${version}` : ''}`)
  }
}))

const configuration: CompanyConfigurationDto = {
  id: 'company-config-1',
  companyName: 'Bayou Crane Service',
  legalName: 'Bayou Crane Service LLC',
  contactName: 'Dispatch',
  email: 'dispatch@example.com',
  phone: '555-0100',
  website: 'https://example.com',
  addressLine1: '100 Lift Way',
  addressLine2: null,
  city: 'Lafayette',
  state: 'LA',
  postalCode: '70501',
  country: 'USA',
  primaryColor: '#3157C8',
  secondaryColor: '#172033',
  accentColor: '#087F5B',
  hasLogo: false,
  logoOriginalFileName: null,
  logoContentType: null,
  logoFileSizeBytes: null,
  logoUploadedAtUtc: null,
  createdAtUtc: '2026-06-22T00:00:00Z',
  updatedAtUtc: '2026-06-22T00:00:00Z'
}

describe('CompanyConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(companyConfigurationApi.get).mockResolvedValue(configuration)
    vi.mocked(companyConfigurationApi.update).mockImplementation(async (payload) => ({
      ...configuration,
      ...payload,
      updatedAtUtc: '2026-06-22T01:00:00Z'
    }))
    vi.mocked(companyConfigurationApi.uploadLogo).mockResolvedValue({
      ...configuration,
      hasLogo: true,
      logoOriginalFileName: 'logo.png',
      logoContentType: 'image/png',
      logoFileSizeBytes: 12,
      logoUploadedAtUtc: '2026-06-22T02:00:00Z'
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('saves company profile and color changes', async () => {
    const user = userEvent.setup()
    render(<CompanyConfigurationPage />)

    expect(await screen.findByRole('heading', { name: 'Company Configuration' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Company name'))
    await user.type(screen.getByLabelText('Company name'), 'Delta Crane')
    await user.clear(screen.getByLabelText('Primary color hex'))
    await user.type(screen.getByLabelText('Primary color hex'), '#AA5500')

    await user.click(screen.getByRole('button', { name: 'Save company profile' }))

    await waitFor(() => expect(companyConfigurationApi.update).toHaveBeenCalledWith(expect.objectContaining({
      companyName: 'Delta Crane',
      primaryColor: '#AA5500'
    })))
    expect(await screen.findByText('Company profile saved.')).toBeInTheDocument()
  })

  it('uploads a company logo file', async () => {
    const user = userEvent.setup()
    render(<CompanyConfigurationPage />)

    await screen.findByRole('heading', { name: 'Company Configuration' })
    const logoFile = new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'logo.png', { type: 'image/png' })

    await user.upload(screen.getByLabelText('Logo file'), logoFile)
    await user.click(screen.getByRole('button', { name: 'Upload logo' }))

    await waitFor(() => expect(companyConfigurationApi.uploadLogo).toHaveBeenCalledWith(logoFile))
    expect(await screen.findByText('Company logo uploaded.')).toBeInTheDocument()
  })
})
