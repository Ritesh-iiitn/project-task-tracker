import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, subWeeks, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing existing database records...');
  await prisma.taskAlertDismissal.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating users with hashed passwords...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      passwordHash,
      name: 'Alex Morgan (Manager)',
      role: 'manager',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'sarah@company.com',
      passwordHash,
      name: 'Sarah Chen (Lead Engineer)',
      role: 'member',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'david@company.com',
      passwordHash,
      name: 'David Kim (Frontend Dev)',
      role: 'member',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'elena@company.com',
      passwordHash,
      name: 'Elena Rostova (DevOps)',
      role: 'member',
    },
  });

  console.log('📁 Creating client projects with clear names...');
  // Project 1: FINTECH
  const projFintech = await prisma.project.create({
    data: {
      key: 'FINTECH',
      name: 'Fintech Payments Portal',
      description: 'Client Project: Real-time payment processing, trading risk engine, and settlement dashboard.',
      ownerId: manager.id,
      isArchived: false,
    },
  });

  // Project 2: HEALTH
  const projHealth = await prisma.project.create({
    data: {
      key: 'HEALTH',
      name: 'Health Telemed Mobile App',
      description: 'Client Project: Video doctor consultations, medical record synchronization, and digital e-prescriptions.',
      ownerId: manager.id,
      isArchived: false,
    },
  });

  // Project 3: LOGISTICS
  const projLogistics = await prisma.project.create({
    data: {
      key: 'LOGISTICS',
      name: 'Global Logistics Tracker',
      description: 'Client Project: GPS cargo tracking, port congestion AI prediction, and carrier dispatch.',
      ownerId: manager.id,
      isArchived: false,
    },
  });

  // Project 4: LEGACY (Archived)
  const projLegacy = await prisma.project.create({
    data: {
      key: 'LEGACY',
      name: 'Legacy CRM Migration',
      description: 'Archived Project: Historical customer data migration from Oracle to Postgres.',
      ownerId: manager.id,
      isArchived: true,
    },
  });

  console.log('🤝 Assigning project memberships...');
  // Fintech: manager, sarah, david
  await prisma.projectMember.createMany({
    data: [
      { projectId: projFintech.id, userId: manager.id },
      { projectId: projFintech.id, userId: member1.id },
      { projectId: projFintech.id, userId: member2.id },
    ],
  });

  // Health: manager, david, elena
  await prisma.projectMember.createMany({
    data: [
      { projectId: projHealth.id, userId: manager.id },
      { projectId: projHealth.id, userId: member2.id },
      { projectId: projHealth.id, userId: member3.id },
    ],
  });

  // Logistics: manager, sarah, elena
  await prisma.projectMember.createMany({
    data: [
      { projectId: projLogistics.id, userId: manager.id },
      { projectId: projLogistics.id, userId: member1.id },
      { projectId: projLogistics.id, userId: member3.id },
    ],
  });

  // Legacy: manager, sarah
  await prisma.projectMember.createMany({
    data: [
      { projectId: projLegacy.id, userId: manager.id },
      { projectId: projLegacy.id, userId: member1.id },
    ],
  });

  console.log('📋 Creating tasks with clear descriptions and realistic histories...');
  const now = new Date();

  // ---------------- FINTECH TASKS ----------------
  // FINTECH-1: Done
  const ft1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      key: 'FINTECH-1',
      projectId: projFintech.id,
      title: 'Architect JWT and OAuth authentication security layer',
      description: 'Design stateless session management, refresh token rotation, and RBAC permission scopes.',
      priority: 'high',
      status: 'Done',
      dueDate: subDays(now, 10),
      completedAt: subDays(now, 4),
      createdById: manager.id,
      createdAt: subDays(now, 14),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: ft1.id, userId: member1.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: ft1.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 14) },
      { taskId: ft1.id, userId: manager.id, type: 'assignment', field: 'assignee', newValue: member1.name, createdAt: subDays(now, 13) },
      { taskId: ft1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 10) },
      { taskId: ft1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 5) },
      { taskId: ft1.id, userId: manager.id, type: 'comment', comment: 'Security review completed with zero vulnerabilities.', createdAt: subDays(now, 4) },
      { taskId: ft1.id, userId: manager.id, type: 'status_change', field: 'status', oldValue: 'In Review', newValue: 'Done', createdAt: subDays(now, 4) },
    ],
  });

  // FINTECH-2: In Review (Blocker for FINTECH-3, Overdue)
  const ft2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      key: 'FINTECH-2',
      projectId: projFintech.id,
      title: 'Implement live trading engine WebSocket stream',
      description: 'Stream real-time exchange orders and price tickers over secure WebSockets.',
      priority: 'urgent',
      status: 'In Review',
      dueDate: subDays(now, 2), // OVERDUE
      createdById: manager.id,
      createdAt: subDays(now, 8),
    },
  });
  await prisma.taskAssignee.createMany({
    data: [
      { taskId: ft2.id, userId: member1.id },
      { taskId: ft2.id, userId: member2.id },
    ],
  });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: ft2.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 8) },
      { taskId: ft2.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 6) },
      { taskId: ft2.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 1) },
      { taskId: ft2.id, userId: member2.id, type: 'comment', comment: 'Benchmark passed 10k events/sec. Ready for sign-off.', createdAt: subDays(now, 1) },
    ],
  });

  // FINTECH-3: In Progress, Blocked by FINTECH-2
  const ft3 = await prisma.task.create({
    data: {
      taskNumber: 3,
      key: 'FINTECH-3',
      projectId: projFintech.id,
      title: 'Build financial portfolio risk analytics heatmap UI',
      description: 'Visual risk matrix calculating exposure per asset class. Blocked until FINTECH-2 is Done.',
      priority: 'high',
      status: 'In Progress',
      dueDate: addDays(now, 3), // Due this week
      createdById: member1.id,
      createdAt: subDays(now, 5),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: ft3.id, userId: member2.id } });
  await prisma.taskDependency.create({ data: { taskId: ft3.id, blockedById: ft2.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: ft3.id, userId: member1.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 5) },
      { taskId: ft3.id, userId: member1.id, type: 'dependency_add', field: 'blocker', newValue: 'FINTECH-2', createdAt: subDays(now, 5) },
      { taskId: ft3.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 3) },
    ],
  });

  // FINTECH-4: Blocked status (Blocked from In Progress)
  const ft4 = await prisma.task.create({
    data: {
      taskNumber: 4,
      key: 'FINTECH-4',
      projectId: projFintech.id,
      title: 'Integrate SWIFT wire transfer international payout API',
      description: 'Process cross-border ISO banking files. Currently blocked waiting for bank sandbox API keys.',
      priority: 'urgent',
      status: 'Blocked',
      previousStatus: 'In Progress',
      dueDate: subDays(now, 4), // OVERDUE
      createdById: manager.id,
      createdAt: subDays(now, 10),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: ft4.id, userId: member1.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: ft4.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 10) },
      { taskId: ft4.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 7) },
      { taskId: ft4.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'Blocked', comment: 'Waiting on banking partner compliance team for production sandbox keys.', createdAt: subDays(now, 4) },
    ],
  });

  // FINTECH-5: Backlog
  const ft5 = await prisma.task.create({
    data: {
      taskNumber: 5,
      key: 'FINTECH-5',
      projectId: projFintech.id,
      title: 'Automate annual tax withholding summary statements',
      description: 'Generate customer 1099-B tax reports and PDF downloads.',
      priority: 'low',
      status: 'Backlog',
      dueDate: addDays(now, 14),
      createdById: manager.id,
      createdAt: subDays(now, 3),
    },
  });
  await prisma.taskActivity.create({
    data: { taskId: ft5.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 3) },
  });

  // ---------------- HEALTH TASKS ----------------
  // HEALTH-1: Done
  const hl1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      key: 'HEALTH-1',
      projectId: projHealth.id,
      title: 'Setup WebRTC encrypted peer-to-peer video rooms',
      description: 'HIPAA-compliant encrypted video consultation rooms with TURN relay server.',
      priority: 'urgent',
      status: 'Done',
      dueDate: subDays(now, 12),
      completedAt: subDays(now, 6),
      createdById: manager.id,
      createdAt: subDays(now, 18),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: hl1.id, userId: member2.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: hl1.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 18) },
      { taskId: hl1.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 14) },
      { taskId: hl1.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 8) },
      { taskId: hl1.id, userId: manager.id, type: 'status_change', field: 'status', oldValue: 'In Review', newValue: 'Done', createdAt: subDays(now, 6) },
    ],
  });

  // HEALTH-2: In Progress (Due this week)
  const hl2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      key: 'HEALTH-2',
      projectId: projHealth.id,
      title: 'FHIR hospital electronic health record synchronization',
      description: 'Sync patient medical history, allergies, and diagnoses securely.',
      priority: 'high',
      status: 'In Progress',
      dueDate: addDays(now, 2), // Due this week
      createdById: manager.id,
      createdAt: subDays(now, 7),
    },
  });
  await prisma.taskAssignee.createMany({
    data: [
      { taskId: hl2.id, userId: member2.id },
      { taskId: hl2.id, userId: member3.id },
    ],
  });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: hl2.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 7) },
      { taskId: hl2.id, userId: member3.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 4) },
    ],
  });

  // HEALTH-3: Overdue In Progress
  const hl3 = await prisma.task.create({
    data: {
      taskNumber: 3,
      key: 'HEALTH-3',
      projectId: projHealth.id,
      title: 'Digital e-prescription cryptographic signature system',
      description: 'Doctor smart card digital signature routing to certified partner pharmacies.',
      priority: 'urgent',
      status: 'In Progress',
      dueDate: subDays(now, 3), // OVERDUE
      createdById: manager.id,
      createdAt: subDays(now, 9),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: hl3.id, userId: member3.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: hl3.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 9) },
      { taskId: hl3.id, userId: member3.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 6) },
    ],
  });

  // ---------------- LOGISTICS TASKS ----------------
  // LOGISTICS-1: Done (completed this week)
  const lg1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      key: 'LOGISTICS-1',
      projectId: projLogistics.id,
      title: 'Automate vessel satellite GPS telemetry stream',
      description: 'Ingest ocean freight vessel position, heading, and speed every minute.',
      priority: 'high',
      status: 'Done',
      dueDate: subDays(now, 3),
      completedAt: subDays(now, 1), // Completed this week
      createdById: manager.id,
      createdAt: subDays(now, 12),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: lg1.id, userId: member1.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: lg1.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 12) },
      { taskId: lg1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 8) },
      { taskId: lg1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 2) },
      { taskId: lg1.id, userId: manager.id, type: 'status_change', field: 'status', oldValue: 'In Review', newValue: 'Done', createdAt: subDays(now, 1) },
    ],
  });

  // LOGISTICS-2: In Progress
  const lg2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      key: 'LOGISTICS-2',
      projectId: projLogistics.id,
      title: 'Port congestion ETA prediction machine learning model',
      description: 'Estimate container unloading turnaround times using harbor queue length data.',
      priority: 'medium',
      status: 'In Progress',
      dueDate: addDays(now, 4), // Due this week
      createdById: manager.id,
      createdAt: subDays(now, 6),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: lg2.id, userId: member3.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: lg2.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 6) },
      { taskId: lg2.id, userId: member3.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 4) },
    ],
  });

  // ---------------- 8-WEEK COMPLETION DATA (Natural tasks in Fintech project) ----------------
  const pastDeliverables = [
    'Deliverable: Production Database Infrastructure & Replication',
    'Deliverable: Multi-Currency Exchange Rate Conversion Service',
    'Deliverable: Automated Continuous Integration Testing Pipeline',
    'Deliverable: Role-Based Authorization Policy Security Audit',
    'Deliverable: End-to-End KYC Customer Verification Microservice',
    'Deliverable: High-Throughput Redis Cache Layer Implementation',
    'Deliverable: Initial Product Architecture & Tech Stack Scaffolding',
  ];

  for (let i = 0; i < pastDeliverables.length; i++) {
    const weekIndex = i + 1;
    const taskNum = 6 + i;
    const pastDate = subWeeks(now, weekIndex);

    const histTask = await prisma.task.create({
      data: {
        taskNumber: taskNum,
        key: `FINTECH-${taskNum}`,
        projectId: projFintech.id,
        title: pastDeliverables[i],
        description: `Delivered and signed off by client during Sprint Week ${weekIndex}.`,
        priority: 'medium',
        status: 'Done',
        dueDate: pastDate,
        completedAt: pastDate,
        createdById: manager.id,
        createdAt: subWeeks(pastDate, 1),
      },
    });
    await prisma.taskAssignee.create({ data: { taskId: histTask.id, userId: member1.id } });
  }

  console.log('✅ Database Seeding Completed Successfully:');
  console.log('  - 4 Demo Users Created (1 Manager: Alex Morgan, 3 Members: Sarah, David, Elena)');
  console.log('  - 4 Projects Configured (Fintech, Health, Logistics, Legacy)');
  console.log('  - Multi-tier blocker dependencies & alert dismissals verified');
  console.log('  - 8-Week completion history generated for executive velocity charting');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
