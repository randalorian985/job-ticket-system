# Codex Model and Agent Routing

## Purpose
This document defines how agent work is classified, routed, prompted, reviewed, and escalated in this repository.

It governs **execution method**, not product scope. Business priority, slice status, child order, and acceptance criteria remain controlled by `docs/slices/000-slice-planning.md`, `docs/slices/STEERING.md`, and the applicable child slice.

## Required authority chain
Every agent or Codex run must read:

1. `AGENTS.md`
2. this routing document
3. `docs/slices/000-slice-planning.md` when the task belongs to the slice roadmap
4. `docs/slices/STEERING.md`
5. the target child slice
6. the target child's parent steering document
7. any applicable approved UI specification, architecture contract, runbook, or domain documentation

A routing choice may not broaden a slice, skip a dependency, change an approved status, or override an acceptance criterion.

## Default routing principles
- Use the strongest available reasoning capability for architecture, authorization, identity, migrations, data preservation, security, or cross-module dependency analysis.
- Use a focused coding agent for implementation only after the target child and expected validation are explicit.
- Use a review-oriented pass after implementation when the change affects permissions, tenant isolation, migrations, public APIs, workflow state, or user-visible behavior.
- Prefer one focused agent run over a broad multi-domain run.
- Do not route a parent slice as one task.
- Stop and split the work when the repository audit reveals multiple independent outcomes or rollback boundaries.

## Task classification and routing

### 1. Repository or slice planning
Use for:
- defining or resizing parent and child slices
- resolving ownership or dependency conflicts
- architecture sequencing
- tracer-bullet planning
- determining whether work belongs in an existing child

Agent behavior:
- reasoning-first and evidence-driven
- read-only unless the user explicitly requests documentation changes
- inspect current code and canonical documents before recommending structure
- produce decisions, dependencies, risks, and proposed acceptance criteria

Required output:
- current-state findings
- proposed scope and exclusions
- dependency and ownership decisions
- whether further subdivision is required

### 2. Current-state audit
Use for:
- route, role, permission, model, migration, API, component, test, wiki, or screenshot inventory
- determining what is already implemented
- identifying conflicts between documentation and code

Agent behavior:
- read-only
- trace end-to-end behavior rather than relying on file names alone
- distinguish working behavior, partial behavior, defects, and missing behavior
- do not convert findings into production changes in the same run unless the target child explicitly combines audit and repair as one coherent outcome

Required output:
- evidence-backed inventory
- preserved behavior
- defects and gaps
- recommended implementation boundary

### 3. Focused implementation child
Use for:
- one approved business implementation child
- one approved workflow integration child
- one focused production UI child created from the approved UI specification

Agent behavior:
- coding-focused with repository audit first
- implement only the smallest complete outcome required by the child
- reuse existing models, APIs, services, components, permissions, and tests
- avoid unrelated cleanup and later-child work

Required output:
- files and systems changed
- behavior implemented or corrected
- validation performed
- known risks and deferred dependencies

### 4. Identity, authorization, or security work
Use for:
- Person/User linkage
- backend role and policy enforcement
- frontend route and action visibility
- tenant isolation
- account switching, session safety, or cross-account cache safety

Agent behavior:
- strongest available reasoning and security review
- preserve the separation between authentication, authorization, descriptive roles, and workforce eligibility
- validate both allowed and denied paths
- inspect backend enforcement independently from frontend visibility
- never rely on hidden UI controls as authorization

Required output:
- permission matrix affected
- backend enforcement evidence
- frontend visibility behavior
- tenant and negative-path tests

### 5. Migration discovery or dry run
Use for:
- legacy record inventory
- duplicate or ambiguous match detection
- migration mapping design
- dry-run reports and rollback planning

Agent behavior:
- analysis and tooling focused
- no destructive production migration
- preserve source records and produce deterministic reconciliation evidence
- identify manual-review cases explicitly

