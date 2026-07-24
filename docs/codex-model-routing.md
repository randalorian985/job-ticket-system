# Codex Model and Agent Routing

## Purpose
This document defines how agent work is classified, routed, prompted, reviewed, escalated, and cost-controlled in this repository.

It governs **execution method**, not product scope. Business priority, slice status, child order, dependencies, and acceptance criteria remain controlled by `docs/slices/000-slice-planning.md`, `docs/slices/STEERING.md`, and the applicable child slice.

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

## Cost-control objective
Use the lowest-cost model class and reasoning level that can safely complete the target child. Do not use High or Pro merely because a repository is large, a document is long, or a parent outcome is important. Child sizing exists to keep normal work executable at economical settings.

Model names may change over time. Route by the classes below and map them to the currently available Codex model or picker option in the workspace.

## Model classes and effort levels

### Standard / Medium
Default for routine and normal slice work.

Use a cost-efficient or balanced Codex-capable model in Standard mode with Medium reasoning.

Suitable for:
- documentation maintenance and link corrections
- current-state inventories with clear boundaries
- one isolated CRUD or validation outcome
- straightforward tests and test repairs
- UI planning artifacts and wireframes
- focused frontend or backend implementation using established patterns
- quick-create capability or caller integration when the existing contract is clear
- deterministic CI failures with a localized cause

### High
Use the strongest appropriate non-Pro model with High reasoning when the task has material ambiguity, cross-module consequences, or elevated safety risk.

Suitable for:
- architecture and dependency analysis
- identity, authorization, tenant-isolation, or session-safety work
- schema compatibility and data-preservation analysis
- migration discovery, reconciliation, and dry runs
- nontrivial concurrency, timezone, scheduling, caching, or recovery behavior
- cross-stack debugging where the first failure is unclear
- review of changes affecting permissions, public APIs, workflow state, or historical data

### Pro
Use a Pro model or Pro execution mode only when marginal quality materially affects the outcome and Standard/High is not sufficient.

Suitable for:
- approved destructive migration cutover or legacy retirement
- high-stakes authorization or cross-tenant security decisions with unresolved ambiguity
- major architecture decisions that affect several future slices
- final review of a high-risk migration, security boundary, or irreversible compatibility transition
- a task that failed or remained materially uncertain after a properly scoped High run

Pro is not the default for implementation. It must be justified by a listed trigger and recorded in the prompt and final report.

## Elevation and de-escalation policy
1. Start at the default tier listed for the target task or slice.
2. The agent is authorized to elevate one tier when the repository audit reveals a documented trigger.
3. Before continuing at the higher tier, record:
   - the original tier
   - the elevated tier
   - the concrete trigger
   - why subdivision alone does not remove the risk
4. Elevate from Standard/Medium to High before considering Pro.
5. Elevate to Pro only for a Pro trigger or when a correctly scoped High run remains materially uncertain.
6. Do not elevate to compensate for an oversized child. Stop and subdivide instead.
7. De-escalate later planning, implementation, testing, or documentation runs after the high-risk portion is resolved.
8. A review run may use a higher tier than the implementation run when the review concerns authorization, tenant isolation, migrations, data loss, or irreversible behavior.

## Mandatory routing declaration
Every Codex prompt and final report must state:
- target child or non-slice task
- task classification
- selected model class: Standard/Medium, High, or Pro
- selected reasoning effort or picker option
- cost rationale
- whether elevation is authorized
- elevation triggers that would stop or reroute the run

## Default slice-routing matrix

### Repository and slice planning
Default: **Standard / Medium**.

Elevate to High when resolving competing architecture decisions, ownership conflicts, dependency cycles, migration sequencing, authorization boundaries, or several future-slice consequences.

Use Pro only for a major irreversible architecture decision that remains materially ambiguous after High analysis.

### UI-001 through UI-006 planning children
Default: **Standard / Medium**.

Elevate to High for cross-role permission analysis, complex information architecture spanning several workbenches, accessibility conflicts with workflow rules, or a final approval gate with substantial production consequences.

Do not use Pro for ordinary wireframe production or usability audits.

### Slices 001 through 004: master data and quick-create
Default: **Standard / Medium**.

Elevate to High when the child requires schema compatibility decisions, duplicate reconciliation, tenant-boundary changes, legacy API behavior, or ambiguous ownership relationships.

Quick-create capability and workflow integration remain separate regardless of model tier.

### Slice 005: identity, workforce, authorization, and migration
- `005-01` Person/User linkage: **High**.
- `005-02` backend authorization: **High**.
- `005-03` frontend access administration: **High** when permission behavior changes; otherwise Standard/Medium for presentation-only work after enforcement is fixed.
- `005-04` workforce eligibility: **High** when eligibility affects assignments, access, or historical records.
- `005-05` migration inventory and dry run: **High**.
- `005-06` migration cutover and legacy retirement: **Pro** by default, unless the approved cutover is demonstrably reversible, fully rehearsed, and the user explicitly accepts High.

### Slice 006: work-order intake and backlog
Default: **Standard / Medium** for one focused child using established records and APIs.

Elevate to High for historical-data compatibility, billing-party relationships, permission boundaries, multi-tenant selection, or changes to work-order lifecycle/state semantics.

### Slice 007: assignment, scheduling, dispatch, and technician queue
Default: **Standard / Medium** for isolated UI, API, or workflow work using established assignment and scheduling contracts.

Elevate to High for timezone/calendar integration, overlapping assignments, technician eligibility, cross-role visibility, concurrency, or dispatch decisions spanning several data sources.

