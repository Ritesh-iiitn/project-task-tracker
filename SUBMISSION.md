# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** https://github.com/Ritesh-iiitn/project-task-tracker-
- **Live application:** https://project-task-tracker-eta.vercel.app

## Notes for the reviewer

- **Instant 1-Click Role Switcher**: A fast role switcher dropdown is embedded in both the top navigation header and the login page. This allows you to switch between the Manager role (`Alex Morgan`) and any regular Member role (`Sarah Chen`, `David Kim`, `Elena Rostova`) in one click without manually typing credentials each time.
- **Self-Contained & Cloud Ready Database**: The repository is fully configured with Prisma ORM and supports both local zero-config SQLite and cloud PostgreSQL (Supabase). It boots up immediately with `npm run dev`.
- **Automated Test Suite**: Run `npm test` to execute the automated verification test suite verifying all 14 lifecycle state transitions, blocking dependency rules, and invalid jump rejections.
- **Dark & Light Mode**: Built-in interactive theme switcher toggle (Sun/Moon button) available both on the landing page and inside the workspace.
- **Google Cloud OAuth 2.0**: Full Google authentication flow with Google Cloud Console credentials and account selector support.

## Demo credentials

| Role | Email | Password | Assigned Projects Scope |
|---|---|---|---|
| **Manager** | `manager@company.com` | `password123` | All projects (Fintech, Health, Logistics, Legacy) + full admin control |
| **Member 1 (Lead Engineer)** | `sarah@company.com` | `password123` | Assigned to **Fintech Payments Portal** and **Global Logistics Tracker** |
| **Member 2 (Frontend Dev)** | `david@company.com` | `password123` | Assigned to **Fintech Payments Portal** and **Health Telemed App** |
| **Member 3 (QA & DevOps)** | `elena@company.com` | `password123` | Assigned to **Health Telemed App** and **Global Logistics Tracker** |

## Stack

| Layer | What you used | Why |
|---|---|---|
| **Frontend** | React 18, Next.js 14 App Router, Tailwind CSS, Lucide React Icons | Modern, reactive UI with responsive layout, instant tab switching, dual Table/Kanban views, Dark/Light mode, and zero heavy UI framework lock-in. |
| **Backend** | Next.js 14 API Route Handlers (Node.js & TypeScript), `jose` (JWT), Google OAuth 2.0 | Type-safe unified full-stack architecture with server-enforced RBAC, isolated state machine engine, and per-item bulk action validation. |
| **Database** | Prisma ORM 5 with PostgreSQL (Supabase) / SQLite | Zero-friction local portability, ACID transactions (`prisma.$transaction`), relational integrity, and seamless deployment to Supabase/Render. |
| **Hosting** | Vercel / Render / Node.js Serverless | Free tier support with instant edge routing and environment variable security. |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | **Accounts and roles** | **Done** | Email & password auth (bcrypt + JWT in HTTP-only cookies) + Google OAuth 2.0. Managers can create/archive projects, edit membership, and delete tasks. Members only see their assigned projects. Server-enforced RBAC. |
| 2 | **Projects** | **Done** | Projects have unique short keys (e.g. `FINTECH`, `HEALTH`), names, descriptions, and owners. Projects can be archived and restored, hiding them from default views without destroying tasks. |
| 3 | **Tasks inside projects** | **Done** | Every task belongs to exactly one project with title, description, priority, optional due date, and blocking relationships (`blocked_by` tasks in same project). Tasks can be created, edited, and deleted (manager only). |
| 4 | **A task lifecycle with rules** | **Done** | State machine: `Backlog` → `In Progress` → `In Review` → `Done`. `Blocked` allowed only from `In Progress` or `In Review`. Unblocking restores `previousStatus`. Reopening supported. Server strictly rejects moving to `Done` if blocking tasks are unfinished and rejects illegal jumps (e.g. Backlog straight to Done). Interface only displays legal moves. |
| 5 | **Assignment** | **Done** | Multi-assignee support per task. Only project members can be assigned. Removing a member from a project automatically unassigns them from all project tasks and logs an immutable audit event. Global "My Tasks" view consolidates all assigned work across projects. |
| 6 | **Finding things** | **Done** | Server-side text search over titles, descriptions, and keys. Server-side filtering by project, status, assignee, priority, and overdue. Server-side sorting and pagination with total match counts. |
| 7 | **Acting on many tasks at once** | **Done** | Multi-select task table with bulk status change, bulk assignment, and bulk due dates. Reports per task what succeeded and what was rejected with specific error explanations. Separate server-side CSV export of filtered list. |
| 8 | **A dashboard** | **Done** | Landing dashboard shows headline metrics (Open, Overdue, Due This Week, Completed This Week), status breakdown, team workload breakdown ("who is overloaded" with overload badges), and 8-week completion trajectory chart. |
| 9 | **History you cannot rewrite** | **Done** | Append-only `task_activities` table logging task creation, all field edits (with old and new values), assignments/unassignments, blocker changes, and comments. No update or delete endpoints exist; timeline is strictly immutable. |
| 10 | **Overdue alerts** | **Done** | Overdue tasks (`dueDate < NOW() AND status != 'Done'`) appear in dedicated Alert Center with a navigation count badge. Assigned members can dismiss alerts. When a task's due date is edited, the dismissal is cleared and the alert resurfaces. |

## How much time did you actually spend?

**Total Time Spent**: Approximately **13 hours** across 5 focused engineering sessions:
- Architecture, Schema & State Machine Design: 2.5 hours
- Core Backend APIs & RBAC Middleware: 2.5 hours
- Compound Endpoints (Bulk Reporting, Alert Resets, Unassignment Automation): 2.5 hours
- Frontend Development (Dashboard, Projects, Tasks Table & Kanban, Modals, Role Switcher, Dark/Light Mode): 3.5 hours
- Verification Testing, Seeding & Documentation: 2.0 hours

## What would you do next, with another 12 hours?

1. **Cycle Detection on Dependency Graph**: Implement Tarjan's strongly connected components algorithm or DFS cycle detection across multi-tier task dependency chains to prevent circular blockers.
2. **Real-time Live Collaboration via WebSockets**: Add WebSockets / Server-Sent Events (SSE) so status moves, comments, and alert badge counts update in real-time across multiple active browser windows without manual refreshes.
3. **Time Tracking & Sprint Velocity**: Add work log time tracking (estimated hours vs actual logged hours) and burndown velocity charts per client project.
4. **Saved Custom Filter Views**: Allow users to save complex multi-column filter queries (e.g. "Urgent & Overdue Frontend Tasks") as quick-access bookmarks.

## What are you least happy with in this codebase, and why?

The sequential loop in the bulk operations endpoint (`/api/tasks/bulk`). While it accurately satisfies Goal 7 by executing independent validations and returning granular per-task success/failure reports without failing the entire batch, executing sequential database updates for 100+ tasks in a single HTTP request can increase latency. With more time, we would process valid updates concurrently in chunks using `Promise.allSettled` and database batch pipelines while maintaining per-item error isolation.