Required output:
- inventory totals and categories
- deterministic matching rules
- ambiguous/unmatched records
- dry-run results
- cutover prerequisites and rollback plan

### 6. Migration cutover or legacy retirement
Use for:
- approved data backfill
- relationship repointing
- compatibility transition
- retiring legacy creation or read paths

Agent behavior:
- strongest available reasoning with staged execution
- require completed discovery/dry-run dependency
- use idempotent or safely restartable operations where feasible
- preserve auditability and rollback capability
- do not combine unrelated schema or workflow redesign

Required output:
- preconditions
- migration and rollback procedure
- compatibility behavior
- validation totals and exception handling

### 7. UI planning child
Use for UI-001 through UI-006 planning children.

Agent behavior:
- planning and evidence mode only
- no production component, CSS, route, API, permission, workflow, or database changes
- preserve role and tenant boundaries in all wireframes
- produce independently reviewable artifact families
- separate office, technician, responsive, error, session, and accessibility validation where assigned by the child structure

Required output:
- audit evidence or wireframe specification assigned to the child
- role and viewport coverage
- preserved workflow and permission requirements
- unresolved decisions and approval gate

### 8. PWA work
Route each PWA child independently:
- installability and metadata
- service worker and static caching
- update, deep-link, and recovery behavior
- authentication and cross-account safety
- standalone mobile-shell validation

Agent behavior:
- do not combine these failure domains into one run
- do not use PWA work to create a separate mobile frontend or broad redesign
- treat session, cache, and tenant safety as security-sensitive

### 9. Quick-create and workflow integration
Route according to ownership:
- master-data quick-create children own reusable creation capability
- workflow integration children own caller state, contextual prefill, result handling, automatic selection, permissions, and error return
- Slice 009 owns lifecycle consistency, shared infrastructure, regression, and accessibility hardening only

Agent behavior:
- do not rebuild direct management screens or APIs without an approved need
- preserve unsaved caller state
- apply the same permission, tenant, validation, and duplicate-warning rules as direct creation

### 10. Code review and regression review
Use after implementation when risk warrants a separate pass.

Agent behavior:
- review the complete diff against the target child and parent boundaries
- verify no later-child work or unrelated refactoring entered the change
- inspect authorization, tenant isolation, data compatibility, route behavior, and user-visible regressions
- report findings before proposing fixes when the review task is read-only

Required output:
- blocking findings
- non-blocking risks
- missing validation
- scope compliance result

### 11. CI or build failure diagnosis
Agent behavior:
- reproduce or inspect the failing check
- identify the first meaningful failure, not only downstream errors
- keep the fix within the active child
- do not weaken tests, authorization, validation, or build gates to make checks pass

## Prompt packet for every slice run
A valid implementation prompt must include or require the agent to read:
- repository and branch context
- `AGENTS.md`
- this routing document
- the master slice plan
- shared slice steering
- target child and parent
- applicable approved UI specification
- explicit exclusions
- required validation commands
- expected documentation and screenshot updates

The prompt must tell the agent to audit before editing and to stop with a proposed subdivision when the target violates the sizing test.

## Escalation and stop conditions
Stop implementation and report the issue when:
- the requested task targets a parent rather than a child
- a dependency is incomplete or contradictory
- code and canonical documents materially disagree
- the work requires more than one independent rollback boundary
- a migration cutover lacks a completed dry run
- authorization ownership is unclear
- a UI planning child would require production changes
- a business child would establish a competing broad UI direction before UI-006-03 approval
- the requested work enters a deferred domain without an approved slice

## Completion standard
A routed task is complete only when:
- the target child outcome is satisfied without later-child expansion
- relevant builds, tests, migrations, security checks, accessibility checks, or responsive checks are reported
- documentation and screenshots are updated where required
- existing behavior, data, tenant boundaries, and permission boundaries are preserved or intentionally migrated
- the final report distinguishes completed work, validation, risks, and deferred work
