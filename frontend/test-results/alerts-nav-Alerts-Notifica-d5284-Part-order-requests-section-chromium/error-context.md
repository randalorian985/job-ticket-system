# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alerts-nav.spec.ts >> Alerts & Notifications page >> Company Configuration page no longer shows Part order requests section
- Location: e2e\alerts-nav.spec.ts:30:3

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator: getByText('Part order requests')
Expected: not visible
Error: strict mode violation: getByText('Part order requests') resolved to 2 elements:
    1) <h3>Part order requests</h3> aka getByRole('heading', { name: 'Part order requests' })
    2) <label for="cc-partOrderRequestsEmail">Part order requests email</label> aka getByText('Part order requests email')

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for getByText('Part order requests')

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
  - generic [ref=e29]:
    - generic [ref=e31]:
      - paragraph [ref=e32]: Admin
      - heading "Company Configuration" [level=2] [ref=e33]
      - paragraph [ref=e34]: Company profile and brand assets.
    - generic [ref=e35]:
      - generic [ref=e36]:
        - region "company logo" [ref=e37]:
          - generic [ref=e39]:
            - paragraph [ref=e40]: Logo
            - heading "Company mark" [level=3] [ref=e41]
          - generic [ref=e42]:
            - generic [ref=e43]:
              - text: Logo file
              - button "Logo file" [ref=e44]
            - button "Upload logo" [disabled] [ref=e45]
          - paragraph [ref=e46]: PNG, JPG, or WebP up to 2 MB.
        - generic [ref=e47]:
          - region "company profile" [ref=e48]:
            - generic [ref=e50]:
              - paragraph [ref=e51]: Company profile
              - heading "Business information" [level=3] [ref=e52]
            - generic [ref=e53]:
              - generic [ref=e54]:
                - generic [ref=e55]: Company name
                - textbox "Company name" [ref=e56]: Job Ticket System
                - generic [ref=e57]: 17 / 200
              - generic [ref=e58]:
                - generic [ref=e59]: Legal name
                - textbox "Legal name" [ref=e60]
                - generic [ref=e61]: 0 / 200
              - generic [ref=e62]:
                - generic [ref=e63]: Primary contact
                - textbox "Primary contact" [ref=e64]
                - generic [ref=e65]: 0 / 200
              - generic [ref=e66]:
                - generic [ref=e67]: Contact email
                - textbox "Contact email" [ref=e68]
                - generic [ref=e69]: 0 / 320
              - generic [ref=e70]:
                - generic [ref=e71]: Phone
                - textbox "Phone" [ref=e72]
                - generic [ref=e73]: 0 / 50
              - generic [ref=e74]:
                - generic [ref=e75]: Website
                - textbox "Website" [ref=e76]
                - generic [ref=e77]: 0 / 300
              - generic [ref=e78]:
                - generic [ref=e79]: Address line 1
                - textbox "Address line 1" [ref=e80]
                - generic [ref=e81]: 0 / 200
              - generic [ref=e82]:
                - generic [ref=e83]: Address line 2
                - textbox "Address line 2" [ref=e84]
                - generic [ref=e85]: 0 / 200
              - generic [ref=e86]:
                - generic [ref=e87]: City
                - textbox "City" [ref=e88]
                - generic [ref=e89]: 0 / 100
              - generic [ref=e90]:
                - generic [ref=e91]: State
                - textbox "State" [ref=e92]
                - generic [ref=e93]: 0 / 100
              - generic [ref=e94]:
                - generic [ref=e95]: Postal code
                - textbox "Postal code" [ref=e96]
                - generic [ref=e97]: 0 / 20
              - generic [ref=e98]:
                - generic [ref=e99]: Country
                - textbox "Country" [ref=e100]
                - generic [ref=e101]: 0 / 100
          - region "brand colors" [ref=e102]:
            - generic [ref=e104]:
              - paragraph [ref=e105]: Brand colors
              - heading "UI and export color scheme" [level=3] [ref=e106]
            - generic [ref=e107]:
              - generic [ref=e108]:
                - text: Primary color
                - generic [ref=e109]:
                  - textbox "Primary color picker" [ref=e110] [cursor=pointer]: "#3157c8"
                  - textbox "Primary color hex" [ref=e111]:
                    - /placeholder: "#3157C8"
                    - text: "#3157C8"
              - generic [ref=e112]:
                - text: Secondary color
                - generic [ref=e113]:
                  - textbox "Secondary color picker" [ref=e114] [cursor=pointer]: "#172033"
                  - textbox "Secondary color hex" [ref=e115]:
                    - /placeholder: "#3157C8"
                    - text: "#172033"
              - generic [ref=e116]:
                - text: Accent color
                - generic [ref=e117]:
                  - textbox "Accent color picker" [ref=e118] [cursor=pointer]: "#087f5b"
                  - textbox "Accent color hex" [ref=e119]:
                    - /placeholder: "#3157C8"
                    - text: "#087F5B"
          - region "part order routing" [ref=e120]:
            - generic [ref=e122]:
              - paragraph [ref=e123]: Alerts
              - heading "Part order requests" [level=3] [ref=e124]
              - paragraph [ref=e125]: Receives part order notification emails. Falls back to contact email if left blank.
            - generic [ref=e127]:
              - generic [ref=e128]: Part order requests email
              - textbox "Part order requests email" [ref=e129]:
                - /placeholder: parts@yourcompany.com
              - generic [ref=e130]: 0 / 320
          - region "notification settings" [ref=e131]:
            - generic [ref=e133]:
              - paragraph [ref=e134]: Alerts
              - heading "New ticket alerts" [level=3] [ref=e135]
              - paragraph [ref=e136]: Configure who receives an email when a new ticket is created.
            - generic [ref=e137]:
              - generic [ref=e138]:
                - text: Enable new ticket notifications
                - combobox "Enable new ticket notifications" [ref=e139]:
                  - option "Enabled" [selected]
                  - option "Disabled"
              - generic [ref=e140]:
                - text: Minimum priority to notify
                - combobox "Minimum priority to notify" [ref=e141]:
                  - option "Low — notify on all tickets" [selected]
                  - option "Normal and above"
                  - option "High and above"
                  - option "Urgent only"
            - paragraph [ref=e142]: No notification recipients configured.
            - generic [ref=e143]:
              - paragraph [ref=e144]: Add recipient
              - generic [ref=e145]:
                - generic [ref=e146]:
                  - generic [ref=e147]: Label
                  - textbox "Label" [ref=e148]:
                    - /placeholder: e.g. Office Manager
                  - generic [ref=e149]: 0 / 200
                - generic [ref=e150]:
                  - generic [ref=e151]: Email address
                  - textbox "Email address" [ref=e152]:
                    - /placeholder: e.g. manager@example.com
                  - generic [ref=e153]: 0 / 320
              - button "Add recipient" [disabled] [ref=e155]
          - button "Save company profile" [ref=e157] [cursor=pointer]
      - complementary "company branding preview" [ref=e158]:
        - generic [ref=e159]:
          - generic [ref=e160]:
            - generic [ref=e161]: JT
            - generic [ref=e162]:
              - paragraph [ref=e163]: Company brand
              - heading "Job Ticket System" [level=3] [ref=e164]
          - generic [ref=e166]: No contact details saved yet.
        - generic [ref=e167]:
          - generic [ref=e169]:
            - paragraph [ref=e170]: Color scheme
            - heading "Live palette" [level=3] [ref=e171]
          - generic [ref=e172]:
            - paragraph [ref=e173]: Configurable
            - generic [ref=e174]:
              - generic [ref=e177]:
                - strong [ref=e178]: Primary
                - code [ref=e179]: "#3157C8"
                - generic [ref=e180]: Buttons, headers
              - generic [ref=e183]:
                - strong [ref=e184]: Secondary
                - code [ref=e185]: "#172033"
                - generic [ref=e186]: Active nav text
              - generic [ref=e189]:
                - strong [ref=e190]: Accent
                - code [ref=e191]: "#087F5B"
                - generic [ref=e192]: Success, approve
          - generic [ref=e193]:
            - paragraph [ref=e194]: Derived automatically
            - generic [ref=e195]:
              - generic [ref=e198]:
                - strong [ref=e199]: Brand hover
                - code [ref=e200]: "#001F90"
                - generic [ref=e201]: Button hover
              - generic [ref=e204]:
                - strong [ref=e205]: Brand soft
                - code [ref=e206]: "#E6EBF8"
                - generic [ref=e207]: Nav hover bg
              - generic [ref=e210]:
                - strong [ref=e211]: Text on primary
                - code [ref=e212]: "#ffffff"
                - generic [ref=e213]: On brand buttons
              - generic [ref=e216]:
                - strong [ref=e217]: Nav active
                - code [ref=e218]: "#001F90"
                - generic [ref=e219]: Active nav link
              - generic [ref=e222]:
                - strong [ref=e223]: Nav active bg
                - code [ref=e224]: "#F1F3FB"
                - generic [ref=e225]: Active nav bg
              - generic [ref=e228]:
                - strong [ref=e229]: Accent hover
                - code [ref=e230]: "#00512D"
                - generic [ref=e231]: Approve hover
        - generic [ref=e232]:
          - generic [ref=e233]:
            - generic [ref=e234]: JT
            - generic [ref=e235]:
              - strong [ref=e236]: Job Ticket System
              - generic [ref=e237]: Company contact details
          - generic [ref=e239]:
            - generic [ref=e240]: Report or customer-facing document
            - strong [ref=e241]: Service summary
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
  27 |     await expect(page.getByText('Part order requests')).toBeVisible()
  28 |   })
  29 | 
  30 |   test('Company Configuration page no longer shows Part order requests section', async ({ page }) => {
  31 |     await page.goto('/manage/company-configuration')
  32 |     await expect(page.getByRole('heading', { name: 'Company Configuration' })).toBeVisible()
> 33 |     await expect(page.getByText('Part order requests')).not.toBeVisible()
     |                                                             ^ Error: expect(locator).not.toBeVisible() failed
  34 |   })
  35 | })
  36 | 
```