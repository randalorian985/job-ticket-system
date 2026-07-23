# Codex Model Routing

Date: 2026-07-23

Status: Active delivery guidance

## Purpose

This document controls which Codex model and reasoning level should be selected for planning, implementation, review, and release tasks in this repository.

Model routing does not approve a task. The project scope, build roadmap, schema redesign domain contract, authorization rules, migration controls, and steering decisions remain authoritative.

The model names and routing assumptions below reflect the available GPT-5.6 family as of the document date. Recheck official model guidance before beginning a new epic, when a listed model is unavailable, or when OpenAI changes model behavior or pricing.

## Required Task Header

Every Codex implementation or review task should begin with:

```text
Model: <model>
Reasoning: <level>
Scope: <one bounded outcome>
Escalation: <condition that permits a stronger model>
Required review: <model/level or human role>
Approval gate: <steering decision or "already approved">
```

Do not start an implementation task when its approval gate is unresolved.

## Default Route

- Default implementation model: `GPT-5.6 Terra`
- Default implementation reasoning: `High`
- High-risk architecture and review model: `GPT-5.6 Sol`
- High-risk reasoning: `Extra High` (`xhigh`)
- Low-risk mechanical model: `GPT-5.6 Luna`
- Low-risk reasoning: `Medium` or `High`

Start with Terra High unless the task table requires Sol. Use Luna only when the work is mechanical, easy to verify, and unable to change business meaning by itself.

## Agent Profiles

| Agent profile | Model route | May own | Must not own |
|---|---|---|---|
| Delivery agent | Terra High | One approved, bounded child slice; ordinary backend, React, API, test, documentation, and integration work | Unresolved architecture, destructive migration, authorization redesign, production cutover, or approval decisions |
| Architecture and risk agent | Sol Extra High | Domain and workflow architecture, identity, authorization, migrations, historical-data rules, PWA security boundaries, cutover planning, and independent high-risk review | Business approval or unattended production action |
| Mechanical support agent | Luna High | Formatting, inventories, repetitive fixtures, screenshot lists, and deterministic cleanup delegated from a Terra or Sol task | A complete business child slice, schema meaning, authorization, migrations, historical behavior, or final review |
| Independent reviewer | Sol Extra High with fresh context | Required risk review for the high-risk slice groups below | Editing and approving the same high-risk change in one pass |

The primary route owns the child slice from repository audit through validation and handoff. A support agent may assist only with a clearly isolated subtask. Parent slices are steering documents and are never executable agent assignments.

## Task Routing

| Task | Primary route | Required review or escalation |
|---|---|---|
| Steering analysis, domain language, ER relationships, cardinality, invariants, and decision records | Sol Extra High | Human steering disposition is still required. Use Sol Max only when evidence remains conflicting after an Extra High pass. |
| Data-profiling scripts, duplicate reports, reconciliation queries, and non-destructive inventory | Terra High | Sol Extra High reviews matching rules, ambiguity classifications, and any recommendation that could merge or discard records. |
| EF Core migrations, database constraints, backfills, rollback scripts, and cutover sequencing | Sol Extra High | Run a separate Sol Extra High review with fresh context before merge. Human approval is required before production execution. |
| Bounded backend services, DTOs, controllers, validators, and ordinary API tests | Terra High | Escalate to Sol Extra High when the change crosses modules or affects authorization, historical snapshots, money, or destructive behavior. |
| React forms, lists, workflow screens, API clients, and frontend tests | Terra High | Use Sol Extra High for workflow architecture, authorization-sensitive presentation, difficult responsive defects, and final cross-role review. |
| Fitment verification, installation history, replacement chains, historical snapshots, and effective-dated rates | Sol Extra High | Require focused domain, persistence, API, and regression evidence. These tasks must not be delegated solely to Luna. |
| Part and vendor catalog CRUD, explicit relationship management, and review screens | Terra High | Sol Extra High reviews relationship direction, migration semantics, and any inference that could present a candidate as fact. |
| PWA manifest, icons, install handling, ordinary service-worker setup, and browser tests | Terra High | Sol Extra High reviews cache boundaries, logout cleanup, update activation, offline claims, and release configuration. |
| Test fixtures, repetitive test cases, formatting, screenshot inventories, and documentation cleanup | Luna High | Terra High confirms behavior-changing expectations. Sol Extra High reviews tests that encode migration or historical-data rules. |
| Initial debugging of a bounded failure | Terra High | Escalate to Sol Extra High after two evidence-based attempts fail, when data loss is possible, or when the failure crosses modules. |
| Manual final pull-request risk review, migration rehearsal review, production readiness, and cutover or rollback decision | Sol Extra High | Use Sol Max only for unresolved quality-first analysis. Production action remains a human decision. |

## Slice Routing

The canonical slice inventory and execution order live in [Slice Planning](./slices/000-slice-planning.md). Every run must also follow [Shared Slice Steering](./slices/STEERING.md). The table below selects the primary agent for each current child; it does not authorize a proposed or blocked slice.

