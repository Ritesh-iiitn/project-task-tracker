# Database Schema Design & Scaling Analysis

## Table by table: what columns and types does each one have?

### 1. `users`
Stores user identities, credentials, and organizational authorization roles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Unique user identifier |
| `email` | `String` | `UNIQUE, NOT NULL` | Login email address |
| `passwordHash` | `String` | `NOT NULL` | Bcrypt password hash (10 salt rounds) |
| `name` | `String` | `NOT NULL` | Full display name |
| `role` | `String` | `DEFAULT 'member'` | Authorization level: `'manager'` \| `'member'` |
| `createdAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updatedAt` | `DateTime` | `NOT NULL` | Last profile update timestamp |

### 2. `projects`
Stores client engagements and workspace partitions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Unique project identifier |
| `key` | `String` | `UNIQUE, NOT NULL` | Short uppercase prefix (e.g. `APEX`, `NOVA`) |
| `name` | `String` | `NOT NULL` | Project name |
| `description` | `String` | `NULLABLE` | Detailed engagement scope |
| `ownerId` | `String` | `FOREIGN KEY (users.id) ON DELETE RESTRICT` | User who manages the project |
| `isArchived` | `Boolean` | `DEFAULT FALSE, NOT NULL` | Soft-archive flag hiding from active views |
| `createdAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Project creation timestamp |
| `updatedAt` | `DateTime` | `NOT NULL` | Project update timestamp |

### 3. `project_members`
Junction table managing project membership access controls.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Membership record ID |
| `projectId` | `String` | `FOREIGN KEY (projects.id) ON DELETE CASCADE` | Associated project |
| `userId` | `String` | `FOREIGN KEY (users.id) ON DELETE CASCADE` | Assigned team member |
| `createdAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Membership assignment timestamp |
| **Compound Constraint** | `UNIQUE(projectId, userId)` | Prevents duplicate enrollments |

### 4. `tasks`
Core task entity storing lifecycle state, metadata, and scheduling.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Unique task identifier |
| `taskNumber` | `Int` | `NOT NULL` | Sequential task number within project (e.g. `1`, `2`) |
| `key` | `String` | `UNIQUE, NOT NULL` | Formatted key (e.g. `APEX-1`, `NOVA-3`) |
| `projectId` | `String` | `FOREIGN KEY (projects.id) ON DELETE CASCADE` | Parent project |
| `title` | `String` | `NOT NULL` | Task title summary |
| `description` | `String` | `NULLABLE` | Detailed specifications/notes |
| `priority` | `String` | `DEFAULT 'medium'` | `'low'` \| `'medium'` \| `'high'` \| `'urgent'` |
| `status` | `String` | `DEFAULT 'Backlog'` | `'Backlog'` \| `'In Progress'` \| `'In Review'` \| `'Done'` \| `'Blocked'` |
| `previousStatus` | `String` | `NULLABLE` | Tracks state from which task was blocked |
| `dueDate` | `DateTime` | `NULLABLE` | Deadline timestamp |
| `completedAt` | `DateTime` | `NULLABLE` | Timestamp when moved to `'Done'` |
| `createdById` | `String` | `FOREIGN KEY (users.id) ON DELETE RESTRICT` | Task author |
| `createdAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |
| `updatedAt` | `DateTime` | `NOT NULL` | Last modification timestamp |

### 5. `task_assignees`
Junction table enabling multi-user assignment on tasks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Assignment record ID |
| `taskId` | `String` | `FOREIGN KEY (tasks.id) ON DELETE CASCADE` | Associated task |
| `userId` | `String` | `FOREIGN KEY (users.id) ON DELETE CASCADE` | Assigned team member |
| `assignedAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Assignment timestamp |
| **Compound Constraint** | `UNIQUE(taskId, userId)` | Prevents duplicate assignments |

