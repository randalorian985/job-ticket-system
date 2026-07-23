# Slice 008-03: Updates, Deep Links, and Network Recovery

## Status
Proposed child of Slice 008.

## Goal
Make installed-app updates, route entry, refresh, and network interruption behavior controlled and understandable.

## Dependencies
Requires Slice 008-02.

## Scope
- Add or repair service-worker update detection and a clear user activation flow.
- Prevent prolonged frontend/backend version mismatch where practical.
- Preserve deep links, hard refreshes, and authenticated return paths in installed mode.
- Provide controlled network-loss, offline-launch, retry, and recovery states.
- Ensure restoring the network allows continued use without reinstalling.
- Document update, refresh, recovery, and troubleshooting behavior.

## Acceptance criteria
- A deployed update is detected and can be activated through a clear flow.
- Deep links and hard refreshes open the expected route or controlled authentication return path.
- Network failure never produces an unexplained blank screen or false-success state.
- Recovery works after connectivity returns.
- Focused tests, browser validation, wiki, and screenshots are complete.

## Guardrail
Do not change authorization, account/tenant cleanup, offline business-data editing, or broad shell layout in this child.
