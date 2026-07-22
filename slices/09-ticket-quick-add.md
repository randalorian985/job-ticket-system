# Slice 09: Ticket Quick-Add

## Goal
Allow dispatchers and managers to create missing organizations, people, service locations, and equipment without leaving work-order intake.

## Dependencies
Requires Slices 01 through 06. Scheduling and PWA installability are not functional prerequisites, but this slice follows the PWA foundation in the roadmap so the final quick-add experience can be validated in both browser and installed-app modes.

## Existing-system rule
Audit all current quick-add drawers, modals, save behavior, counters, route state, and mobile workflow. Consolidate and repair existing behavior rather than creating parallel forms.

## Scope
- Quick-add organization from customer or billing organization selectors.
- Quick-add person from service or billing contact selectors.
- Quick-add service location with the selected customer prefilled.
- Quick-add customer equipment with the selected customer and location prefilled.
- Return the newly created record to the work order and automatically select it.
- Preserve unsaved work-order changes while quick-add is open.
- Respect existing master-data permissions.
- Ensure desktop, mobile-browser, and installed-PWA workflows do not require leaving or deeply scrolling away from the ticket context.

## Supporting detail
Use `people-03-ticket-contact-quick-add.md` for detailed person and organization quick-add rules.

## Business rules
- Quick-add collects only the minimum fields needed for a valid record.
- Full editing remains available in the appropriate master-data screen.
- Failed quick-add saves must not discard work-order changes.
- A user who can edit a ticket but cannot create master data must not receive unauthorized quick-add access.
- Newly created records must respect tenant isolation and existing duplicate warnings.
- Quick-add must not rely on browser-only navigation that fails in standalone PWA mode.

## Acceptance criteria
- Each supported selector can launch the appropriate quick-add flow.
- Customer, organization, and location context is prefilled correctly.
- The new record is selected after save.
- Canceling quick-add returns to the unchanged work order.
- Mobile-browser, installed-PWA, and desktop flows remain usable.
- Existing quick-add behavior does not regress.

## Tests
- Quick-add organization, person, location, and equipment.
- Automatic selection and unsaved-state preservation.
- Cancel and failure recovery.
- Permission and tenant-boundary checks.
- Mobile-browser and standalone-PWA end-to-end workflow.

## Definition of done
All required quick-add flows work inside the existing work-order intake experience across desktop, mobile browser, and installed PWA modes; tests pass; and the wiki and screenshots are updated.