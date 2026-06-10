# Routes

Application routing configuration belongs in this folder.

## Manager task-navigation contract

Manager job queues use URL query parameters so operational views are shareable and survive navigation:

- `status`: numeric backend status value or `active` for active dispatch statuses.
- `priority`: numeric priority value.
- `customer`: customer identifier.
- `readiness`: `ready`, `needs-review`, or `not-active`.
- `q`: free-text queue search.

Unsupported filter values and unrelated query parameters are removed when the queue loads, keeping the URL and controlled filter inputs in sync.

Ticket-detail links may include `returnTo` so breadcrumbs return the user to the exact queue; the visible label is derived from the validated internal path rather than URL-provided display text. Detail workflow tabs use `tab` with one of `overview`, `dispatch`, `time`, `parts`, `files`, `closeout`, or `activity`.

All return paths must remain internal to `/manage`; invalid or missing return paths fall back to `/manage/job-tickets`.
