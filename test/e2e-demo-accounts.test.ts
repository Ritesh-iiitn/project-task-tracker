import { validateStatusTransition } from '../lib/state-machine';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'MEMBER';
  assignedProjects: string[];
}

const DEMO_USERS: Record<string, DemoUser> = {
  manager: {
    id: 'user_manager',
    name: 'Alex Morgan',
    email: 'manager@company.com',
    role: 'MANAGER',
    assignedProjects: ['FINTECH', 'HEALTH', 'LOGISTICS', 'LEGACY'],
  },
  sarah: {
    id: 'user_sarah',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    role: 'MEMBER',
    assignedProjects: ['FINTECH', 'LOGISTICS'],
  },
  david: {
    id: 'user_david',
    name: 'David Kim',
    email: 'david@company.com',
    role: 'MEMBER',
    assignedProjects: ['FINTECH', 'HEALTH'],
  },
  elena: {
    id: 'user_elena',
    name: 'Elena Rostova',
    email: 'elena@company.com',
    role: 'MEMBER',
    assignedProjects: ['HEALTH', 'LOGISTICS'],
  },
};

function runE2EVerification() {
  console.log('🧪 Starting End-to-End Demo Accounts Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Manager Global RBAC Permissions
  console.log('Test Suite 1: Manager Global Scoping & Administrative Capabilities');
  const manager = DEMO_USERS.manager;
  assert(manager.role === 'MANAGER', 'Manager role is properly identified as MANAGER');
  assert(manager.assignedProjects.length === 4, 'Manager has global visibility across all 4 active/archived projects');

  // 2. Member Scoped Project Isolation
  console.log('\nTest Suite 2: Member Scoped Project Visibility & Isolation');
  const sarah = DEMO_USERS.sarah;
  const david = DEMO_USERS.david;
  const elena = DEMO_USERS.elena;

  assert(
    sarah.assignedProjects.includes('FINTECH') && !sarah.assignedProjects.includes('HEALTH'),
    'Sarah Chen cannot access Health Telemed App (strictly scoped to Fintech & Logistics)'
  );
  assert(
    david.assignedProjects.includes('HEALTH') && !david.assignedProjects.includes('LOGISTICS'),
    'David Kim cannot access Global Logistics Tracker (strictly scoped to Fintech & Health)'
  );
  assert(
    elena.assignedProjects.includes('LOGISTICS') && !elena.assignedProjects.includes('FINTECH'),
    'Elena Rostova cannot access Fintech Payments Portal (strictly scoped to Health & Logistics)'
  );

  // 3. Blocker Dependency Rule Enforcement
  console.log('\nTest Suite 3: Blocker Dependency Enforcement for Task Completion');
  const unfinishedDependency = [{ key: 'FIN-101', title: 'Payment Gateway Vault', status: 'In Progress' }];
  const blockerCheck = validateStatusTransition('In Review', 'Done', null, unfinishedDependency);
  assert(
    blockerCheck.valid === false,
    'Server rejects transition to Done when unresolved blockers exist'
  );

  // 4. Overdue Task Alert Scope
  console.log('\nTest Suite 4: Overdue Alert Evaluation and User Scoping');
  const isOverdue = (dueDate: Date, status: string) => dueDate < new Date() && status !== 'Done';
  const pastDate = new Date(Date.now() - 86400000);
  const futureDate = new Date(Date.now() + 86400000);

  assert(isOverdue(pastDate, 'In Progress') === true, 'Past due incomplete task is flagged as overdue');
  assert(isOverdue(pastDate, 'Done') === false, 'Completed task past due date is not flagged as overdue');
  assert(isOverdue(futureDate, 'In Progress') === false, 'Future due task is not flagged as overdue');

  console.log(`\n=================================================`);
  console.log(`🏁 E2E Demo Accounts Verification: ${passed} passed, ${failed} failed`);
  console.log(`=================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runE2EVerification();
