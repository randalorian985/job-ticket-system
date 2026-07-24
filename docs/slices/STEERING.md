# Shared Slice Steering

## Authority
- `AGENTS.md` defines repository-wide engineering, safety, architecture, authorization, and documentation rules inherited by all slice work.
- `docs/codex-model-routing.md` defines task classification, cost-aware model selection, reasoning effort, prompt inputs, review expectations, and escalation rules. It governs execution method and may not change product scope, status, sequence, dependencies, or acceptance criteria.
- `docs/slices/000-slice-planning.md` defines the active sequence and status of every slice.
- This file defines sizing, ownership, and execution rules inherited by every parent and child slice under `docs/slices/`.
- A slice-specific exception is valid only when it is explicit, narrow, compatible with `AGENTS.md`, and compatible with approved upstream decisions.
- Git history is the archive for superseded plans; do not recreate parallel planning trees.

## Required reading
Before any slice planning, implementation, migration, UI, review, or validation run, read:

1. `AGENTS.md`
2. `docs/codex-model-routing.md`
3. `000-slice-planning.md`
4. this file
5. the target child slice
6. the target child's parent steering document
7. any applicable approved UI specification, architecture contract, runbook, or domain documentation

A prompt that omits this packet is incomplete.

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

Line count is not the sizing rule. Cohesion, dependency boundaries, validation scope, failure isolation, and rollback safety are the sizing rules.

## Existing-system rule
- Begin by auditing the current repository, routes, models, migrations, APIs, permissions, components, tests, wiki, and screenshots relevant to the target child.
- Reuse and repair existing systems before adding new ones.
- Do not create parallel customer, organization, person, employee, technician, equipment, work-order, dispatch, scheduling, parts, reporting, navigation, or mobile systems.
- Preserve existing IDs, tenant boundaries, historical records, permissions, and working workflows unless the target child contains an approved migration stage.
- Follow `AGENTS.md` for repository-wide route, authorization, domain, and deferred-scope boundaries.

## Ownership boundaries
- Core master-data slices own canonical records, lifecycle, validation, search, and direct management.
- Quick-create children own reusable minimal creation capability for their record type.
- Workflow integration children own caller state preservation, contextual prefill, result handling, automatic selection, permissions, and error return.
- Consistency slices may standardize proven implementations but must not rebuild the owned capability.
- Migration discovery, dry run, cutover, and legacy-path retirement must be separately reviewable when each carries different risk.
- Backend authorization enforcement and frontend access administration remain separately reviewable concerns.

## UI and wireframe steering
- UI planning is immediate because the current interface is confusing to users.
- UI planning children may not change production components, CSS, routes, APIs, permissions, workflows, or database structures.
- Broad production shell, navigation, page anatomy, workbench, work-order workspace, or technician-mobile redesign is blocked until UI-006-03 is approved.
- Business slices may make narrowly scoped UI changes required by their capability but must not preempt the approved wireframe direction.
- Before UI approval, use existing UI patterns and document tensions as wireframe inputs.
- After approval, production UI work must conform to the approved information architecture, responsive rules, terminology, accessibility requirements, and interaction patterns unless a reviewed exception is recorded.
- Route UI work according to `docs/codex-model-routing.md`; a UI planning route never authorizes production changes.

## Data and identity steering
- Person is the shared human identity.
- Employee and Technician are roles or workforce profiles attached to Person, not competing identity records.
- Authentication accounts, authorization permissions, descriptive Person roles, and workforce eligibility are distinct concepts.
- Quick-create belongs to the master-data child that owns the record; calling-workflow integration belongs to the applicable workflow child.
- Slice 009 is consistency and regression hardening only.
- Identity, authorization, tenant, migration, and session-safety work must use the heightened routing and review rules in `docs/codex-model-routing.md`.

## Model and cost steering
- Start each run at the lowest model class and reasoning effort assigned by `docs/codex-model-routing.md`.
- Standard/Medium is the normal default for routine planning, audits, UI artifacts, focused implementation, testing, and documentation.
- High is reserved for documented ambiguity, cross-module effects, authorization, tenant isolation, migration analysis, data preservation, session safety, or similarly elevated risk.
- Pro is reserved for the explicit Pro triggers in the routing guide, including approved destructive cutover, unresolved high-stakes security ambiguity, irreversible architecture decisions, or material uncertainty after a correctly scoped High run.
- An agent may elevate one tier only when it records the original tier, new tier, concrete trigger, and why subdivision does not remove the risk.
- Never use High or Pro to compensate for an oversized child; stop and split the child instead.
- De-escalate later implementation, testing, documentation, and review work after the high-risk portion is resolved when the routing matrix permits it.

## Implementation and validation
- Keep each branch, logical commit, pull request, and validation report limited to one child slice or one planning child.
- Use descriptive commit messages that state the logical outcome rather than only the file operation.
- Add focused backend, frontend, integration, end-to-end, accessibility, responsive, security, and migration tests where applicable.
- Run relevant builds, tests, migration validation, and static checks.
- Update the wiki and screenshots whenever user-visible behavior changes.
- Record what already worked, what changed, validation performed, known risks, deferred dependencies, selected model class, and any elevation history.
- Finish, review, and document a child before beginning the next dependent child.

## Codex execution rule
Every Codex prompt must instruct Codex to:
1. Read `AGENTS.md`, `docs/codex-model-routing.md`, `000-slice-planning.md`, this file, the target child, its parent, and any applicable approved UI specification.
2. Classify the task using the routing document.
3. State the selected model class, reasoning effort or picker option, cost rationale, and authorized elevation triggers.
4. Audit the current implementation before proposing changes.
5. State the exact systems and files expected to change.
6. Implement only the smallest complete outcome required by the target child.
7. Preserve tenant isolation, authorization, existing data, history, and working workflows.
8. Avoid later-child work and unrelated refactoring.
9. Stop and propose a split when the audit shows the target child violates the sizing test.
10. Stop when a routing escalation or dependency condition is not satisfied.
11. Record any model elevation before continuing at the higher tier.
12. Run and report relevant validation.
13. Update documentation and screenshots when required.

## Conflict resolution
Apply each document within its authority domain:
- `AGENTS.md` controls repository-wide engineering, safety, architecture, authorization, and deferred-domain rules.
- `000-slice-planning.md` controls slice status, product sequence, and active parent/child structure.
- `docs/codex-model-routing.md` controls task classification, model class, reasoning effort, cost routing, and execution method only.
- This file controls shared slice sizing, ownership, and execution rules.
- The target child controls its approved outcome and acceptance criteria within those upstream rules.

When documents conflict, use this order:
1. Approved explicit user decision recorded in canonical documents.
2. `AGENTS.md` for repository-wide rules and safety boundaries.
3. `000-slice-planning.md` for slice scope, status, and sequence.
4. `docs/codex-model-routing.md` for model routing and execution method.
5. This shared steering file.
6. The target child slice.
7. The parent scope.
8. Older general project documentation.
9. Git history and removed plans.

Stop and document the conflict rather than silently choosing a superseded direction when the governing sources disagree.
