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

A routing choice may not broaden a slice, skip a dependency, change status or sequence, or override acceptance criteria.

## Cost-control objective
Use the lowest-cost model class and reasoning effort that can safely complete the target child.

Do not use High or Pro merely because the repository is large, a document is long, or a parent outcome is important. Child sizing exists to keep normal work executable at economical settings.

Model names and pricing may change. Route by the stable classes below, map each class to a currently available model or picker option, and record the exact model identifier used for every run.

## Model classes and effort levels

### Standard / Medium
Default for routine and normally bounded slice work.

Use a cost-efficient or balanced Codex-capable model with Medium reasoning.

Suitable for:
- documentation maintenance and link corrections
- current-state inventories with clear boundaries
- isolated CRUD, validation, or presentation outcomes
- straightforward tests and test repairs
- UI planning artifacts and wireframes
- focused frontend or backend implementation using established patterns
- quick-create capability or caller integration when the contract is clear
- deterministic CI failures with a localized cause

### High
Use an appropriate non-Pro model with High reasoning when the task has material ambiguity, cross-module consequences, or elevated safety risk.

Suitable for:
- architecture and dependency analysis
- identity, authorization, tenant isolation, or session safety
- schema compatibility and data-preservation analysis
- migration discovery, reconciliation, and dry runs
- nontrivial concurrency, timezone, scheduling, caching, or recovery behavior
- cross-stack debugging where the first failure is unclear
- review of changes affecting permissions, public APIs, workflow state, or historical data

### Pro
Use a Pro model or Pro execution mode only when marginal quality materially affects the outcome and Standard/Medium or High is not sufficient.

Suitable for:
- approved destructive migration cutover or legacy retirement
- unresolved high-stakes authorization or cross-tenant security decisions
- major irreversible architecture decisions affecting several future slices
- final review of a high-risk migration, security boundary, or irreversible compatibility transition
- a correctly scoped task that remains materially uncertain after a High run

Pro is not the default for implementation. It must be justified by a listed trigger and recorded in the prompt and final report.

## Elevation and de-escalation policy
1. Start at the default tier listed for the target task or slice.
2. The agent may elevate one tier when the repository audit reveals a documented trigger.
3. Before continuing at the higher tier, record:
   - original model class and exact model identifier
   - elevated model class and exact model identifier
   - concrete trigger
   - cost rationale
   - why subdivision alone does not remove the risk
4. Elevate from Standard/Medium to High before considering Pro.
5. Elevate to Pro only for a Pro trigger or when a correctly scoped High run remains materially uncertain.
6. Never elevate to compensate for an oversized child. Stop and subdivide instead.
7. De-escalate later planning, implementation, testing, documentation, or review after the high-risk portion is resolved.
8. A review run may use a higher tier than implementation when it covers authorization, tenant isolation, migrations, data loss, or irreversible behavior.

## Mandatory routing declaration
Every Codex prompt and final report must state:
- target child or non-slice task
- task classification
- selected model class: Standard/Medium, High, or Pro
- exact model identifier or picker label actually used
- selected reasoning effort or execution mode
- cost rationale
- whether elevation is authorized
- elevation triggers that would stop or reroute the run
- actual elevation and de-escalation history, if any

Do not report only a model class. The exact model identifier is required for cost and quality auditability.

## Default slice-routing matrix

### Repository and slice planning
Default: **Standard / Medium**.

Elevate to High for competing architecture decisions, ownership conflicts, dependency cycles, migration sequencing, authorization boundaries, or consequences spanning several future slices.

Use Pro only for a major irreversible architecture decision that remains materially ambiguous after High analysis.

### UI-001 through UI-006 planning children
Default: **Standard / Medium**.

Elevate to High for cross-role permission analysis, complex information architecture spanning several workbenches, accessibility conflicts with workflow rules, or a final approval gate with substantial production consequences.

Do not use Pro for ordinary wireframe production or usability audits.

### Slices 001 through 004: master data and quick-create
Default: **Standard / Medium**.

