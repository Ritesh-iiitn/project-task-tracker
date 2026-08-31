# Architecture

## What are the moving pieces, and how do they talk to each other?

The system is composed of five core architectural layers designed for strict data integrity and predictable state management:

1. **Client-Side Presentation Layer (React 18 & Tailwind CSS)**
   - **Views**: Executive Dashboard, Client Projects Grid, Global Task Finder (Table & Kanban), Personal My Tasks, and Overdue Alert Center.
   - **State & Context**: `AuthContext` manages user identity, session state, rapid role switching for evaluation, and automatic background polling for overdue alert counters.
   - **Communication**: Interacts with the backend solely via typed asynchronous HTTP JSON requests (`fetch` API), handling response envelopes, validation error strings, and partial-batch bulk operation reports.

2. **API & Business Logic Routing Layer (Next.js 14 App Router)**
   - **Endpoints**: Modular REST route handlers (`/api/auth/*`, `/api/projects/*`, `/api/tasks/*`, `/api/alerts/*`, `/api/dashboard/*`).
   - **Authentication & RBAC Middleware**: Verifies cryptographic JWT tokens stored in HTTP-only cookies or Authorization Bearer headers. Computes project accessibility scopes so regular members never query or mutate projects outside their assignment.
   - **Rules Engine (`lib/state-machine.ts`)**: Enforces strict lifecycle state transition rules (`Backlog` → `In Progress` → `In Review` → `Done`, `Blocked` unblocking preservation, and blocker dependency checks) before any database write.

3. **Data Access & Relational Persistence Layer (Prisma ORM & SQLite / Postgres)**
   - **Prisma Client**: Provides type-safe queries, automatic relationship joins, cascading deletes where appropriate, and ACID transactions (`prisma.$transaction`) for compound actions (e.g., project member removal with automatic task unassignment, status transitions with audit timeline logging).
   - **Database Engine**: Relational storage enforcing foreign key constraints, indexes on frequently filtered fields (`[projectId, status]`, `[dueDate]`, `[userId]`), and unique constraints (`[taskId, userId]` for assignees, `[projectId, userId]` for memberships).

4. **Immutable Audit Trail Subsystem (`task_activities`)**
   - Every state transition, title/description edit, priority change, due date change, assignment/unassignment, and user comment writes an append-only row to `task_activities`. No API routes exist to mutate or delete activity history.

5. **Alert Invalidation Engine (`task_alert_dismissals`)**
   - Monitors overdue unfinished tasks (`dueDate < NOW() AND status != 'Done'`).
   - Tracks dismissal timestamps alongside `dueDateAtDismissal`. When a task's due date is updated in the database, all existing dismissals for that task are atomically cleared, restoring visibility to assigned users.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Browser Client (React UI)                       │
│  - Dashboard / Analytics      - Projects Portfolio   - Global Finder   │
│  - Kanban Board View          - Task Detail Modal    - Alerts Drawer   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (JWT Session Cookie)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 API Layer & Route Handlers                │
│  - RBAC Scope Validator       - Task State Machine Engine              │
│  - Bulk Execution Engine      - Server-Side Query / Filter / Paginate  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prisma ORM (ACID Transactions)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Relational Database (SQLite / Postgres)              │
│  - users             - projects             - project_members          │
│  - tasks             - task_assignees       - task_dependencies        │
│  - task_activities (Immutable Audit Log)    - task_alert_dismissals    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Where does each piece run?

- **Browser Environment**: Runs the React single-page interface, manages local UI form states, handles client-side transitions, and parses server-rendered CSV streams.
- **Serverless / Node.js Runtime (Render / Vercel / Docker)**: Runs the Next.js App Router server, verifies JWT signatures with secret keys kept strictly in environment variables, validates payload schemas, and executes business logic rules.
- **Database Server (Local SQLite for zero-config portability / Supabase PostgreSQL for cloud)**: Houses relational data on persistent NVMe/SSD storage, enforcing relational integrity, foreign key cascades, and unique constraints.

---

## What is the request path for one representative user action, end to end?

### Representative Action: Moving a task from `In Review` to `Done` with dependency checks

1. **User Action**: The user clicks the **"Move to Done"** action button on the Task Detail Modal for task `APEX-3`.
2. **Client Dispatch**: The client sends a `PATCH /api/tasks/[id]` request with body `{ "status": "Done" }` accompanied by the `auth_token` HTTP-only cookie.
3. **Session Verification**: The server extracts the JWT from the cookie, verifies its HMAC SHA-256 signature using `jose`, and retrieves the user record (`user.id`, `user.role`).
4. **Project Access Check**: If the user is a `member`, the server queries `project_members` to verify that `user.id` is enrolled in `APEX-3`'s parent project (`Apex Fintech`).
5. **Dependency Blocker Evaluation**:
   - The server queries `task_dependencies` joined with `tasks` where `taskId = APEX-3.id`.
   - It identifies that `APEX-2` is configured as a blocker and checks `APEX-2.status`.
   - *Case A (Blocker Unfinished)*: `APEX-2` is in `In Progress`. The state machine rejects the transition with HTTP 400 and returns `{ "error": "Cannot move task to 'Done' because it is blocked by unfinished tasks: APEX-2 (In Progress). All blocking tasks must be Done first." }`. The modal displays this exact error banner without modifying data.
   - *Case B (All Blockers Done)*: `APEX-2` is `Done`. The state machine validates the move from `In Review` to `Done` as legal.
6. **Atomic Database Execution (`prisma.$transaction`)**:
   - `tasks` table: Updates `status = 'Done'`, `completedAt = NOW()`, `previousStatus = null`, and `updatedAt = NOW()`.
   - `task_activities` table: Appends an immutable audit row (`type = 'status_change'`, `field = 'status'`, `oldValue = 'In Review'`, `newValue = 'Done'`, `userId = user.id`).
7. **HTTP Response**: The server returns HTTP 200 with the serialized updated task object and new legal transition options.
8. **Client UI Update**: The Task Detail Modal updates its status pill to green `Done`, replaces the action buttons with reopen options (`Move to In Progress`, `Move to Backlog`), and prepends the new status event to the timeline feed.

---

## What did you decide *not* to build, and why?

1. **Client-Side Task Filtering / In-Memory Pagination**
   - *Decision*: We deliberately rejected loading all tasks into the browser memory.
   - *Rationale*: Meeting Goal 6 strictly requires server-side search, filtering, and pagination. In a real-world multi-client company with tens of thousands of historical tasks, loading the full dataset causes browser lag, high memory consumption, and security leaks of project data not assigned to the user.
2. **WebSocket / Polling Server for Activity Deletion**
   - *Decision*: We avoided building any delete or edit endpoints for activity logs.
   - *Rationale*: Goal 9 requires an immutable history that cannot be rewritten even by managers. Omitting mutation APIs entirely guarantees absolute audit trail integrity.
3. **Complex Nested Dependency Graph Solvers**
   - *Decision*: We limited dependency enforcement to blocking tasks within the same project rather than building recursive cross-project acyclic graph recalculators.
   - *Rationale*: Task dependencies in professional services are project-scoped deliverables. Cross-project blocking introduces complex cross-client data leaks and circular deadlocks.
4. **Third-Party Auth Provider Lock-In (Firebase/Auth0)**
   - *Decision*: We implemented stateless, signed JWTs with bcrypt password hashing.
   - *Rationale*: Ensures zero external vendor lock-in, zero cloud billing costs, and 100% self-contained local reproducibility for the evaluation team.
