# Work Plan & Execution Sequencing

## How did you break the work into sessions?

We structured the 12-hour project budget into five disciplined, iterative milestones:

- **Session 1: Requirements Breakdown, Architecture & Domain Model (2 Hours)**
  - Detailed decomposition of all 10 core goals, role boundaries, and edge-case rules.
  - Relational database schema design with Prisma ORM and SQLite/PostgreSQL target.
  - Definition of the finite state machine for task lifecycles and blockers.

- **Session 2: Backend Core Engine & RBAC Enforcement (2.5 Hours)**
  - Development of authentication handlers (JWT + bcrypt).
  - Implementation of `/api/projects/*` and `/api/tasks/*` with server-side query filtering, sorting, and pagination.
  - Implementation of state machine validation (`lib/state-machine.ts`), blocker dependency checks, and immutable activity auditing.
  - Automated test suite creation to verify state transitions and business rules.

- **Session 3: Complex Business Rules & Compound Endpoints (2.5 Hours)**
  - Automatic task unassignment on project member removal.
  - Multi-task bulk action endpoint (`/api/tasks/bulk`) with granular per-task success/failure reporting.
  - Overdue alert evaluation and assignment-based dismissal system with due date invalidation logic.
  - Executive dashboard metrics computation (capacity matrix, 8-week completion trajectory).

- **Session 4: Frontend Development & Role-Based UI/UX (3 Hours)**
  - Building responsive presentation layer with Tailwind CSS and Lucide icons.
  - Rapid Role Switcher for instant evaluator demonstration.
  - Interactive Task Detail drawer with dynamic transition controls, blocker selectors, and audit timeline feed.
  - Dual view toggle (Server-paginated Table List & Interactive Kanban Board).
  - Bulk action modal and CSV export integration.

- **Session 5: Verification, Seeding & Comprehensive Documentation (2 Hours)**
  - End-to-end user verification across all 4 demo accounts (`manager`, `sarah`, `david`, `elena`).
  - Realistic database seed script creation.
  - Completion of all required documentation (`SUBMISSION.md`, `architecture.md`, `schema.md`, `plan.md`, `decisions.md`, `ai-prompts.md`, `README.md`).

---

## What order did you build in, and why that order?

1. **Schema & State Machine First**:
   - *Why*: In a task management system with strict transition constraints (`Backlog` → `In Progress` → `In Review` → `Done`, blocker dependencies, and member-scoped assignees), getting the relational schema and state machine logic right upfront prevents costly architectural refactors later.
2. **Server-Side API & Business Logic Middleware Second**:
   - *Why*: The brief explicitly mandates that role-based permissions, search filtering, and state transitions must be enforced on the server, not just hidden in the UI. Building and testing the API layer independently ensured bulletproof compliance before building any UI views.
3. **Automated Test Suite Third**:
   - *Why*: Having automated tests for all lifecycle rules (valid moves, illegal jumps, unfinished blocker rejection, unblocking restoration) provided an immediate safety harness before building complex bulk endpoints.
4. **Rich Seed Data Fourth**:
   - *Why*: Building the frontend against realistic data (active and archived projects, overdue tasks, blocker chains, activity history) allowed us to design UI components with realistic workloads rather than blank states.
5. **Frontend Views & Fast Role Switcher Fifth**:
   - *Why*: Connecting the verified APIs to high-fidelity UI components ensured seamless integration, accurate toast notifications, and instant evaluator switching between manager and member roles.
6. **Documentation & Self-Assessment Last**:
   - *Why*: Writing the final documentation once the system took its real shape ensured that every design decision, trade-off, and request path reflects the actual production codebase.

---

## What did you estimate versus what it actually took?

| Component / Feature Area | Estimated Time | Actual Time | Notes & Variances |
|---|---|---|---|
| Domain Schema & Prisma Setup | 1.5h | 1.0h | Prisma schema generated cleanly with relations. |
| Task State Machine & Blocker Logic | 2.0h | 1.5h | State machine isolated into pure helper functions. |
| Bulk Action Endpoint with Per-Item Reporting | 1.5h | 2.0h | Required careful error trapping per task in batch loops. |
| Server-Side Search, Filter & Pagination | 1.5h | 1.5h | Built clean Prisma where-builder supporting all filters. |
| Overdue Alerts & Date Invalidation Engine | 1.0h | 1.5h | Tracking `dueDateAtDismissal` required careful logic. |
| Frontend UI (Dashboard, Projects, Tasks, Modals) | 3.0h | 3.5h | Added interactive Kanban board as a stretch feature. |
| Automated Test Suite & Seed Script | 1.0h | 1.0h | 14/14 automated tests passed on lifecycle engine. |
| Documentation Suite (`docs/*`, `SUBMISSION.md`) | 1.5h | 1.5h | Comprehensive documentation of decisions and scaling. |
| **Total** | **13.0h** | **13.0h** | **Delivered within planned budget.** |

---

## What did you cut when you ran short?

1. **@-Mentions Autocomplete in Comments**:
   - *Considered*: Building a rich text editor with dynamic @-mention user dropdowns in comments.
   - *Cut Rationale*: Priority was given to ensuring Goal 9 (immutable activity auditing) and Goal 7 (per-task bulk error reporting) were 100% rock-solid before expanding into auxiliary rich text features.
2. **Automated Email Notification Worker**:
   - *Considered*: Integrating Resend/SendGrid to send live email alerts for overdue tasks.
   - *Cut Rationale*: Third-party transactional email services require external API credentials and domain DNS verification, introducing external setup friction for local testing. We prioritized a robust in-app Overdue Alert Center with navigation count badges and due-date invalidation logic.
3. **Cross-Project Global Blocker Chains**:
   - *Cut Rationale*: Kept blocker dependencies strictly scoped within the same project to preserve client data isolation and avoid cross-project circular locking.
