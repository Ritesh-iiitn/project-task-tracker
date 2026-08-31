# PulseTrack — Project & Task Tracking System

PulseTrack is a full-stack, enterprise-grade project portfolio and task lifecycle management application designed for client services companies managing multiple concurrent client engagements.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite / PostgreSQL**.

---

## 🌟 Key Features & 10 Project Goals Overview

1. **Role-Based Access Control (Goal 1)**
   - Secure authentication with bcrypt password hashing and JWT sessions in HTTP-only cookies.
   - Dual roles: `manager` (full portfolio control, project creation/archiving, membership management, task deletion) and `member` (scoped strictly to assigned projects). Server-enforced RBAC middleware.
2. **Client Project Portfolio (Goal 2)**
   - Unique short keys (`APEX`, `NOVA`, `ORBIT`), project ownership, and rich descriptions.
   - Soft archiving and restoration that hides completed projects from default views without destroying historical task data.
3. **Tasks & In-Project Dependencies (Goal 3)**
   - Project-scoped tasks carrying keys (`APEX-1`), priorities (`low`, `medium`, `high`, `urgent`), due dates, and blocking dependencies (`blocked_by`).
4. **Strict Task Lifecycle State Machine (Goal 4)**
   - Finite State Machine: `Backlog` → `In Progress` → `In Review` → `Done`.
   - `Blocked` status allowed only from `In Progress` or `In Review`, and unblocking restores the exact previous state.
   - Finished tasks can be reopened.
   - Server strictly rejects moving to `Done` if any blocking dependency is unfinished, and rejects illegal jumps with clear explanation messages.
5. **Multi-User Assignment & My Tasks (Goal 5)**
   - Multi-assignee support per task, restricted strictly to authorized project members.
   - Removing a member from a project automatically unassigns them from all project tasks and creates an immutable audit event.
   - Global **"My Tasks"** workbench aggregating all work assigned to the logged-in user.
6. **Server-Side Search, Filter & Pagination (Goal 6)**
   - Server-side text search over titles and descriptions.
   - Multi-filtering by project, status, assignee, priority, and overdue status.
   - Server-side sorting (due date, priority, updated at) and pagination with total match counts.
7. **Multi-Task Bulk Actions & CSV Export (Goal 7)**
   - Multi-select tasks to apply batch status moves, assignee changes, or new due dates.
   - Granular execution report detailing per-task success and specific rejection reasons.
   - Server-side CSV export of the active filtered task dataset.
8. **Executive Analytics Dashboard (Goal 8)**
   - Headline metrics: Open Tasks, Overdue Tasks, Due This Week, Completed This Week.
   - Team Workload & Capacity matrix identifying overloaded staff (`≥4 open tasks` or `≥2 overdue`).
   - 8-Week Completion Velocity chart visualizing sprint output over time.
9. **Immutable Audit History & Comments (Goal 9)**
   - Append-only activity timeline tracking task creation, all field edits (old and new values), assignments, unassignments, blocker changes, and user comments.
   - Read-only history: no edit or delete endpoints exist.
10. **Overdue Alerts & Invalidation Lifecycle (Goal 10)**
    - Overdue tasks (`dueDate < NOW() AND status != 'Done'`) surface in a dedicated Alert Center with a navigation count badge.
    - Assigned members can dismiss alerts.
    - Editing a task's due date automatically clears dismissals, causing the alert to resurface.
11. **Interactive Kanban Board (Bonus Stretch Feature)**
    - Dual view toggle between a data-dense server-paginated Table List and a visual Kanban Board.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Database Setup & Seeding
Initialize the SQLite database and seed it with realistic demo data:
```bash
# Push schema migrations
npx prisma db push

# Seed database with projects, tasks, dependencies, and demo users
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Login Credentials

You can use the **1-Click Demo Switcher** in the UI navigation bar or sign in manually:

| Role | Email | Password | Assigned Projects |
|---|---|---|---|
| **Manager** | `manager@company.com` | `password123` | All Projects (Full Admin Permissions) |
| **Member 1 (Senior Dev)** | `sarah@company.com` | `password123` | Apex Fintech, Orbit Logistics |
| **Member 2 (Frontend Dev)** | `david@company.com` | `password123` | Apex Fintech, Nova Health |
| **Member 3 (QA & DevOps)** | `elena@company.com` | `password123` | Nova Health, Orbit Logistics |

---

## 🧪 Running Automated Verification Tests

Run the test suite verifying all 14 lifecycle state machine transitions, dependency blocker enforcement, and invalid jump rejections:
```bash
npm test
```

---

## 📚 Documentation Suite

Comprehensive design documents are available in the `docs/` folder:

- [`SUBMISSION.md`](file:///Users/riteshsingh/Documents/busyassignment/SUBMISSION.md): Candidate self-assessment, stack rationale, and time audit.
- [`docs/architecture.md`](file:///Users/riteshsingh/Documents/busyassignment/docs/architecture.md): System components, request paths, runtime environments, and non-goals.
- [`docs/schema.md`](file:///Users/riteshsingh/Documents/busyassignment/docs/schema.md): Entity relationships, constraints, denormalization rationale, and 100x scaling analysis.
- [`docs/plan.md`](file:///Users/riteshsingh/Documents/busyassignment/docs/plan.md): Session breakdown, build sequencing, estimation vs actuals, and trade-offs.
- [`docs/decisions.md`](file:///Users/riteshsingh/Documents/busyassignment/docs/decisions.md): 5 key technical decisions and 1 reversed decision.
- [`docs/ai-prompts.md`](file:///Users/riteshsingh/Documents/busyassignment/docs/ai-prompts.md): Chronological log of AI interactions, prompts, results, and corrections.
