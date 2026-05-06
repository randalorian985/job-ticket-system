import { afterEach, describe, expect, it, vi } from 'vitest'
import { systemApi } from './systemApi'

const systemInfo = {
  serviceName: 'Job Ticket Management System API',
  apiBasePath: '/api',
  healthEndpoint: '/health',
  environmentName: 'Development',
  version: '1.0.0.0'
}

describe('systemApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('loads application metadata from the public system info endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(systemInfo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )

    await expect(systemApi.getInfo()).resolves.toEqual(systemInfo)

    expect(fetchMock).toHaveBeenCalledWith('/api/system/info', {
      headers: { 'Content-Type': 'application/json' }
    })
  })
})