### 6. `task_dependencies`
Self-referential junction table enforcing blocking relationships between tasks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Dependency record ID |
| `taskId` | `String` | `FOREIGN KEY (tasks.id) ON DELETE CASCADE` | The blocked task |
| `blockedById` | `String` | `FOREIGN KEY (tasks.id) ON DELETE CASCADE` | The blocker task |
| `createdAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Dependency creation timestamp |
| **Compound Constraint** | `UNIQUE(taskId, blockedById)` | Prevents duplicate dependency links |

### 7. `task_activities` (Immutable Audit Trail)
Append-only log recording every creation, update, assignment, status jump, and comment.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Activity event ID |
| `taskId` | `String` | `FOREIGN KEY (tasks.id) ON DELETE CASCADE` | Target task |
| `userId` | `String` | `FOREIGN KEY (users.id) ON DELETE RESTRICT` | User who initiated the action |
| `type` | `String` | `NOT NULL` | Event type (`'created'`, `'status_change'`, `'field_change'`, `'assignment'`, `'unassignment'`, `'comment'`, `'dependency_add'`, `'dependency_remove'`) |
| `field` | `String` | `NULLABLE` | Modified property (`'title'`, `'status'`, `'dueDate'`, etc.) |
| `oldValue` | `String` | `NULLABLE` | Previous value string |
| `newValue` | `String` | `NULLABLE` | New value string |
| `comment` | `String` | `NULLABLE` | Comment text or automated system note |
| `createdAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Immutable event timestamp |