Elevate to High for schema compatibility, duplicate reconciliation, tenant-boundary changes, legacy API behavior, or ambiguous ownership relationships.

Quick-create capability and workflow integration remain separate regardless of model tier.

### Slice 005: identity, workforce, authorization, and migration
- `005-01` Person/User linkage: **High**
- `005-02` backend authorization: **High**
- `005-03` frontend access administration: **High** when permission behavior changes; otherwise Standard/Medium for presentation-only work after enforcement is fixed
- `005-04` workforce eligibility: **High** when eligibility affects assignment, access, or historical records
- `005-05` migration inventory and dry run: **High**
- `005-06` migration cutover and legacy retirement: **Pro** by default, unless the approved cutover is demonstrably reversible, fully rehearsed, and the user explicitly accepts High

### Slice 006: work-order intake and backlog
Default: **Standard / Medium** for one focused child using established records and APIs.

Elevate to High for historical-data compatibility, billing-party relationships, permission boundaries, multi-tenant selection, or work-order lifecycle/state changes.

### Slice 007: assignment, scheduling, dispatch, and technician queue
Default: **Standard / Medium** for isolated UI, API, or workflow work using established contracts.

Elevate to High for timezone/calendar integration, overlapping assignments, technician eligibility, cross-role visibility, concurrency, or dispatch decisions spanning several data sources.

### Slice 008: PWA installation and mobile foundation
- `008-01` installability and metadata: **Standard / Medium**
- `008-02` service worker and static caching: **High** when cache scope or update safety is nontrivial; otherwise Standard/Medium
- `008-03` updates, deep links, and network recovery: **High**
- `008-04` authentication and cross-account safety: **High**, with Pro allowed for unresolved cross-user or cross-tenant exposure
- `008-05` standalone mobile-shell validation: **Standard / Medium**, elevating to High for session, deep-link, or role-boundary defects

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

Required output:
- current-state findings
- proposed scope and exclusions
- dependency and ownership decisions
- whether further subdivision is required
- recommended model class and exact model identifier for each resulting child

### 2. Current-state audit
Use for route, role, permission, model, migration, API, component, test, wiki, or screenshot inventory.

Agent behavior:
- read-only
- trace end-to-end behavior rather than relying on file names
- distinguish working, partial, defective, and missing behavior
- do not convert findings into production changes unless the target child explicitly combines audit and repair as one coherent outcome

Required output:
- evidence-backed inventory
- preserved behavior
- defects and gaps
- recommended implementation boundary
- recommended implementation model class and exact model identifier

### 3. Focused implementation child
Use for one approved business child, workflow integration child, or focused production UI child created from an approved UI specification.

Agent behavior:
- audit first
- implement only the smallest complete outcome
- reuse existing models, APIs, services, components, permissions, and tests
- avoid unrelated cleanup and later-child work

Required output:
- files and systems changed
- behavior implemented or corrected
- validation performed
- known risks and deferred dependencies
- model class, exact model identifier, reasoning effort, and elevation history

### 4. Identity, authorization, or security work
Default: **High**.

Required behavior:
- preserve separation among authentication, authorization, descriptive roles, and workforce eligibility
- validate allowed and denied paths
- inspect backend enforcement independently from frontend visibility
- never rely on hidden UI controls as authorization

Required output:
- affected permission matrix
- backend enforcement evidence
- frontend visibility behavior
- tenant and negative-path tests
- whether Pro review is warranted

### 5. Migration discovery or dry run
Default: **High**.

Required behavior:
- no destructive production migration
- preserve source records
- produce deterministic reconciliation evidence
- identify manual-review cases explicitly

Required output:
- inventory totals and categories
- deterministic matching rules
- ambiguous or unmatched records
- dry-run results
- cutover prerequisites and rollback plan

### 6. Migration cutover or legacy retirement
Default: **Pro**.

Required behavior:
- require completed discovery and dry-run dependencies
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
Default: **Standard / Medium**.

