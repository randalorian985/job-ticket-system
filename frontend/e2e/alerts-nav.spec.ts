import { test, expect } from '@playwright/test'

const USERNAME = process.env.E2E_USERNAME ?? 'pilot.admin'
const PASSWORD = process.env.E2E_PASSWORD ?? 'PilotDemo123!'

test.describe('Alerts & Notifications page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username or Email').fill(USERNAME)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(/\/manage/)
  })

  test('Alerts & Notifications nav item is present in Admin group', async ({ page }) => {
    // The Admin group uses a <details>/<summary> dropdown — open it first
    await page.getByRole('group', { name: 'Admin' }).or(page.locator('details summary', { hasText: 'Admin' })).click()
    await expect(page.getByRole('link', { name: 'Alerts & Notifications' })).toBeVisible()
  })

  test('navigates to /manage/alerts and shows Alerts & Notifications heading', async ({ page }) => {
    await page.goto('/manage/alerts')
    await expect(page).toHaveURL(/\/manage\/alerts/)
    await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible()
  })

  test('Alerts page shows Part order requests section', async ({ page }) => {
    await page.goto('/manage/alerts')
    await expect(page.getByRole('heading', { name: 'Part order requests' })).toBeVisible()
  })

  test('Company Configuration page no longer shows Part order requests section', async ({ page }) => {
    await page.goto('/manage/company-configuration')
    await expect(page.getByRole('heading', { name: 'Company Configuration' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Part order requests' })).not.toBeVisible()
  })
})