### 8. `task_alert_dismissals`
Tracks user-specific overdue alert dismissals and resets.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String (UUID)` | `PRIMARY KEY` | Dismissal ID |
| `taskId` | `String` | `FOREIGN KEY (tasks.id) ON DELETE CASCADE` | Target task |
| `userId` | `String` | `FOREIGN KEY (users.id) ON DELETE CASCADE` | User who dismissed the alert |
| `dueDateAtDismissal` | `DateTime` | `NULLABLE` | Snapshot of `dueDate` when dismissed |
| `dismissedAt` | `DateTime` | `DEFAULT CURRENT_TIMESTAMP` | Dismissal timestamp |
| **Compound Constraint** | `UNIQUE(taskId, userId)` | One active dismissal per user per task |

---

## Which relationships are one-to-many, and which are many-to-many?

### One-to-Many Relationships (`1:N`)
- **`User` → `Project` (Owned Projects)**: One user (manager) owns multiple projects.
- **`User` → `Task` (Created Tasks)**: One user authors multiple tasks.
- **`Project` → `Task`**: One project contains multiple tasks; each task belongs to exactly one project (`Goal 3`).
- **`Task` → `TaskActivity`**: One task has a chronological sequence of multiple immutable audit log entries (`Goal 9`).

### Many-to-Many Relationships (`M:N`)
- **`User` ↔ `Project` (via `project_members`)**: A user can belong to multiple client projects, and a project has multiple team members.
- **`Task` ↔ `User` (via `task_assignees`)**: A task can have multiple assignees, and a user can hold multiple tasks across projects (`Goal 5`).
- **`Task` ↔ `Task` (via `task_dependencies`)**: Self-referential M:N relationship where a task can be blocked by multiple tasks and can block multiple tasks in the same project (`Goal 3 & 4`).
- **`Task` ↔ `User` (via `task_alert_dismissals`)**: Multiple users assigned to a task can individually dismiss overdue alerts for that task (`Goal 10`).

---

## Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

### Database-Enforced Constraints
- **Primary & Foreign Key Referential Integrity**: Ensures child entities (`TaskAssignee`, `TaskDependency`, `TaskActivity`) cannot point to non-existent tasks or users.
- **Cascading Deletions**: Deleting a project cleanly cascades to its tasks, assignees, dependencies, and dismissals without leaving orphan rows.
- **Unique Constraints**:
  - `projects.key`: Prevents duplicate project keys.
  - `tasks.key`: Prevents duplicate formatted task keys across the system.
  - `project_members(projectId, userId)`: Prevents duplicate membership records.
  - `task_assignees(taskId, userId)`: Prevents assigning the same user multiple times to one task.
  - `task_dependencies(taskId, blockedById)`: Prevents duplicate dependency rows.
  - `task_alert_dismissals(taskId, userId)`: Prevents redundant dismissal records.
- **NOT NULL & Default Values**: Ensures data consistency at the lowest storage tier.

### Application-Enforced Constraints
- **Lifecycle Transition State Machine (`lib/state-machine.ts`)**:
  - Valid transitions: `Backlog` → `In Progress` → `In Review` → `Done`.
  - Blocked moves: Only allowed from `In Progress` or `In Review`.
  - Unblocking: Restores strictly to `previousStatus`.
  - Blockers verification: Cannot move to `Done` if any blocker is unfinished.
  - *Why*: Complex stateful transitions, dependency status checks across joined rows, and contextual error explanations require dynamic business logic execution that is brittle and unportable if implemented purely in database trigger procedures.
- **Project-Scoped Task Assignment (`Goal 5`)**:
  - Validation that every assignee is an authorized member of the task's parent project.
  - Automatic unassignment of removed project members across all project tasks.
  - *Why*: Involves relational business policies and audit event generation for unassigned members.
- **Alert Invalidation on Due Date Change (`Goal 10`)**:
  - Resetting `task_alert_dismissals` when a task's `dueDate` is modified.
  - *Why*: Application code manages the difference between a task edit that changes dates versus non-date updates.
- **Immutability of Activity History (`Goal 9`)**:
  - Enforced by exposing zero update/delete routes in the application layer.

---

## What did you deliberately denormalise?

1. **`tasks.key` (e.g. `APEX-1`)**:
   - Denormalised combination of `projects.key` and `tasks.taskNumber`.
   - *Why*: Storing the combined string key enables fast single-column indexing, direct URL routing, and O(1) text search lookups without requiring a table join with `projects` on every query.
2. **`tasks.previousStatus`**:
   - Stores `'In Progress'` or `'In Review'` directly on the task row when marked as `'Blocked'`.
   - *Why*: Avoids querying and parsing the entire historical activity log table to determine which state to restore the task to upon unblocking.
3. **`tasks.completedAt`**:
   - Stores the exact completion timestamp directly on the task row.
   - *Why*: Enables rapid aggregation of weekly completion velocity over the last 8 weeks for the dashboard (`Goal 8`) using simple indexed range queries instead of scanning millions of activity rows.
4. **`task_activities.oldValue` and `task_activities.newValue` as string snapshots**:
   - Stores human-readable names and text representations at the moment of change.
   - *Why*: Preserves historical fidelity even if an assigned user's name is later edited in the system.

---

## What would break first if this had 100x the data?

At 100x scale (e.g., 5,000,000 tasks, 20,000,000 activity logs, 50,000 users):

1. **`task_activities` Table Volume & Index Bloat**:
   - Every single task mutation writes to `task_activities`. At 100x scale, this table will grow into tens of millions of rows.
   - *Fix*: Implement time-based table partitioning (PostgreSQL range partitioning by `createdAt` month/year) and offload archived project activity logs to cold columnar object storage (e.g., AWS S3 / Parquet).
2. **Dashboard 8-Week Completion Aggregations**:
   - Calculating weekly completion trends on millions of rows on every dashboard load will saturate CPU cycles.
   - *Fix*: Introduce a materialized aggregate view or Redis cache updated incrementally via background workers.
3. **Overdue Alerts Full Table Scans**:
   - Querying `dueDate < NOW() AND status != 'Done'` across millions of tasks can become a bottleneck without composite indexing.
   - *Fix*: Composite partial index on `tasks (dueDate, status) WHERE status != 'Done'`.
4. **Task Number Increment Race Conditions (`taskNumber`)**:
   - Currently, `taskNumber = lastTask.taskNumber + 1` executes inside an ACID transaction. Under high concurrent creation load in the same project, row-level locking may cause contention.
   - *Fix*: Use dedicated project-scoped sequence generators or PostgreSQL sequences (`CREATE SEQUENCE`).
