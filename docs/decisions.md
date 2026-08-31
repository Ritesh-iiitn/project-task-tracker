# Architectural & Technical Decisions

This document records the critical design and implementation decisions that shaped the PulseTrack codebase, including trade-offs considered and one decision that was later reversed.

---

## Decision 1: Pure Function Task Lifecycle State Machine Engine

- **Chose**: Isolating all task status transitions, legal next-state calculations, and blocker dependency checks into an independent, pure TypeScript module (`lib/state-machine.ts`).
- **Rejected**: Embedding status transition checks directly inside SQL database trigger procedures or scattered across API route handlers.
- **Why**: Isolating the state machine into a pure module guarantees that the exact same validation logic is easily unit tested (via automated test runner `test/lifecycle.test.ts`), shared between server route handlers and frontend modal buttons, and produces descriptive, human-readable rejection messages (e.g. *"Cannot move task to 'Done' because it is blocked by unfinished tasks: APEX-2 (In Progress)"*).

---

## Decision 2: Granular Per-Task Bulk Action Reporting Structure

- **Chose**: Designing the bulk execution API (`/api/tasks/bulk`) to execute per-task validation in a loop and return a structured summary object:
  ```json
  {
    "total": 5,
    "successCount": 4,
    "failureCount": 1,
    "results": [
      { "taskId": "...", "key": "APEX-3", "title": "...", "success": false, "reason": "Cannot move task to 'Done' because it is blocked by unfinished tasks: APEX-2 (In Progress)" }
    ]
  }
  ```
- **Rejected**: Wrapping the entire batch in a single atomic database transaction that fails all tasks if any single task move is illegal.
- **Why**: Goal 7 explicitly mandates: *"Because some of those changes will be illegal for some tasks, the result must report per task what succeeded and what was rejected and why — not just fail the whole batch."* A full-fail transaction frustrates managers who select 20 tasks where only one has a blocker constraint.

---

## Decision 3: Relational Snapshot Tracking for Overdue Alert Dismissals

- **Chose**: Storing alert dismissals in a dedicated junction table `task_alert_dismissals` with columns `(taskId, userId, dueDateAtDismissal, dismissedAt)`.
- **Rejected**: Storing a simple boolean flag `isDismissed` on the `tasks` table or using browser `localStorage`.
- **Why**:
  1. A simple boolean on the task table causes one assignee's dismissal to dismiss the alert for all other team members.
  2. Browser `localStorage` loses dismissal state across devices and makes server-side badge count calculation impossible.
  3. Storing `dueDateAtDismissal` allows the system to compare the current `task.dueDate` with the snapshot timestamp and automatically restore the alert if a manager reschedules the deadline (fulfilling Goal 10: *"If that task's due date later changes, the alert comes back"*).

---

## Decision 4: Unified Full-Stack Architecture with Next.js App Router & Prisma ORM

- **Chose**: A single cohesive Next.js 14 (App Router) TypeScript project housing both server-rendered API routes, server-side search filters, and rich React UI components with Prisma ORM.
- **Rejected**: Setting up a separate Express backend repository and a standalone Vite React frontend repository.
- **Why**: A unified repository eliminates CORS configuration headaches, simplifies local evaluation to a single command (`npm run dev`), ensures 100% type-safety sharing between backend state machine models and frontend components, and allows instantaneous deployment to platforms like Render, Vercel, or Fly.io.

---

## Decision 5: Session Storage & Authentication Strategy

- **Chose**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`jose`) and transmitted via secure, HTTP-only, SameSite cookies and optional Bearer headers.
- **Rejected**: In-memory server-side session stores with Redis.
- **Why**: In-memory sessions require maintaining persistent Redis/Memcached infrastructure, which introduces complexity and fails on serverless edge runtimes. Signed JWTs are completely self-contained, verify in sub-millisecond time, and survive server restarts.

- **Later reversed**: Initially, we attempted to store authentication tokens purely in `localStorage` and transmit them via client-side JavaScript headers. We reversed this decision and migrated to **HTTP-only cookies** combined with server-side middleware extraction.
  - *What changed our mind*: `localStorage` is vulnerable to Cross-Site Scripting (XSS) token exfiltration and cannot be read by Next.js Server Components / server-side layout guards before page render, resulting in visual authentication flicker. HTTP-only cookies provide superior enterprise security and seamless server-side session resolution.
