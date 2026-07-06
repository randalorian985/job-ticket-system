# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alerts-nav.spec.ts >> Alerts & Notifications page >> navigates to Alerts & Notifications page and shows heading
- Location: e2e\alerts-nav.spec.ts:19:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Alerts & Notifications' })

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: JT
        - generic [ref=e8]:
          - paragraph [ref=e9]: Job Ticket System
          - heading "Service Operations" [level=1] [ref=e10]
          - paragraph [ref=e11]: Avery Admin - Admin
      - button "Logout" [ref=e12] [cursor=pointer]
    - navigation "manager navigation" [ref=e13]:
      - generic [ref=e14]:
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /manage
        - link "Job Tickets" [ref=e16] [cursor=pointer]:
          - /url: /manage/job-tickets
        - link "Scheduling" [ref=e17] [cursor=pointer]:
          - /url: /manage/schedule
      - generic [ref=e18]:
        - group [ref=e19]:
          - generic "Customers & Equipment" [ref=e20] [cursor=pointer]
        - group [ref=e21]:
          - generic "Parts & Supply" [ref=e22] [cursor=pointer]
        - group [ref=e23]:
          - generic "Reports" [ref=e24] [cursor=pointer]
        - group [ref=e25]:
          - generic "Review & Reference" [ref=e26] [cursor=pointer]
        - group [ref=e27]:
          - generic "Admin" [ref=e28] [cursor=pointer]
  - region "manager operations dashboard" [ref=e29]:
    - generic [ref=e30]:
      - generic [ref=e31]:
        - heading "Job ticket management dashboard" [level=2] [ref=e32]
        - paragraph [ref=e33]: Manager/Admin summary for open work, technician assignment, scheduling, and back-office review queues.
      - generic [ref=e34]:
        - link "Create Job Ticket" [ref=e35] [cursor=pointer]:
          - /url: /manage/job-tickets/new
        - link "Review jobs" [ref=e36] [cursor=pointer]:
          - /url: /manage/job-tickets
        - link "Wiki" [ref=e37] [cursor=pointer]:
          - /url: /manage/wiki#manager-admin-workspace
    - region "operations summary" [ref=e38]:
      - link "Open Jobs 4" [ref=e39] [cursor=pointer]:
        - /url: /manage/job-tickets?status=active
        - generic [ref=e40]: Open Jobs
        - strong [ref=e41]: "4"
      - link "Assigned 1" [ref=e42] [cursor=pointer]:
        - /url: /manage/job-tickets?status=3
        - generic [ref=e43]: Assigned
        - strong [ref=e44]: "1"
      - link "In Progress 0" [ref=e45] [cursor=pointer]:
        - /url: /manage/job-tickets?status=4
        - generic [ref=e46]: In Progress
        - strong [ref=e47]: "0"
      - link "Waiting on Parts 1" [ref=e48] [cursor=pointer]:
        - /url: /manage/job-tickets?status=5
        - generic [ref=e49]: Waiting on Parts
        - strong [ref=e50]: "1"
      - link "Ready to Work 2" [ref=e51] [cursor=pointer]:
        - /url: /manage/job-tickets?status=active&readiness=ready
        - generic [ref=e52]: Ready to Work
        - strong [ref=e53]: "2"
      - link "All Jobs 5" [ref=e54] [cursor=pointer]:
        - /url: /manage/job-tickets
        - generic [ref=e55]: All Jobs
        - strong [ref=e56]: "5"
    - generic [ref=e57]:
      - article [ref=e58]:
        - heading "Unresolved Jobs by Status" [level=3] [ref=e59]
        - generic [ref=e60]:
          - link "Open jobs 4" [ref=e61] [cursor=pointer]:
            - /url: /manage/job-tickets?status=active
            - generic [ref=e62]: Open jobs
            - strong [ref=e65]: "4"
          - link "Submitted 0" [ref=e66] [cursor=pointer]:
            - /url: /manage/job-tickets?status=2
            - generic [ref=e67]: Submitted
            - strong [ref=e70]: "0"
          - link "Assigned 1" [ref=e71] [cursor=pointer]:
            - /url: /manage/job-tickets?status=3
            - generic [ref=e72]: Assigned
            - strong [ref=e75]: "1"
          - link "In progress 0" [ref=e76] [cursor=pointer]:
            - /url: /manage/job-tickets?status=4
            - generic [ref=e77]: In progress
            - strong [ref=e80]: "0"
          - link "Waiting on parts 1" [ref=e81] [cursor=pointer]:
            - /url: /manage/job-tickets?status=5
            - generic [ref=e82]: Waiting on parts
            - strong [ref=e85]: "1"
          - link "Completed / review-ready 1" [ref=e86] [cursor=pointer]:
            - /url: /manage/job-tickets?status=7
            - generic [ref=e87]: Completed / review-ready
            - strong [ref=e90]: "1"
          - link "Invoice-ready 0" [ref=e91] [cursor=pointer]:
            - /url: /manage/job-tickets?status=10
            - generic [ref=e92]: Invoice-ready
            - strong [ref=e95]: "0"
      - article [ref=e96]:
        - heading "Assignment & Schedule" [level=3] [ref=e97]
        - generic [ref=e98]:
          - link "Ready to work 2" [ref=e99] [cursor=pointer]:
            - /url: /manage/job-tickets?status=active&readiness=ready
            - generic [ref=e100]: Ready to work
            - strong [ref=e103]: "2"
          - link "Needs assignment review 0" [ref=e104] [cursor=pointer]:
            - /url: /manage/job-tickets?status=active&readiness=needs-review
            - generic [ref=e105]: Needs assignment review
            - strong [ref=e108]: "0"
        - paragraph [ref=e109]: "Next assignment focus: No assignment or schedule blockers are visible from the dashboard data."
      - article [ref=e110]:
        - heading "Back Office Review" [level=3] [ref=e111]
        - generic [ref=e112]:
          - link "1 Completed / review-ready" [ref=e113] [cursor=pointer]:
            - /url: /manage/job-tickets?status=7
            - strong [ref=e114]: "1"
            - generic [ref=e115]: Completed / review-ready
          - link "0 Invoice-ready" [ref=e116] [cursor=pointer]:
            - /url: /manage/job-tickets?status=10
            - strong [ref=e117]: "0"
            - generic [ref=e118]: Invoice-ready
          - link "0 Needs assignment review" [ref=e119] [cursor=pointer]:
            - /url: /manage/job-tickets?status=active&readiness=needs-review
            - strong [ref=e120]: "0"
            - generic [ref=e121]: Needs assignment review
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
> 20 |     await page.getByRole('link', { name: 'Alerts & Notifications' }).click()
     |                                                                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  21 |     await expect(page).toHaveURL(/\/manage\/alerts/)
  22 |     await expect(page.getByRole('heading', { name: 'Alerts & Notifications' })).toBeVisible()
  23 |   })
  24 | 
  25 |   test('Alerts page shows Part order requests email section', async ({ page }) => {
  26 |     await page.goto('/manage/alerts')
  27 |     await expect(page.getByText('Part order requests')).toBeVisible()
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