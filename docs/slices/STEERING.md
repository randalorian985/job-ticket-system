# Shared Slice Steering

## Authority
- `docs/slices/000-slice-planning.md` defines the active sequence and status of every slice.
- This file defines rules inherited by every parent and child slice under `docs/slices/`.
- A slice-specific decision overrides this file only when the exception is explicit, narrow, and does not conflict with an approved upstream decision.
- Git history is the archive for superseded plans; do not recreate parallel planning trees.

## Slice boundaries
- A slice must deliver or prove one coherent business capability or one coherent planning outcome.
- Parent scopes are steering documents only and must never be sent to Codex as one implementation task.
- Child slices must be implemented in their documented order unless a blocker and revised dependency are recorded.
- Do not pull later-slice convenience features into the current slice.
- Do not combine unrelated cleanup, redesign, schema work, or workflow expansion with a slice.

## Existing-system rule
- Begin by auditing the current repository, routes, models, migrations, APIs, permissions, components, tests, wiki, and screenshots relevant to the slice.
- Reuse and repair existing systems before adding new ones.
- Do not create parallel customer, organization, person, employee, technician, equipment, work-order, dispatch, scheduling, parts, reporting, navigation, or mobile systems.
- Preserve existing IDs, tenant boundaries, historical records, permissions, and working workflows unless the slice includes an approved migration.

## UI and wireframe steering
- The UI planning track is immediate because the current interface is confusing to users.
- UI-001 through UI-006 are planning-only and may not change production components, CSS, routes, APIs, permissions, workflows, or database structures.
- Broad production shell, navigation, page-anatomy, workbench, work-order workspace, or technician-mobile redesign is blocked until UI-006 is approved.
- Business slices may make narrowly scoped UI changes required to complete their capability, but must not preempt or contradict the approved wireframe direction.
- Before UI-006 approval, use existing UI patterns for required capability work and document any tension with the wireframe track.
- After UI-006 approval, new production UI work must conform to the approved information architecture, responsive rules, terminology, accessibility requirements, and interaction patterns unless a reviewed exception is documented.
- Wireframes must preserve all authorized capabilities and must be validated through real task walkthroughs, not visual preference alone.

## Data and identity steering
- Person is the shared human identity.
- Employee and Technician are roles or workforce profiles attached to Person, not competing identity records.
- Authentication accounts, authorization permissions, descriptive Person roles, and workforce eligibility remain distinct concepts.
- Quick-create belongs to the master-data slice that owns the record; calling-workflow integration belongs to the applicable workflow child slice.
- Do not defer all quick-add behavior to Slice 009; Slice 009 is consistency and hardening only.

## Implementation and validation
- Keep each branch, commit, and pull request limited to one child slice or one planning slice.
- Add focused backend, frontend, integration, end-to-end, accessibility, responsive, and migration tests where applicable.
- Run relevant builds, tests, migration validation, and static checks.
- Update the wiki and screenshots whenever user-visible behavior changes.
- Record what already worked, what changed, validation performed, known risks, and deferred dependencies.
- Finish, review, and document a slice before beginning the next dependent slice.

## Codex execution rule
Every Codex prompt for a slice must instruct Codex to:
1. Read `docs/slices/000-slice-planning.md`, this file, the target slice, its parent scope, and applicable approved UI specification.
2. Audit the current implementation before proposing changes.
3. State the exact files and systems expected to change.
4. Implement only the smallest complete capability required by the target child slice.
5. Preserve tenant isolation, authorization, existing data, history, and working workflows.
6. Avoid later-slice work and unrelated refactoring.
7. Run and report relevant validation.
8. Update documentation and screenshots when required.

## Conflict resolution
When documents conflict, use this order:
1. Approved explicit user decision recorded in the current canonical slice documents.
2. `docs/slices/000-slice-planning.md`.
3. This shared steering file.
4. The target child slice.
5. The parent scope.
6. Older general project documentation.
7. Git history and removed plans.

Stop and document the conflict rather than silently choosing a superseded direction when the first four sources disagree.