### Slice 008: PWA installation and mobile foundation
- `008-01` installability and metadata: **Standard / Medium**.
- `008-02` service worker and static caching: **High** when cache scope or update safety is nontrivial; otherwise Standard/Medium.
- `008-03` updates, deep links, and network recovery: **High**.
- `008-04` authentication and cross-account safety: **High**, with Pro allowed for unresolved cross-user or cross-tenant exposure risk.
- `008-05` standalone mobile-shell validation: **Standard / Medium**, elevating to High for session, deep-link, or role-boundary defects.

### Slice 009: quick-add consistency and hardening
Default: **Standard / Medium**.

Elevate to High only when shared infrastructure changes several workflows, permissions are inconsistent, or regression behavior cannot be isolated.

### Code review and regression review
Default: **Standard / Medium** for ordinary scope and quality review.

Use High for permissions, tenant isolation, migrations, public APIs, workflow-state transitions, caching/session behavior, or historical-data compatibility.

Use Pro for final review of destructive migration cutover, unresolved security exposure, or another irreversible high-value change.

### CI and build diagnosis
Default: **Standard / Medium** for deterministic localized failures.

Elevate to High for nondeterministic failures, cross-stack interactions, environment-versus-code ambiguity, concurrency, migrations, or permission-sensitive integration tests.

Do not use Pro merely to retry a failing build.

## Task classification and execution requirements

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
- recommended model class for each resulting child

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
- whether the implementation should remain Standard/Medium or elevate to High

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
- actual model class used and any elevation rationale

### 4. Identity, authorization, or security work
Use for:
- Person/User linkage
- backend role and policy enforcement
- frontend route and action visibility
- tenant isolation
- account switching, session safety, or cross-account cache safety

Agent behavior:
- High by default
- preserve the separation between authentication, authorization, descriptive roles, and workforce eligibility
- validate both allowed and denied paths
- inspect backend enforcement independently from frontend visibility
- never rely on hidden UI controls as authorization

Required output:
- permission matrix affected
- backend enforcement evidence
- frontend visibility behavior
- tenant and negative-path tests
- whether Pro review is warranted

### 5. Migration discovery or dry run
Use for:
- legacy record inventory
- duplicate or ambiguous match detection
- migration mapping design
- dry-run reports and rollback planning

Agent behavior:
- High by default
- no destructive production migration
- preserve source records and produce deterministic reconciliation evidence
- identify manual-review cases explicitly

Required output:
- inventory totals and categories
- deterministic matching rules
- ambiguous or unmatched records
- dry-run results
- cutover prerequisites and rollback plan

### 6. Migration cutover or legacy retirement
Use for:
- approved data backfill
- relationship repointing
- compatibility transition
- retiring legacy creation or read paths

Agent behavior:
- Pro by default
- require completed discovery and dry-run dependency
- use idempotent or safely restartable operations where feasible
- preserve auditability and rollback capability
- do not combine unrelated schema or workflow redesign

Required output:
- preconditions
- migration and rollback procedure
- compatibility behavior
- validation totals and exception handling
- independent review result

### 7. UI planning child
Use for UI-001 through UI-006 planning children.

Agent behavior:
- Standard/Medium by default
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
- follow the slice-specific tier in the matrix
- do not combine these failure domains into one run
- do not use PWA work to create a separate mobile frontend or broad redesign
- treat session, cache, and tenant safety as security-sensitive

### 9. Quick-create and workflow integration
Route according to ownership:
- master-data quick-create children own reusable creation capability
- workflow integration children own caller state, contextual prefill, result handling, automatic selection, permissions, and error return
- Slice 009 owns lifecycle consistency, shared infrastructure, regression, and accessibility hardening only

Agent behavior:
- Standard/Medium by default
- do not rebuild direct management screens or APIs without an approved need
- preserve unsaved caller state
- apply the same permission, tenant, validation, and duplicate-warning rules as direct creation
- elevate to High when shared permission, data ownership, or compatibility behavior is ambiguous

### 10. Code review and regression review
Use after implementation when risk warrants a separate pass.

Agent behavior:
- select the review tier independently from the implementation tier
- review the complete diff against the target child and parent boundaries
- verify no later-child work or unrelated refactoring entered the change
- inspect authorization, tenant isolation, data compatibility, route behavior, and user-visible regressions
- report findings before proposing fixes when the review task is read-only

Required output:
- blocking findings
- non-blocking risks
- missing validation
- scope compliance result
- review model class and rationale

### 11. CI or build failure diagnosis
Agent behavior:
- Standard/Medium by default
- reproduce or inspect the failing check
- identify the first meaningful failure, not only downstream errors
- keep the fix within the active child
- do not weaken tests, authorization, validation, or build gates to make checks pass
- elevate to High only for the triggers in the routing matrix

## Planning-document quality gate
Before approving or routing a slice:

A parent must contain:
- goal or outcome
- status
- dependencies
- required child sequence
- shared decisions and boundaries
- shared acceptance criteria
- explicit guardrail that the parent is not executable

A child must contain:
- one primary outcome
- dependencies
- in-scope and out-of-scope boundaries
- acceptance criteria
- validation requirements
- documentation or screenshot requirements where applicable
- rollback, recovery, or compatibility notes where risk applies

Missing required sections must be corrected before implementation routing.

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
- selected model class and reasoning effort
- cost rationale
- authorized elevation path and triggers
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
- the selected tier is insufficient and no authorized elevation path was recorded
- Pro would be used only to compensate for oversized or poorly defined scope

## Completion standard
A routed task is complete only when:
- the target child outcome is satisfied without later-child expansion
- relevant builds, tests, migrations, security checks, accessibility checks, or responsive checks are reported
- documentation and screenshots are updated where required
- existing behavior, data, tenant boundaries, and permission boundaries are preserved or intentionally migrated
- the final report distinguishes completed work, validation, risks, deferred work, model class used, and elevation history
