# Microsoft 365 Graph Mailer Setup

## Purpose

Use this guide to connect Job Ticket System outgoing notifications to Microsoft 365 Graph mail.

This is the recommended mailer for system notifications because it uses an application registration and client credentials. No user has to stay signed in, and no human mailbox session has to remain connected.

## What You Need

Before starting, make sure you have:

- access to the Microsoft Entra admin center for the Microsoft 365 tenant;
- permission to create or update an app registration;
- permission to grant admin consent for Microsoft Graph application permissions;
- a Microsoft 365 mailbox that will send system notifications, such as `dispatch@yourcompany.com`;
- access to Admin > Mailer Settings in Job Ticket System.

## Values To Collect

You will enter these values in Job Ticket System:

| Job Ticket System field | Microsoft value |
| --- | --- |
| Tenant ID or domain | Microsoft Entra Directory tenant ID, or tenant domain such as `contoso.onmicrosoft.com` |
| Application client ID | Application (client) ID from the app registration Overview page |
| Client secret | Secret Value from Certificates & secrets, not the Secret ID |
| Sender mailbox | The mailbox that sends notifications, such as `dispatch@yourcompany.com` |

## Step 1: Choose The Sender Mailbox

Create or choose one mailbox for system notifications.

Recommended:

- use a shared or service mailbox name people recognize, such as `dispatch@yourcompany.com`;
- keep the mailbox active in Exchange Online;
- make sure recipients can receive mail from that address;
- use the same mailbox in the Job Ticket System Sender mailbox field.

## Step 2: Register The Microsoft Entra App

1. Open the Microsoft Entra admin center.
2. Go to Entra ID > App registrations.
3. Select New registration.
4. Name the app `Job Ticket System Mailer`.
5. Choose single tenant access for the company tenant.
6. Leave redirect URI blank. This setup uses client credentials, not browser sign-in.
7. Select Register.
8. On the Overview page, copy:
   - Application (client) ID;
   - Directory (tenant) ID.

## Step 3: Create A Client Secret

1. In the app registration, go to Certificates & secrets.
2. Select New client secret.
3. Add a clear description, such as `Job Ticket System mailer`.
4. Choose an expiration period that matches company policy.
5. Select Add.
6. Copy the secret Value immediately.

Store the secret in a temporary secure location only long enough to enter it into Job Ticket System. Microsoft will not show the value again after you leave the page.

## Step 4: Add Microsoft Graph Mail Permission

1. In the app registration, go to API permissions.
2. Select Add a permission.
3. Choose Microsoft Graph.
4. Choose Application permissions.
5. Search for `Mail.Send`.
6. Select `Mail.Send`.
7. Select Add permissions.
8. Select Grant admin consent for the tenant.
9. Confirm the consent status shows granted.

Important: Microsoft Graph application `Mail.Send` allows app-only sending without a signed-in user. Treat the app registration and client secret like production credentials.

## Step 5: Restrict Mailbox Access Where Possible

Because application mail permissions are powerful, restrict the app to the intended sender mailbox when your Microsoft 365 administration model supports it.

Recommended options:

- use Exchange Online Application RBAC to scope the app to the sender mailbox or a small mailbox scope;
- test that the service principal is only in scope for the intended mailbox;
- avoid using a broad app registration for unrelated automation.

This is a security hardening step, but it is important. Without scoping, an application permission can be broader than this application needs.

## Step 6: Enter Settings In Job Ticket System

1. Sign in to Job Ticket System as an Admin.
2. Open Manage > Mailer Settings.
3. Select Microsoft 365 Graph.
4. Set Outgoing mail to Enabled.
5. Enter:
   - Tenant ID or domain;
   - Application client ID;
   - Client secret;
   - Sender mailbox.
6. Optionally enter:
   - From name, such as `Service Dispatch`;
   - Reply-to address;
   - App base URL.
7. Select Save mailer settings.

After a valid save, the status should show:

`Connected via Microsoft 365 Graph.`

## Step 7: Send A Test Email

1. In Mailer Settings, enter a test recipient.
2. Select Send test email.
3. Confirm the page shows the test email was sent.
4. Confirm the recipient receives the message.
5. Check the sender mailbox Sent Items if delivery needs confirmation.

## Troubleshooting

### Status Still Says Settings Are Incomplete

Check that all required Microsoft 365 Graph fields are filled:

- Tenant ID or domain;
- Application client ID;
- Client secret;
- Sender mailbox.

If you cleared the saved client secret, enter a new one before saving.

### Test Fails With An Authentication Error

Check:

- the client secret Value was copied, not the Secret ID;
- the secret is not expired;
- the tenant ID or tenant domain is correct;
- the Application client ID is from the app registration Overview page;
- API permission admin consent was granted.

### Test Fails With A Permission Error

Check:

- Microsoft Graph `Mail.Send` was added as an Application permission, not Delegated;
- admin consent is granted;
- Exchange Online app scoping, if configured, includes the sender mailbox;
- the sender mailbox exists and is active.

### Test Succeeds But Recipients Do Not See The Email

Check:

- recipient junk or quarantine;
- Exchange message trace;
- outbound mail policies;
- whether the recipient domain blocks the sender;
- whether the sender mailbox has delivery restrictions.

## Ongoing Maintenance

- Rotate the client secret before it expires.
- Update Job Ticket System with the new secret after rotation.
- Keep a calendar reminder for secret expiration.
- Remove old client secrets after the new one tests successfully.
- Review the app registration periodically to confirm it only has the permissions it needs.

## References

- Microsoft Learn: Register an app in Microsoft Entra ID - https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
- Microsoft Learn: OAuth 2.0 client credentials flow - https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
- Microsoft Learn: Microsoft Graph user sendMail - https://learn.microsoft.com/en-us/graph/api/user-sendmail
- Microsoft Learn: Exchange Online RBAC for applications - https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac
