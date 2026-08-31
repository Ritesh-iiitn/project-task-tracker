# System Architecture & Technical Design

## What are the moving pieces, and how do they talk to each other?

The system is composed of four primary architectural layers designed for strict data integrity, server-enforced security boundaries, and predictable state transitions:

```mermaid
flowchart TB
    %% Styling
    classDef client fill:#1e293b,stroke:#6366f1,stroke-width:2px,color:#fff
    classDef auth fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff
    classDef engine fill:#14532d,stroke:#4ade80,stroke-width:2px,color:#fff
    classDef db fill:#451a03,stroke:#fb923c,stroke-width:2px,color:#fff

    subgraph ClientLayer ["1. Client-Side Presentation Tier (React 18 & Tailwind CSS)"]
        UI["🖥️ Browser Client UI"]
        DASH["📊 Executive Dashboard\n(Capacity Matrix & 8-Week Velocity)"]
        PROJ["📁 Client Projects Portfolio\n(Creation, Team Scopes, Archival)"]
        TASKS["📋 Global Task Finder\n(Table & Kanban Board)"]
        MYTASKS["👤 Personal 'My Tasks' Workbench"]
        ALERTS["🚨 Overdue Alert Center"]
        MODAL["🔍 Task Detail & Audit Timeline Modal"]
    end

    subgraph SecurityLayer ["2. Authentication & Authorization Gateway"]
        AUTH_GATE{"🔒 Session Gate"}
        JWT["Signed JWT Cookie (Jose)"]
        GOOG["Google OAuth 2.0 Provider"]
        RBAC["🛡️ Server RBAC Scope Guard\n(Manager vs Member Project Scope)"]
    end

    subgraph EngineLayer ["3. Backend Business Logic & Rules Services"]
        SM["🔄 Finite State Machine\n(Backlog → In Progress → In Review → Done)"]
        DEP["🛑 Blocker Dependency Evaluator\n(Verify all blockers are Done)"]
        BULK["⚡ Granular Bulk Action Engine\n(Per-task success/failure reporting)"]
        UNASSIGN["👥 Automatic Task Unassignment\n(Atomic Project Member Removal)"]
        ALERTMGR["⏱️ Overdue Alert Invalidator\n(Auto-resets dismissal on due date change)"]
    end

    subgraph StorageLayer ["4. Relational Database Tier (Prisma ORM & PostgreSQL / Supabase)"]
        PRISMA["⚡ Prisma ORM (ACID Transactions)"]
        T_USERS["👤 users"]
        T_PROJ["📁 projects & project_members"]
        T_TASKS["📋 tasks & task_assignees"]
        T_DEP["🔗 task_dependencies"]
        T_ACT["📜 task_activities (Immutable Audit Log)"]
        T_ALERT["🔔 task_alert_dismissals"]
    end

    %% Connections
    UI --> DASH & PROJ & TASKS & MYTASKS & ALERTS & MODAL
    DASH & PROJ & TASKS & MYTASKS & ALERTS & MODAL --> AUTH_GATE

    AUTH_GATE --> JWT & GOOG
    AUTH_GATE --> RBAC
    
    RBAC --> SM
    RBAC --> DEP
    RBAC --> BULK
    RBAC --> UNASSIGN
    RBAC --> ALERTMGR

    SM & DEP & BULK & UNASSIGN & ALERTMGR --> PRISMA
    PRISMA --> T_USERS & T_PROJ & T_TASKS & T_DEP & T_ACT & T_ALERT

    class UI,DASH,PROJ,TASKS,MYTASKS,ALERTS,MODAL client
    class AUTH_GATE,JWT,GOOG,RBAC auth
    class SM,DEP,BULK,UNASSIGN,ALERTMGR engine
    class PRISMA,T_USERS,T_PROJ,T_TASKS,T_DEP,T_ACT,T_ALERT db
```

---

## Task Lifecycle State Machine & Blocker Rules

