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
Mode: <Standard or Pro>
Scope: <one bounded outcome>
Escalation: <condition that permits a stronger model>
Required review: <model/level or human role>
Approval gate: <steering decision or "already approved">
```

Do not start an implementation task when its approval gate is unresolved.

## Default Route

- Default implementation model: `GPT-5.6 Terra`
- Default implementation reasoning: `Medium`
- Default execution mode: `Standard`
- Complex implementation reasoning: `Terra High`
- Architecture and review model: `GPT-5.6 Sol`
- Architecture and review reasoning: `High`
- Highest-risk reasoning: `Sol Extra High` (`xhigh`)
- Low-risk mechanical model: `GPT-5.6 Luna`
- Low-risk reasoning: `Medium`

Start with Terra Medium in Standard mode unless the task or slice table requires another route. Escalate reasoning only when task risk, failed validation, or representative evaluation shows a material quality benefit. Use Luna only when the work is mechanical, easy to verify, and unable to change business meaning by itself. Use Pro mode only for an explicitly justified quality-critical review.

## Agent Profiles

| Agent profile | Model route | May own | Must not own |
|---|---|---|---|
| Delivery agent | Terra Medium in Standard mode | One approved, bounded child slice; ordinary backend, React, API, test, documentation, and integration work | Unresolved architecture, destructive migration, authorization redesign, production cutover, or approval decisions |
| Complex delivery agent | Terra High in Standard mode | Cross-layer implementation, difficult debugging, concurrency, or workflow-state work after the contract is settled | Architecture approval, destructive migration, or final security and cutover decisions |
| Architecture and risk agent | Sol High in Standard mode | Domain and workflow architecture, identity, authorization, migration design, historical-data rules, PWA security boundaries, and independent risk review | Business approval or unattended production action |
| Highest-risk agent | Sol Extra High in Standard mode | Destructive backfills, cutover and rollback decisions, historical-data integrity, critical security decisions, and unresolved evidence after a High pass | Business approval or unattended production action |
| Mechanical support agent | Luna Medium in Standard mode | Formatting, inventories, repetitive fixtures, screenshot lists, and deterministic cleanup delegated from a Terra or Sol task | A complete business child slice, schema meaning, authorization, migrations, historical behavior, or final review |
| Independent reviewer | Sol High or Extra High with fresh context | Required risk review at the effort specified below | Editing and approving the same high-risk change in one pass |

The primary route owns the child slice from repository audit through validation and handoff. A support agent may assist only with a clearly isolated subtask. Parent slices are steering documents and are never executable agent assignments.

## Task Routing

| Task | Primary route | Required review or escalation |
|---|---|---|
| Steering analysis, domain language, ER relationships, cardinality, invariants, and decision records | Sol High | Human steering disposition is still required. Escalate to Extra High only when evidence remains conflicting or historical integrity is at risk. |
| Data-profiling scripts, duplicate reports, reconciliation queries, and non-destructive inventory | Terra Medium | Sol High reviews matching rules, ambiguity classifications, and any recommendation that could merge or discard records. |
| EF Core migration and constraint design | Sol High | Use a separate Sol High review with fresh context before merge. |
| Destructive backfills, production cutover, rollback execution, and historical-data reconciliation | Sol Extra High | Require a fresh-context Extra High review and explicit human approval before production execution. |
| Bounded backend services, DTOs, controllers, validators, and ordinary API tests | Terra Medium | Escalate to Terra High for complex cross-layer behavior and Sol High for authorization, identity, money, or historical meaning. |
| React forms, lists, workflow screens, API clients, and frontend tests | Terra Medium | Use Terra High for difficult responsive or state-management work and Sol High for workflow architecture or authorization-sensitive presentation. |
| Fitment verification, installation history, replacement chains, historical snapshots, and effective-dated rates | Sol High | Escalate destructive migration or unresolved historical integrity to Extra High. Require focused domain, persistence, API, and regression evidence. |
| Part and vendor catalog CRUD, explicit relationship management, and review screens | Terra Medium | Sol High reviews relationship direction, migration semantics, and any inference that could present a candidate as fact. |
| PWA manifest, icons, install handling, ordinary service-worker setup, and browser tests | Terra Medium | Terra High handles difficult runtime behavior; Sol High reviews cache boundaries, logout cleanup, update activation, offline claims, and release configuration. |
| Test fixtures, repetitive test cases, formatting, screenshot inventories, and documentation cleanup | Luna Medium | Terra Medium confirms behavior-changing expectations. Sol High reviews tests that encode migration or historical-data rules. |
| Initial debugging of a bounded failure | Terra Medium | Escalate to Terra High after two evidence-based attempts fail and to Sol High when data loss, security, or cross-module architecture is involved. |
| Manual final pull-request risk review and production readiness | Sol High | Use Extra High for destructive cutover, rollback, historical-data integrity, critical security, or unresolved quality-first analysis. Production action remains a human decision. |

## Slice Routing

The canonical slice inventory and execution order live in [Slice Planning](./slices/000-slice-planning.md). Every run must also follow [Shared Slice Steering](./slices/STEERING.md). The table below selects the primary agent for each current child; it does not authorize a proposed or blocked slice.

| Child slice or group | Primary agent | Required review or escalation |
|---|---|---|
| `001-01`, `002-01`, `003-01`, `004-01`, `004-02`, `005-01`, `005-04`, `006-01`, `006-03` | Architecture and risk agent, Sol High | Use a separate Sol High review for schema identity, data preservation, migration, and rollback behavior. Bounded API/UI implementation may be handed to Terra Medium after the contract is fixed. |
| `001-02`, `002-02`, `003-02`, `003-03`, `004-03`, `006-02`, `006-04`, `006-05`, `006-06`, `006-07` | Delivery agent, Terra Medium | Escalate to Terra High for complex cross-layer behavior and Sol High for schema, identity, authorization, or historical-data impact. |
| `005-02`, `005-03` | Architecture and risk agent, Sol High | Require independent security and cross-role review before merge. |
| `005-05` | Delivery agent, Terra Medium | Sol High reviews matching rules, ambiguity handling, reconciliation evidence, and the proposed cutover input. |
| `005-06` | Highest-risk agent, Sol Extra High | Require a fresh-context Extra High migration review and explicit human cutover approval. |
| `007-01` through `007-04` | Delivery agent, Terra Medium | Escalate complex concurrency or workflow state to Terra High and assignment eligibility, schedule policy, or authorization decisions to Sol High. |
| `008-01`, `008-02`, `008-05` | Delivery agent, Terra Medium | Escalate difficult runtime behavior to Terra High. Sol High reviews cache scope, install claims, logout cleanup, standalone authentication behavior, and release evidence. |
| `008-03`, `008-04` | Architecture and risk agent, Sol High | Require independent review of update activation, deep links, recovery, token storage, cache partitioning, logout, and cross-account safety. |
| `009-01` through `009-03` | Delivery agent, Terra Medium | Escalate any proposed shared abstraction that changes ownership, authorization, caller lifecycle, or data behavior to Sol High. |
| `UI-001-01` through `UI-001-03` | Delivery agent, Terra Medium | Sol High reviews authorization findings and any recommendation that would alter architecture or role boundaries. |
| `UI-002-01` through `UI-005-04` | Architecture and risk agent, Sol High | Keep the work planning-only. Human review approves workflow direction before it becomes a production specification. |
| `UI-006-01`, `UI-006-02` | Delivery agent, Terra Medium | Escalate complex synthesis to Terra High and cross-role conflicts, security findings, or unresolved workflow architecture to Sol High. |
| `UI-006-03` | Architecture and risk agent, Sol High | Human approval is required for the final UI specification and production sequence. |

When a child contains both Sol-owned decisions and Terra-owned implementation, Sol fixes and records the contract first. Terra Medium may then implement that same child only if the remaining work is bounded, the approval gate is satisfied, and the handoff names the frozen decisions. Escalate Terra to High only when implementation complexity warrants it. Do not use Luna as the primary agent for any listed child.

## Phase Routing

| Schema/PWA phase | Recommended route |
|---|---|
| Phase 0 - Domain contract approval | Sol High plus steering review |
| Phase 1 - Existing-data profiling | Terra Medium for reports; Sol High for rules and findings |
| Phase 2 - Customer context | Terra Medium implementation; Sol High migration and snapshot review |
| Phase 3 - Equipment catalog and assets | Sol High for schema and identity; Terra Medium for bounded API/UI work |
| Phase 4 - Fitment matrix | Sol High for invariants and verification; Terra Medium for bounded screens and tests |
| Phase 5 - Parts catalog | Terra Medium implementation; Sol High relationship and migration review |
| Phase 6 - Usage and installation history | Sol High; Extra High for destructive backfill or unresolved historical integrity |
| Phase 7 - Effective-dated rates | Sol High; Extra High for destructive backfill or unresolved historical integrity |
| Phase 8 - API and React transition | Terra Medium by slice; Sol High for integration and authorization review |
| Phase 9 - Installable PWA | Terra Medium implementation; Sol High security and release review |
| Phase 10 - Cutover and cleanup | Sol Extra High plus explicit human approval |

## Max And Ultra

`Max` and `Ultra` are exceptions, not defaults.

Use Sol Max only when:

- the task is quality-first and materially difficult;
- Sol High or Extra High produced unresolved alternatives or conflicting evidence;
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

## Escalation Procedure

Use the least expensive route that is authorized and adequate, then escalate as soon as one of these boundaries is crossed:

1. Start approved, bounded implementation on Terra Medium in Standard mode.
2. Escalate to Terra High when implementation crosses several application layers, involves difficult concurrency or state behavior, or two evidence-based Medium attempts fail.
3. Escalate from Terra to Sol High before deciding schema identity or cardinality, authorization or tenant boundaries, historical snapshots, financial rules, migration semantics, fitment truth, cache or authentication boundaries, or cross-role workflow architecture.
4. Escalate from Sol High to Sol Extra High for destructive backfills, production cutover or rollback, unresolved historical-data integrity, critical security decisions, or conflicting evidence that remains after a High pass.
5. Stop for human approval when business meaning is unresolved, a steering gate is pending, records may be merged or discarded, production data may change, or a migration or release is ready to execute.
6. After the high-risk decision is fixed and recorded, hand bounded implementation back to Terra Medium. Do not keep an entire slice on a stronger route merely because one earlier decision required it.

An escalation handoff must include the child-slice ID, current task header, evidence collected, attempts made, exact unresolved decision, affected files and data, validation results, and the approval required. Changing the model or reasoning level without recording this handoff does not satisfy the escalation rule.

## Cost Control

- Use Terra Medium in Standard mode for the majority of bounded implementation work.
- Escalate to Terra High only for measured implementation complexity.
- Use Sol High for architecture and independent risk review.
- Reserve Sol Extra High for destructive migration or cutover, historical-data integrity, critical security decisions, and unresolved evidence.
- Use Luna Medium only when deterministic validation can catch mistakes.
- Use Pro mode only when a difficult, quality-critical review demonstrates enough benefit to justify its additional cost and latency.
- Reuse focused context and avoid repeatedly loading unrelated logs, generated files, or historical documents.
- Do not use Fast, Max, or Ultra by default.

## Planning Cost Estimate

The current scope contains 55 executable child slices. The existing scope estimate of 550,000 to 890,000 implementation-assistant tokens is a sizing signal, not a complete billable-token forecast, because it does not separate uncached input, cached input, output, retries, validation, or independent review.

For delivery planning, use this working budget:

| Estimate | Planning range |
|---|---|
| Executable children | 55 |
| Average Codex task-equivalent runs | 2 to 4 per child |
| Expected model mix | About 65% Terra, 25% Sol, and 10% Luna |
| Contingency | 25% for failed tests, migration findings, and steering changes |
| Codex credit budget | Approximately 1,250 to 2,500 credits |
| Approximate incremental cost | Approximately $50 to $100 beyond included plan usage |

The dollar range uses the published equivalence of 2,500 Codex credits to $100 and the current token-based Codex rates. Actual cost may be lower when plan-included usage or cached input applies, and higher when context is repeatedly reloaded, tests require several repair passes, migrations uncover poor data, or Extra High and Pro are used outside their intended boundaries. The estimate excludes human labor, hosting, third-party services, data cleanup performed outside Codex, and production operations.

After the first five completed children, record actual credits by model, input/cache/output mix, number of repair passes, and review cost. Reforecast the remaining program from that evidence. Reforecast again before `005-06`, `008-03`, `008-04`, and any production cutover.

## Review Triggers

Review this routing policy when:

- a new schema/PWA phase is approved;
- a model is added, removed, renamed, or materially repriced;
- two or more slices require escalation for the same failure pattern;
- validation shows the default route is producing avoidable rework; or
- the project expands into full offline synchronization, inventory, purchasing expansion, payments, or customer self-service.

## Official References

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card)
- [OpenAI GPT-5.6 model pricing](https://developers.openai.com/api/docs/models)
