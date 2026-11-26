# Background Agent Review Checklist — Smart Campus

Read-only checklist for reviewing work performed by an autonomous coding agent.
Every item must be verifiable from artifacts left in the repo or from tool
execution recorded in the session transcript. If evidence is missing, the item
fails — do not infer completion.

---

## 1. Isolation

- [ ] Work was performed on a dedicated branch or git worktree, not on the
      shared main branch.
- [ ] The branch name is descriptive and traceable to the task (e.g.
      `fix/r1-nan-guard`, not `patch-1`).
- [ ] No commits land on main until the human approval gate (section 8) passes.

Evidence: branch name, `git branch -a` or worktree listing, commit history
showing the agent's commits only on the feature branch.

## 2. No credentials

- [ ] No API keys, secrets, tokens, passwords, or `.env` values appear in any
      new or modified file.
- [ ] No secret was pasted into a prompt, log, test fixture, or comment.
- [ ] No new dependency on a secrets manager or environment variable was
      introduced in app code.

Evidence: `grep` / `rg` scan of the diff for common secret patterns, plus
inspection of any added config or fixture files.

## 3. No deployment

- [ ] No edge functions were deployed.
- [ ] No outbound network or API calls were added to app code.
- [ ] No database migrations were applied unless explicitly approved.
- [ ] No `git push` to a remote was performed.

Evidence: session transcript — confirm no `deploy_edge_functions`,
`apply_migration`, `curl`, `fetch`, or `git push` tool call appears.

## 4. Commands — required and reported

The agent must have run each of these and reported the actual output (not a
paraphrase). "Did not run" is an acceptable answer if the human approved
skipping it; silence is not.

| Command                  | Ran? | Result (exit code + key line) |
|--------------------------|------|-------------------------------|
| `npm test`               |      |                               |
| `npm run typecheck`      |      |                               |
| `npm run lint`           |      |                               |
| `npm run build`           |      |                               |

Rules:
- `npm test` is mandatory before proposing completion; 0 failures required.
- If typecheck, lint, or build failed and was not fixed, the failure must be
  reported verbatim — not hidden behind "looks good."
- If a command was skipped, state which one and why.

## 5. Risk register updates

- [ ] Each risk addressed (e.g. R1, R2) has its entry updated with: status,
      the fix applied, and the test that covers it.
- [ ] New risks discovered during the work are added with an ID, description,
      and recommended next step.
- [ ] No risk was silently closed without evidence.

Evidence: diff of the risk register file (or AGENTS.md section) showing the
before/after text.

## 6. Evidence for every claim

- [ ] Every "passes" / "green" / "works" claim is backed by a recorded tool
      execution showing the command and its output.
- [ ] No claim like "tests pass" without the `npm test` output that proves it.
- [ ] No claim like "no imports of X" without a recorded `rg` / `grep` result.
- [ ] If the agent could not run a verification step (e.g. no browser for UI),
      it explicitly says so rather than implying success.

Evidence: session transcript tool calls and their results.

## 7. Summary of changed files

A complete list must be provided before the approval gate. For each file:

| File              | Change type (add/edit/delete) | Rationale (problem -> fix) |
|-------------------|-------------------------------|----------------------------|
|                   |                               |                            |

Rules:
- Orphaned files, dead exports, and commented-out code must be listed and
  cleaned up, not hidden.
- Files touched but reverted to identical content should be marked "no change."

## 8. Human approval gate before merge

- [ ] The agent showed the diff and waited for explicit human approval before
      applying changes that go beyond the original task scope.
- [ ] The agent did not merge to main or close the task without a recorded
      human "approved" / "merge" instruction.
- [ ] If the human requested changes, the agent re-ran section 4 commands and
      re-presented results before re-requesting approval.

Evidence: session transcript showing the diff, the wait, and the human
approval message.

---

## Pass / fail criteria

- **Pass:** every checkbox above has concrete evidence, section 4 commands ran
  with `npm test` at 0 failures, and the human approval gate was respected.
- **Fail:** any missing evidence, any unapproved deployment/secret/push, any
  "green" claim without a recorded run, or any merge without human approval.

If the checklist fails, send the agent back with the specific failing items.
Do not merge.