Required behavior:
- planning and evidence only
- no production component, CSS, route, API, permission, workflow, or database changes
- preserve role and tenant boundaries
- produce independently reviewable artifact families

Required output:
- assigned audit evidence or wireframe specification
- role and viewport coverage
- preserved workflow and permission requirements
- unresolved decisions and approval gate

### 8. PWA work
Route each PWA child independently according to the matrix.

Do not combine installability, caching, recovery, session safety, and standalone validation into one run. Do not use PWA work to create a separate mobile frontend or broad redesign.

### 9. Quick-create and workflow integration
Default: **Standard / Medium**.

Master-data quick-create children own reusable creation. Workflow integration children own caller state, contextual prefill, result handling, automatic selection, permissions, and error return. Slice 009 owns consistency, shared infrastructure, regression, and accessibility hardening only.

Elevate to High when shared permissions, data ownership, or compatibility behavior is ambiguous.

### 10. Code review and regression review
Select the review tier independently from implementation.

Review the complete diff against the child and parent boundaries. Verify that later-child work or unrelated refactoring did not enter the change.

Required output:
- blocking findings
- non-blocking risks
- missing validation
- scope compliance
- review model class, exact model identifier, and rationale

### 11. CI or build failure diagnosis
Default: **Standard / Medium**.

Identify the first meaningful failure and keep the fix within the active child. Do not weaken tests, authorization, validation, or build gates. Elevate to High only for matrix triggers.

## Planning-document quality gate
Before routing a slice, verify:

A parent contains:
- goal or outcome
- status
- dependencies
- required child sequence
- shared decisions and boundaries
- shared acceptance criteria
- explicit guardrail that the parent is not executable

A child contains:
- one primary outcome
- dependencies
- in-scope and out-of-scope boundaries
- acceptance criteria
- validation requirements
- documentation or screenshot requirements where applicable
- rollback, recovery, or compatibility notes where risk applies

Correct missing sections before implementation routing.

## Prompt packet for every slice run
A valid prompt must include or require:
- repository and branch context
- `AGENTS.md`
- this routing document
- master slice plan
- shared slice steering
- target child and parent
- applicable approved UI specification
- explicit exclusions
- selected model class
- exact model identifier or picker label
- reasoning effort or execution mode
- cost rationale
- authorized elevation path and triggers
- required validation commands
- expected documentation and screenshot updates

The prompt must require an audit before editing and require subdivision when the target violates the sizing test.

## Escalation and stop conditions
Stop implementation when:
- the task targets a parent rather than a child
- a dependency is incomplete or contradictory
- code and canonical documents materially disagree
- more than one independent rollback boundary is required
- a migration cutover lacks a completed dry run
- authorization ownership is unclear
- a UI planning child would require production changes
- a business child would establish a competing broad UI direction before UI-006-03 approval
- the task enters a deferred domain without an approved slice
- the selected tier is insufficient and no authorized elevation path was recorded
- Pro would only compensate for oversized or poorly defined scope

## Policy maintenance and review
Review this routing matrix:
- at least once each calendar quarter
- whenever available Codex models, picker labels, context limits, reasoning modes, or relative pricing materially change
- whenever repeated elevation patterns show that a default tier is systematically too low or too high
- whenever a completed incident, migration, or security review reveals a missing routing trigger

The review must:
- record the review date
- record the models and picker labels currently mapped to Standard/Medium, High, and Pro
- compare the relative cost and quality assumptions behind the mappings
- document any matrix changes and why they were made
- preserve prior versions in Git history rather than maintaining parallel routing documents

A pricing or model change does not automatically change product scope or slice order.

## Completion standard
A routed task is complete only when:
- the target child outcome is satisfied without later-child expansion
- relevant builds, tests, migrations, security checks, accessibility checks, or responsive checks are reported
- documentation and screenshots are updated where required
- existing behavior, data, tenant boundaries, and permission boundaries are preserved or intentionally migrated
- the final report distinguishes completed work, validation, risks, deferred work, model class, exact model identifier, reasoning effort, cost rationale, and elevation history
