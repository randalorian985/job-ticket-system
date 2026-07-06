# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alerts-nav.spec.ts >> Alerts & Notifications page >> Alerts page shows Part order requests email section
- Location: e2e\alerts-nav.spec.ts:25:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Part order requests')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Part order requests')

```

```yaml
- main:
  - paragraph: Job Ticket System
  - heading "Service Operations" [level=1]
  - paragraph: Avery Admin - Admin
  - button "Logout"
  - navigation "manager navigation":
    - link "Dashboard":
      - /url: /manage
    - link "Job Tickets":
      - /url: /manage/job-tickets
    - link "Scheduling":
      - /url: /manage/schedule
    - group: Customers & Equipment
    - group: Parts & Supply
    - group: Reports
    - group: Review & Reference
    - group: Admin
  - region "manager operations dashboard":
    - heading "Job ticket management dashboard" [level=2]
    - paragraph: Manager/Admin summary for open work, technician assignment, scheduling, and back-office review queues.
    - link "Create Job Ticket":
      - /url: /manage/job-tickets/new
    - link "Review jobs":
      - /url: /manage/job-tickets
    - link "Wiki":
      - /url: /manage/wiki#manager-admin-workspace
    - region "operations summary":
      - link "Open Jobs 4":
        - /url: /manage/job-tickets?status=active
        - text: Open Jobs
        - strong: "4"
      - link "Assigned 1":
        - /url: /manage/job-tickets?status=3
        - text: Assigned
        - strong: "1"
      - link "In Progress 0":
        - /url: /manage/job-tickets?status=4
        - text: In Progress
        - strong: "0"
      - link "Waiting on Parts 1":
        - /url: /manage/job-tickets?status=5
        - text: Waiting on Parts
        - strong: "1"
      - link "Ready to Work 2":
        - /url: /manage/job-tickets?status=active&readiness=ready
        - text: Ready to Work
        - strong: "2"
      - link "All Jobs 5":
        - /url: /manage/job-tickets
        - text: All Jobs
        - strong: "5"
    - article:
      - heading "Unresolved Jobs by Status" [level=3]
      - link "Open jobs 4":
        - /url: /manage/job-tickets?status=active
        - text: Open jobs
        - strong: "4"
      - link "Submitted 0":
        - /url: /manage/job-tickets?status=2
        - text: Submitted
        - strong: "0"
      - link "Assigned 1":
        - /url: /manage/job-tickets?status=3
        - text: Assigned
        - strong: "1"
      - link "In progress 0":
        - /url: /manage/job-tickets?status=4
        - text: In progress
        - strong: "0"
      - link "Waiting on parts 1":
        - /url: /manage/job-tickets?status=5
        - text: Waiting on parts
        - strong: "1"
      - link "Completed / review-ready 1":
        - /url: /manage/job-tickets?status=7
        - text: Completed / review-ready
        - strong: "1"
      - link "Invoice-ready 0":
        - /url: /manage/job-tickets?status=10
        - text: Invoice-ready
        - strong: "0"
    - article:
      - heading "Assignment & Schedule" [level=3]
      - link "Ready to work 2":
        - /url: /manage/job-tickets?status=active&readiness=ready
        - text: Ready to work
        - strong: "2"
      - link "Needs assignment review 0":
        - /url: /manage/job-tickets?status=active&readiness=needs-review
        - text: Needs assignment review
        - strong: "0"
      - paragraph: "Next assignment focus: No assignment or schedule blockers are visible from the dashboard data."
    - article:
      - heading "Back Office Review" [level=3]
      - link "1 Completed / review-ready":
        - /url: /manage/job-tickets?status=7
        - strong: "1"
        - text: Completed / review-ready
      - link "0 Invoice-ready":
        - /url: /manage/job-tickets?status=10
        - strong: "0"
        - text: Invoice-ready
      - link "0 Needs assignment review":
        - /url: /manage/job-tickets?status=active&readiness=needs-review
        - strong: "0"
        - text: Needs assignment review
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const USERNAME = process.env.E2E_USERNAME ?? 'pilot.admin'
  4  | const PASSWORD = process.env.E2E_PASSWORD ?? 'PilotDemo123!'
  5  | 
  6  | test.describe('Alerts & Notifications page', () => {
  7  |   test.beforeEach(async ({ page }) => {
  8  |     await page.goto('/login')
  9  |     await page.getByLabel('Username or Email').fill(USERNAME)
  10 |     await page.getByLabel('Password').fill(PASSWORD)
  11 |     await page.getByRole('button', { name: 'Sign In' }).click()
  12 |     await page.waitForURL(/\/manage/)
  13 |   })
  14 | 
  15 |   test('Alerts & Notifications nav item is visible', async ({ page }) => {
  16 |     await expect(page.getByRole('link', { name: 'Alerts & Notifications' })).toBeVisible()
  17 |   })
  18 | 
  19 |   test('navigates to Alerts & Notifications page and shows heading', async ({ page }) => {
  20 |     await page.getByRole('link', { name: 'Alerts & Notifications' }).click()
  21 |     await expect(page).toHaveURL(/\/manage\/alerts/)
  22 |     await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible()
  23 |   })
  24 | 
  25 |   test('Alerts page shows Part order requests email section', async ({ page }) => {
  26 |     await page.goto('/manage/alerts')
> 27 |     await expect(page.getByText('Part order requests')).toBeVisible()
     |                                                         ^ Error: expect(locator).toBeVisible() failed
  28 |   })
  29 | 
  30 |   test('Company Configuration page no longer shows Part order requests section', async ({ page }) => {
  31 |     await page.goto('/manage/company-configuration')
  32 |     await expect(page.getByRole('heading', { name: 'Company Configuration' })).toBeVisible()
  33 |     await expect(page.getByText('Part order requests')).not.toBeVisible()
  34 |   })
  35 | })
  36 | 
```