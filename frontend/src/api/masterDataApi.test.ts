import { afterEach, describe, expect, it, vi } from 'vitest'
import { masterDataApi } from './masterDataApi'

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
})

describe('masterDataApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('requests archived records for Manager/Admin master-data lists', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(jsonResponse([])))

    await masterDataApi.listCustomers()
    await masterDataApi.listServiceLocations()
    await masterDataApi.listEquipment()
    await masterDataApi.listVendors()
    await masterDataApi.listPartCategories()
    await masterDataApi.listParts()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/customers?offset=0&limit=200&includeArchived=true', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/service-locations?offset=0&limit=200&includeArchived=true', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/equipment?offset=0&limit=200&includeArchived=true', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/vendors?offset=0&limit=200&includeArchived=true', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(5, '/api/part-categories?offset=0&limit=200&includeArchived=true', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/parts?offset=0&limit=200&includeArchived=true', expect.any(Object))
  })
})
