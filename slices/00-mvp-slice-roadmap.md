# MVP Slice Roadmap

## Purpose
This roadmap aligns the repository with Kevin's definition of slices: each slice delivers the smallest complete business capability that proves part of the architecture and becomes the foundation for the next slice.

## Primary tracer bullets
1. Customer Organization -> Service Location -> Equipment -> Work Order -> Backlog
2. Backlog Work Order -> Technician and Time Assignment -> Schedule Block

## Required sequence
1. [Organizations](01-organizations.md)
2. [Customer Service Locations](02-customer-service-locations.md)
3. [People and Contact Roles](03-people-and-contact-roles.md)
4. [Equipment Types and Customer Equipment](04-equipment-types-and-customer-equipment.md)
5. [Employees](05-employees.md)
6. [Work Order Intake](06-work-order-intake.md)
7. [Basic Scheduling Board](07-basic-scheduling-board.md)
8. [Ticket Quick-Add](08-ticket-quick-add.md)

## Shared Codex guardrails
For every slice:
- Audit the existing implementation first; do not assume greenfield.
- Reuse working models, APIs, components, permissions, and routes.
- Implement only missing or incorrect behavior required by that slice.
- Preserve tenant isolation, existing data, and current workflows.
- Avoid unrelated redesign or parallel systems.
- Add focused backend, frontend, and end-to-end tests where applicable.
- Run relevant validation commands.
- Update the system wiki and screenshots when UI behavior changes.
- Document dependencies that belong to a later slice instead of pulling them forward.
- Keep each branch, commit, and PR limited to one slice.

## Existing contact documents
The previous people/contact documents remain useful as supporting implementation detail:
- `people-companies-roles-and-ticket-contacts.md` is a contact design reference.
- `people-01-multiple-saved-roles.md` supports Slice 03.
- `people-02-ticket-contact-assignments.md` supports Slice 06.
- `people-03-ticket-contact-quick-add.md` supports Slice 08.

They are not the top-level roadmap.