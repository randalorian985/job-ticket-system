# Scheduled Runner Checkout Workaround

The scheduled ChatGPT runner can be blocked from normal GitHub checkout, clone, fetch, `curl`, codeload, raw GitHub downloads, and GitHub CLI flows by the runner proxy. When that happens, the GitHub connector remains available, but connector-only edits are not safe for broad source work.

This workaround gives the runner a checkout-like working tree without requiring direct GitHub network access from the scheduled container.

## Workspace Bundle Bridge

The `Scheduled Runner Workspace Bundle` GitHub Actions workflow runs inside GitHub, where `actions/checkout` is available. It packages the requested ref, posts a manifest comment, and posts base64 bundle chunks to an issue.

The workflow starts automatically on every push to `main`, posting a fresh default-branch bundle to issue #319. That means each merged PR should leave the scheduled runner with a current reconstructable workspace even when direct checkout is still blocked.

The workflow can also be started in either of these ways:

- Run the workflow manually and choose the ref and issue number.
- Comment `/runner-bundle` on a repository issue. The issue-comment trigger is limited to repository owners, members, and collaborators and uses the repository default branch.

By default, bundle comments are intended for issue #319, the active scheduled-runner checkout-access bridge. Issue #166 is retained as historical context but has reached GitHub's issue-comment limit.

## Scheduled Runner Recovery Flow

When direct checkout is blocked and broad source inspection is needed:

1. Read the newest manifest and all matching `scheduled-runner-bundle` chunk comments through the GitHub connector, preferring the latest bundle created after the most recent `main` push.
2. Concatenate chunk payloads in numeric order.
3. Decode and extract the archive into `/workspace/job-ticket-system`.
4. Use that extracted tree for local source search, edits, and frontend-only checks where available.
5. Publish changed files back to a PR branch through GitHub connector object/file operations.
6. Treat GitHub Actions as the required validation authority, especially because the scheduled runner may not have the .NET SDK.

Reconstruction commands after chunk payloads have been concatenated into `scheduled-runner-workspace.tar.gz.b64`:

```bash
base64 -d scheduled-runner-workspace.tar.gz.b64 > scheduled-runner-workspace.tar.gz
mkdir -p /workspace/job-ticket-system
tar -xzf scheduled-runner-workspace.tar.gz -C /workspace/job-ticket-system
```

## Connector Publishing Flow

A missing `.git` directory in the reconstructed bundle is not a blocker. Use the extracted tree as the source of truth for search, edits, generated diffs, and final file contents.

For large or coordinated patches:

1. Confirm no active PR or draft PR already owns the current task.
2. Reconstruct latest `main` from the newest issue #319 bundle before editing.
3. Make the complete local file changes in the reconstructed workspace.
4. Compare the local post-edit files against the connector-fetched `main` files so the final diff is understood before publishing.
5. Publish the final changed files through GitHub connector writes only after the local diff is reviewed.
6. Prefer Git object writes for multi-file or large-file changes when contents API replacement is awkward: create blobs for complete post-patch files, create a tree from latest `main`, create a commit, move one branch ref, and open or update exactly one draft PR.
7. Use connector contents updates only for small complete-file replacements where the full final file body is safe to handle.
8. Never publish temporary workflow files, helper-only branches, no-product-diff branches, or partial hand-reconstructed large files as a workaround.
9. If a proposed large-file patch cannot be published safely through complete final file contents or Git object writes, leave that patch local and switch to a safer coherent task rather than opening a misleading PR.
10. Use GitHub Actions on the PR head as validation authority when local validation is unavailable.

Record a blocker only after connector inspection, bundle reconstruction, local patch generation, connector publishing, draft PR creation or update, and GitHub Actions validation handoff have all been attempted or ruled out for the current task.

## Guardrails

This bridge does not weaken the normal project rules:

- Keep one active PR at a time.
- Start from the latest `main` branch.
- Stay aligned to `README.md`, `docs/build-roadmap.md`, `docs/project-scope.md`, and `docs/api-contract.md`.
- Do not implement deferred domains unless the scope docs explicitly approve them.
- Do not weaken authorization, renumber enums, edit historical migrations, or bypass soft-delete/archive behavior.
- Do not call a connector-published PR merge-worthy until GitHub Actions or another checkout-capable environment has run the required validation.

The bridge only solves source access. It does not replace code review or validation.