```mermaid
stateDiagram-v2
    [*] --> Backlog: Task Created

    Backlog --> In_Progress: Start Work
    
    In_Progress --> In_Review: Submit for Review
    In_Progress --> Blocked: Blocked by External Factor (Remembers previousStatus)
    In_Progress --> Backlog: Return to Backlog

    In_Review --> Done: Move to Done (Only if all Blocker Tasks are Done!)
    In_Review --> In_Progress: Request Changes
    In_Review --> Blocked: Blocked by Review Dependency
    In_Review --> Backlog: Demote

    Blocked --> In_Progress: Unblock (if blocked from In Progress)
    Blocked --> In_Review: Unblock (if blocked from In Review)

    Done --> In_Progress: Reopen Task
    Done --> Backlog: Reopen Task
    Done --> [*]: Project Archival

    note right of In_Review
      🛑 Blocker Rule:
      Server queries task_dependencies.
      If ANY blocker task != 'Done',
      the transition to 'Done' is rejected with HTTP 400!
    end note
```

---

## Where does each piece run?

- **Browser Environment**: Runs the single-page React interface, manages form validation, renders animated charts, and consumes REST endpoints via typed fetch envelopes.
- **Serverless / Node.js Runtime (Vercel / Render)**: Executes Next.js 14 API routes, verifies cryptographic JWT signatures, enforces project accessibility scopes, and evaluates state machine transitions.
- **Relational Database (PostgreSQL / Supabase / SQLite)**: Enforces foreign key referential integrity, unique constraints (`[taskId, userId]`, `[projectId, userId]`), index lookups on `[projectId, status]`, and persistent ACID transactions.

---

## Request Path for a Representative User Action

### Action: Transitioning a Task from `In Review` to `Done`

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User (Sarah / David)
    participant UI as 🖥️ React UI (Task Modal)
    participant API as ⚙️ Next.js Route Handler (/api/tasks/:id)
    participant Auth as 🔒 Auth & RBAC Guard
    participant SM as 🔄 State Machine Engine
    participant DB as 🗄️ PostgreSQL (Prisma)

    User->>UI: Clicks "Move to Done"
    UI->>API: PATCH /api/tasks/:id { status: "Done" }
    API->>Auth: Verify JWT session & project membership
    Auth-->>API: Authorized (user belongs to project)
    
    API->>DB: Query task + task_dependencies (blockers)
    DB-->>API: Returns blockers: [ { key: "FINTECH-2", status: "Done" } ]
    
    API->>SM: validateStatusTransition("In Review", "Done", blockers)
    SM-->>API: ✅ Transition Valid (All blockers are Done)
    
    API->>DB: prisma.$transaction:
    Note over DB: 1. Update task status = "Done", completedAt = NOW()<br/>2. Append to task_activities (Immutable Audit Log)
    DB-->>API: Transaction Committed
    
    API-->>UI: HTTP 200 { task: {...}, legalTransitions: ["In Progress", "Backlog"] }
    UI->>User: Renders green "Done" pill & appends timeline event
```

---

## What did you decide *not* to build, and why?

1. **In-Memory Client-Side Filtering / Pagination**
   - *Decision*: We deliberately rejected loading all portfolio tasks into browser JavaScript state.
   - *Rationale*: Meeting Goal 6 strictly requires database-level search, filtering, and pagination. In a real-world multi-client company with tens of thousands of historical tasks, in-memory filtering exhausts browser RAM and causes severe security leaks of confidential project data.

2. **Delete / Mutation Routes for Activity Timelines**
   - *Decision*: We omitted any edit or delete endpoints for `task_activities`.
   - *Rationale*: Goal 9 requires an immutable history that cannot be rewritten even by administrators.

3. **Cross-Project Circular Blocker Graphs**
   - *Decision*: We strictly scoped task blocking dependencies to other tasks within the *same project*.
   - *Rationale*: Professional services contracts are deliverables within isolated client scopes. Cross-client blocking dependencies create inter-client security hazards and deadlock risks.

4. **External Auth Provider Lock-In**
   - *Decision*: We built a self-contained JWT engine alongside official Google Cloud OAuth 2.0.
   - *Rationale*: Guarantees 100% local zero-config evaluation while retaining standard Google cloud sign-in capabilities.
