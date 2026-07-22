# MVP Slice Roadmap

## Purpose
This roadmap aligns the repository with Kevin's definition of slices: each slice delivers the smallest complete business capability that proves part of the architecture and becomes the foundation for the next slice.

## Primary tracer bullets
1. Customer Organization -> Service Location -> Equipment -> Work Order -> Backlog
2. Backlog Work Order -> Technician and Time Assignment -> Schedule Block
3. Proven Online Workflows -> Installable PWA -> Mobile-Ready Installed Experience

## Required sequence
1. [Organizations](01-organizations.md)
2. [Customer Service Locations](02-customer-service-locations.md)
3. [People and Contact Roles](03-people-and-contact-roles.md)
4. [Equipment Types and Customer Equipment](04-equipment-types-and-customer-equipment.md)
5. [Employees](05-employees.md)
6. [Work Order Intake](06-work-order-intake.md)
7. [Basic Scheduling Board](07-basic-scheduling-board.md)
8. [PWA Installation and Mobile Foundation](08-pwa-installation-mobile-foundation.md)
9. [Ticket Quick-Add](09-ticket-quick-add.md)

## Slice steering
- Treat this file as the source of truth for sequence and dependencies.
- Work on one numbered slice at a time unless an explicit dependency correction is approved.
- A slice must deliver one complete business capability, not a broad collection of unrelated improvements.
- Begin every slice by auditing the existing repository and documenting what already satisfies the slice.
- Reuse and repair existing models, APIs, routes, components, permissions, migrations, and tests before adding anything new.
- Do not create parallel master-data, ticket, scheduling, mobile, or PWA systems.
- Keep database, backend, frontend, tests, wiki, and screenshots within the same slice when they are required to complete that capability.
- Do not pull later-slice convenience features into an earlier slice unless the earlier capability cannot function without them.
- Preserve existing data and backward compatibility unless the slice explicitly defines a reviewed migration.
- Preserve tenant isolation and role-based access at every layer.
- Update the wiki and relevant screenshots whenever workflow or UI behavior changes.
- Validate desktop and mobile behavior for every user-facing slice.
- After Slice 08, also validate applicable workflows in installed-PWA standalone mode.
- Full offline ticket editing, background sync, push notifications, GPS tracking, and native packaging are not part of Slice 08 and require future approved slices.
- Finish, test, document, and review each slice before beginning the next one.
- Keep each branch, commit, and PR limited to one slice.

## Codex start-of-slice checklist
1. Read this roadmap and the target slice file.
2. Inspect the current implementation and related wiki pages.
3. Identify what already works, what is missing, and what is incorrect.
4. State the files and systems expected to change.
5. Confirm no later-slice work is being pulled forward.
6. Implement the smallest complete capability that satisfies the acceptance criteria.
7. Run relevant backend, frontend, and end-to-end validation.
8. Update documentation and screenshots.
9. Summarize completed work, validation results, remaining risks, and deferred dependencies.

## PWA placement rationale
PWA installation follows Work Order Intake and Basic Scheduling because the online business workflows must be stable before they are wrapped in an installed application shell. The PWA slice establishes installability, safe static caching, update handling, authentication behavior, and mobile-shell reliability. It must not attempt full offline business-data synchronization.

Ticket Quick-Add follows the PWA foundation so its final mobile interaction can be validated in browser and standalone installed modes. Quick-Add still depends functionally on the master-data and Work Order Intake slices rather than on scheduling.

## Existing contact documents
The previous people/contact documents remain useful as supporting implementation detail:
- `people-companies-roles-and-ticket-contacts.md` is a contact design reference.
- `people-01-multiple-saved-roles.md` supports Slice 03.
- `people-02-ticket-contact-assignments.md` supports Slice 06.
- `people-03-ticket-contact-quick-add.md` supports Slice 09.

The old `08-ticket-quick-add.md` path is retained only as a redirect to Slice 09. It is not a separate implementation task.

## Future mobile slices
After the online and installed-PWA workflows are proven, future slices may separately address:
- Offline technician work-order viewing
- Offline work notes and time capture
- Background synchronization and conflict handling
- Offline photo queues
- Push notifications
- Device capabilities such as camera, GPS, and barcode scanning

These must not be bundled into the PWA installation slice.