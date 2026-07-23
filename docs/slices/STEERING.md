# Shared Slice Steering

## Authority
- `docs/slices/000-slice-planning.md` defines the active sequence and status of every slice.
- This file defines rules inherited by every parent and child slice under `docs/slices/`.
- `docs/codex-model-routing.md` defines the required agent profile, model, reasoning level, escalation, and review route for each executable child.
- A slice-specific exception is valid only when it is explicit, narrow, and compatible with approved upstream decisions.
- Git history is the archive for superseded plans; do not recreate parallel planning trees.

## Parent and child rules
- A parent slice is a steering document only. It defines outcomes, child order, shared decisions, and boundaries.
- A parent slice must never be sent to Codex as one implementation or planning run.
- A child slice must deliver one coherent business capability, migration stage, integration outcome, or planning artifact family.
- Each child must be independently reviewable, testable, documentable, and safe to merge or roll back.
- Child slices run in documented order unless a blocker and revised dependency are recorded.

## Sizing test
Split a proposed child when any of these are true:
- It contains more than one independently useful business outcome.
- It combines master-data capability with calling-workflow integration.
- It combines discovery or dry-run work with destructive migration or cutover.
- It combines backend authorization enforcement with frontend access administration.
- It combines several operational queues that can be reviewed independently.
- It combines installability, caching, session safety, update behavior, and responsive validation without separate acceptance gates.
- A partial failure would require rolling back unrelated behavior.
- The work cannot reasonably fit one focused branch, pull request, and validation report.

Line count is not the sizing rule. Cohesion, dependency boundaries, validation scope, and rollback safety are the sizing rules.

## Existing-system rule
- Begin by auditing the current repository, routes, models, migrations, APIs, permissions, components, tests, wiki, and screenshots relevant to the target child.
- Reuse and repair existing systems before adding new ones.
- Do not create parallel customer, organization, person, employee, technician, equipment, work-order, dispatch, scheduling, parts, reporting, navigation, or mobile systems.
- Preserve existing IDs, tenant boundaries, historical records, permissions, and working workflows unless the target child contains an approved migration stage.

## Ownership boundaries
- Core master-data slices own canonical records, lifecycle, validation, search, and direct management.
- Quick-create children own reusable minimal creation capability for their record type.
- Workflow integration children own caller state preservation, contextual prefill, result handling, automatic selection, permissions, and error return.
- Consistency slices may standardize proven implementations but must not rebuild the owned capability.
- Migration discovery, dry run, cutover, and legacy-path retirement must be separately reviewable when each carries different risk.

## UI and wireframe steering
- UI planning is immediate because the current interface is confusing to users.
- UI planning children may not change production components, CSS, routes, APIs, permissions, workflows, or database structures.
- Broad production shell, navigation, page anatomy, workbench, work-order workspace, or technician-mobile redesign is blocked until the final UI approval child is complete.
- Business slices may make narrowly scoped UI changes required by their capability but must not preempt the approved wireframe direction.
- Before UI approval, use existing UI patterns and document tensions as wireframe inputs.
- After approval, production UI work must conform to the approved information architecture, responsive rules, terminology, accessibility requirements, and interaction patterns unless a reviewed exception is recorded.

## Data and identity steering
- Person is the shared human identity.
- Employee and Technician are roles or workforce profiles attached to Person, not competing identity records.
- Authentication accounts, authorization permissions, descriptive Person roles, and workforce eligibility are distinct concepts.
- Quick-create belongs to the master-data child that owns the record; calling-workflow integration belongs to the applicable workflow child.
- Slice 009 is consistency and regression hardening only.

## Implementation and validation
- Keep each branch, commit, and pull request limited to one child slice or one planning child.
- Add focused backend, frontend, integration, end-to-end, accessibility, responsive, and migration tests where applicable.
- Run relevant builds, tests, migration validation, and static checks.
- Update the wiki and screenshots whenever user-visible behavior changes.
- Record what already worked, what changed, validation performed, known risks, and deferred dependencies.
- Finish, review, and document a child before beginning the next dependent child.

## Agent and model routing
- Before starting a child, read [Codex Model Routing](../codex-model-routing.md) and use its `Slice Routing` table to select the primary agent.
- Begin every execution or review prompt with the required task header from that document.
- The primary agent owns repository audit, implementation or planning output, validation, and handoff for one child only.
- Luna may perform isolated mechanical subtasks but may not own a complete child slice.
- A Sol Extra High independent review must use fresh context when required by the routing table; the implementation pass does not count as its own independent review.
- If the repository audit reveals a Sol-owned risk in a Terra-routed child, stop implementation at that decision boundary and escalate with evidence.
- Model routing cannot approve a proposed parent, unresolved business decision, migration cutover, production action, or final UI direction.

## Codex execution rule
Every Codex prompt must instruct Codex to:
1. Read `000-slice-planning.md`, this file, `../codex-model-routing.md`, the target child, its parent, and any applicable approved UI specification.
2. Declare the required model-routing task header before implementation or review.
3. Audit the current implementation before proposing changes.
4. State the exact systems and files expected to change.
5. Implement only the smallest complete outcome required by the target child.
6. Preserve tenant isolation, authorization, existing data, history, and working workflows.
7. Avoid later-child work and unrelated refactoring.
8. Stop and propose a split when the audit shows the target child violates the sizing test.
9. Stop and escalate when the audit crosses the selected agent's authority or the declared approval gate is unresolved.
10. Run and report relevant validation.
11. Update documentation and screenshots when required.

## Conflict resolution
When documents conflict, use this order:
1. Approved explicit user decision recorded in canonical slice documents.
2. `000-slice-planning.md`.
3. This shared steering file.
4. The target child slice.
5. The parent scope.
6. `docs/codex-model-routing.md` for agent and review selection only.
7. Older general project documentation.
8. Git history and removed plans.

Stop and document the conflict rather than silently choosing a superseded direction when the first four sources disagree.
