# Application Layout Direction

## Status
Planning only. Do not change the production application shell until wireframes are reviewed.

## Problem
The current top navigation will not scale as more business capabilities are added. Horizontal scrolling is not an acceptable primary navigation pattern for this line-of-business application. Large headers and excessive vertical spacing also delay access to the actual work area.

## Direction
- Use a scalable left-side primary navigation for desktop manager and dispatcher workflows.
- Make the navigation collapsible so users can reclaim work area.
- Use a compact top utility bar only for global actions, account controls, alerts, and context that truly belongs globally.
- Reduce page-header height and decorative spacing.
- Bring actionable content, filters, tables, and workspaces closer to the top of the viewport.
- Optimize for efficient data processing rather than a marketing-site presentation.
- Preserve a technician-appropriate mobile pattern instead of forcing the full desktop side rail onto small screens.

## Required planning artifacts
Before production implementation:
1. Audit the current application shell, routes, navigation, permissions, and responsive behavior.
2. Create unwired static HTML wireframes under `docs/layout/wireframes/`.
3. Include at minimum:
   - Desktop expanded navigation
   - Desktop collapsed navigation
   - Manager/dispatcher workbench example
   - Mobile technician navigation example
   - Tablet behavior
4. Review the wireframes against existing ticket, reports, master-data, dispatch, and scheduling workflows.
5. Document the approved direction before creating an implementation slice.

## Guardrails
- Do not change business workflow behavior while testing layout concepts.
- Do not remove routes or hide features to make the wireframe simpler.
- Do not assume desktop and mobile users need identical navigation.
- Do not create horizontal scrolling for primary navigation.
- Do not turn every page into oversized cards with excessive whitespace.
- Preserve accessibility, keyboard navigation, touch targets, and responsive behavior.

## Future implementation
After wireframe approval, create a separate application-shell and navigation slice with scoped migration, tests, screenshots, and rollback considerations.