| Child slice or group | Primary agent | Required review or escalation |
|---|---|---|
| `001-01`, `002-01`, `003-01`, `004-01`, `004-02`, `005-01`, `005-04`, `006-01`, `006-03` | Architecture and risk agent, Sol Extra High | Use a separate Sol Extra High review for schema identity, data preservation, migration, and rollback behavior. Bounded API/UI implementation may be handed to Terra High after the contract is fixed. |
| `001-02`, `002-02`, `003-02`, `003-03`, `004-03`, `006-02`, `006-04`, `006-05`, `006-06`, `006-07` | Delivery agent, Terra High | Escalate to Sol Extra High when audit reveals schema changes, cross-tenant identity ambiguity, authorization changes, or historical-data impact. |
| `005-02`, `005-03` | Architecture and risk agent, Sol Extra High | Require independent security and cross-role review before merge. |
| `005-05` | Delivery agent, Terra High | Sol Extra High reviews matching rules, ambiguity handling, reconciliation evidence, and the proposed cutover input. |
| `005-06` | Architecture and risk agent, Sol Extra High | Require a fresh-context Sol Extra High migration review and explicit human cutover approval. |
| `007-01` through `007-04` | Delivery agent, Terra High | Escalate assignment eligibility, schedule-conflict policy, authorization, concurrency, or cross-role workflow decisions to Sol Extra High. |
| `008-01`, `008-02`, `008-05` | Delivery agent, Terra High | Sol Extra High reviews cache scope, install claims, logout cleanup, standalone authentication behavior, and release evidence. |
| `008-03`, `008-04` | Architecture and risk agent, Sol Extra High | Require independent review of update activation, deep links, recovery, token storage, cache partitioning, logout, and cross-account safety. |
| `009-01` through `009-03` | Delivery agent, Terra High | Escalate any proposed shared abstraction that changes ownership, authorization, caller lifecycle, or data behavior. |
| `UI-001-01` through `UI-001-03` | Delivery agent, Terra High | Sol Extra High reviews authorization findings and any recommendation that would alter architecture or role boundaries. |
| `UI-002-01` through `UI-005-04` | Architecture and risk agent, Sol Extra High | Keep the work planning-only. Human review approves workflow direction before it becomes a production specification. |
| `UI-006-01`, `UI-006-02` | Delivery agent, Terra High | Escalate cross-role conflicts, security findings, or unresolved workflow architecture to Sol Extra High. |
| `UI-006-03` | Architecture and risk agent, Sol Extra High | Human approval is required for the final UI specification and production sequence. |

When a child contains both Sol-owned decisions and Terra-owned implementation, Sol fixes and records the contract first. Terra may then implement that same child only if the remaining work is bounded, the approval gate is satisfied, and the handoff names the frozen decisions. Do not use Luna as the primary agent for any listed child.

## Phase Routing

| Schema/PWA phase | Recommended route |
|---|---|
| Phase 0 - Domain contract approval | Sol Extra High plus steering review |
| Phase 1 - Existing-data profiling | Terra High for reports; Sol Extra High for rules and findings |
| Phase 2 - Customer context | Terra High implementation; Sol Extra High migration and snapshot review |
| Phase 3 - Equipment catalog and assets | Sol Extra High for schema and identity; Terra High for bounded API/UI work |
| Phase 4 - Fitment matrix | Sol Extra High for invariants and verification; Terra High for bounded screens and tests |
| Phase 5 - Parts catalog | Terra High implementation; Sol Extra High relationship and migration review |
| Phase 6 - Usage and installation history | Sol Extra High |
| Phase 7 - Effective-dated rates | Sol Extra High |
| Phase 8 - API and React transition | Terra High by slice; Sol Extra High for integration and authorization review |
| Phase 9 - Installable PWA | Terra High implementation; Sol Extra High security and release review |
| Phase 10 - Cutover and cleanup | Sol Extra High plus explicit human approval |

## Max And Ultra

`Max` and `Ultra` are exceptions, not defaults.

Use Sol Max only when:

- the task is quality-first and materially difficult;
- Sol Extra High produced unresolved alternatives or conflicting evidence;
- the task has explicit acceptance criteria; and
- the additional cost and latency are justified in the task record.

Use Sol Ultra only for read-only or isolated parallel investigations with clearly disjoint workstreams, such as independent architecture review, test-failure triage, or repository-wide evidence gathering.

Do not use Ultra for:

- simultaneous edits to the same schema or migration files;
- automatic production changes;
- resolving business ambiguity without a human;
- parallel backfills against production data; or
- bypassing an approval or reconciliation gate.

## Handoff And Escalation Rules

1. Keep each task to one reviewable slice.
2. When escalating, pass a concise evidence summary instead of restarting with an unbounded repository dump.
3. Record commands, tests, reconciliation totals, unresolved assumptions, and file changes in the handoff.
4. A stronger model may recommend a decision but cannot supply business approval.
5. Candidate fitments, equipment groupings, historical installations, and unknown rates remain unresolved until the approved human review occurs.
6. Do not run all phases as one unattended task. Stop at every documented exit gate.

## Cost Control

- Use Terra High for the majority of bounded implementation work.
- Use Sol Extra High where an error could corrupt history, weaken authorization, misstate compatibility, or make rollback unsafe.
- Use Luna only when deterministic validation can catch mistakes.
- Reuse focused context and avoid repeatedly loading unrelated logs, generated files, or historical documents.
- Do not use Fast, Max, or Ultra by default.

## Review Triggers

Review this routing policy when:

- a new schema/PWA phase is approved;
- a model is added, removed, renamed, or materially repriced;
- two or more slices require escalation for the same failure pattern;
- validation shows the default route is producing avoidable rework; or
- the project expands into full offline synchronization, inventory, purchasing expansion, payments, or customer self-service.

## Official References

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card-2)
