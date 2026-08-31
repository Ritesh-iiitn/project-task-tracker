# AI Prompts & Engineering Log

This log documents the iterative prompts used during the development of PulseTrack, the generated outputs, and subsequent code corrections and refinements made to ensure strict adherence to project specifications.

---

## 1. Domain Modeling & State Machine Constraints

### Prompt
> "Define a finite state machine for a task management system with statuses: Backlog, In Progress, In Review, Done, Blocked. Rules:
> 1. Tasks move Backlog -> In Progress -> In Review -> Done.
> 2. Blocked is only allowed from In Progress or In Review.
> 3. Unblocking must return the task to the exact status it was blocked from.
> 4. Finished tasks can only reopen to Backlog or In Progress.
> 5. A task with an unfinished blocking dependency cannot move to Done.
> 6. Direct illegal jumps must be rejected with descriptive error reasons.
> Write a pure TypeScript function to validate any transition."

### What you got
The AI generated a TypeScript function `validateStatusTransition` checking status equality and verifying state transitions with a `switch` statement.

### What you corrected
The initial code did not store the `previousStatus` when transitioning into `Blocked` and assumed unblocking would always default to `In Progress`. We corrected the implementation to explicitly return `{ valid: true, newPreviousStatus: currentStatus }` when blocking, and verify that target status matches `previousStatus === 'In Review' ? 'In Review' : 'In Progress'` when unblocking.

---

## 2. Granular Bulk Action Reporting Engine

### Prompt
> "Create a Next.js App Router API route for `/api/tasks/bulk` that handles batch status moves, assignee updates, and due date changes for an array of `taskIds`. If some tasks in the batch have illegal transitions or invalid assignees, do not fail the whole batch. Return a per-task report of successes and specific rejection reasons."

### What you got
The AI provided a route handler that looped through `taskIds`, ran the state machine check, executed individual updates, and collected `{ taskId, key, title, success, reason }` into a `results` array.

### What you corrected
The initial draft used a single Prisma `$transaction([ ... ])` wrapping all updates, which caused the entire batch to roll back whenever a single task failed validation. We corrected the logic to execute each valid task's update and activity log independently within its own isolated transaction, collecting successes and failures accurately into the summary response.

---

## 3. Automatic Task Unassignment on Project Member Removal

### Prompt
> "Write the DELETE handler for `/api/projects/[id]/members?userId=...` where a manager removes a user from a project. When removed, they must be unassigned from all tasks in that project and an immutable audit log must be recorded on each affected task."

### What you got
The AI wrote a handler that deleted the `ProjectMember` record and then deleted rows from `TaskAssignee`.

### What you corrected
The generated code deleted the assignments but failed to generate the immutable `TaskActivity` audit log entries on the affected tasks, violating Goal 9 ("Every assignment and unassignment must be logged"). We updated the handler to first query all affected tasks within the project, delete the assignments in a transaction, and create a `TaskActivity` record (`type: 'unassignment'`) for each task explaining that the user was automatically unassigned due to project membership removal.

---

## 4. Overdue Alerts with Assignment-Based Dismissal & Date Invalidation

### Prompt
> "Implement overdue alert dismissal logic. A task is overdue if dueDate < NOW() and status != 'Done'. A user can dismiss an alert only if they are assigned to it. If the task's due date later changes, the dismissal must be invalidated so the alert reappears."

### What you got
The AI initially suggested adding a boolean `isDismissed: Boolean` column directly to the `Task` table and setting it to `false` whenever `dueDate` changed.

### What you corrected (Prompt that produced something wrong)
- **Problem**: Storing `isDismissed` on the `Task` table caused one user's dismissal to dismiss the alert globally for all other assigned team members. Furthermore, it did not track who dismissed what.
- **Solution**: We rejected this approach and introduced a dedicated `TaskAlertDismissal` model with compound key `[taskId, userId]` and `dueDateAtDismissal: DateTime`. When a task's `dueDate` is modified in `PATCH /api/tasks/[id]`, all existing dismissals for that task are deleted in the transaction, ensuring the alert cleanly reappears for all assignees.

---

## 5. Automated Test Suite for Lifecycle Validation

### Prompt
> "Write a standalone TypeScript test script that imports `lib/state-machine.ts` and asserts all 10 transition rules and blocker requirements with zero external testing framework dependencies."

### What you got
The AI generated `test/lifecycle.test.ts` executing 14 assertion checks covering legal moves, illegal jumps, blocker rejection, unblocking restoration, and reopening.

### What you corrected
One test assertion string check expected lowercase `'in review'` while the engine returned capitalized `'In Review first'`. We aligned the assertion substring check so all 14/14 tests pass cleanly.
