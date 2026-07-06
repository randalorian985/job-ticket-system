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

  test('Alerts & Notifications nav item is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Alerts & Notifications' })).toBeVisible()
  })

  test('navigates to Alerts & Notifications page and shows heading', async ({ page }) => {
    await page.getByRole('link', { name: 'Alerts & Notifications' }).click()
    await expect(page).toHaveURL(/\/manage\/alerts/)
    await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible()
  })

  test('Alerts page shows Part order requests email section', async ({ page }) => {
    await page.goto('/manage/alerts')
    await expect(page.getByText('Part order requests')).toBeVisible()
  })

  test('Company Configuration page no longer shows Part order requests section', async ({ page }) => {
    await page.goto('/manage/company-configuration')
    await expect(page.getByRole('heading', { name: 'Company Configuration' })).toBeVisible()
    await expect(page.getByText('Part order requests')).not.toBeVisible()
  })
})
