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
      name: 'Sarah Chen',
      role: 'member',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'david@company.com',
      passwordHash,
      name: 'David Kim',
      role: 'member',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'elena@company.com',
      passwordHash,
      name: 'Elena Rostova',
      role: 'member',
    },
  });

  console.log('📁 Creating client projects...');
  const projApex = await prisma.project.create({
    data: {
      key: 'APEX',
      name: 'Apex Fintech Web Portal',
      description: 'Institutional trading dashboard with real-time risk analytics and multi-currency settlement.',
      ownerId: manager.id,
      isArchived: false,
    },
  });

  const projNova = await prisma.project.create({
    data: {
      key: 'NOVA',
      name: 'Nova Health Telemed App',
      description: 'HIPAA-compliant video consultation, electronic health record integration, and prescription management.',
      ownerId: manager.id,
      isArchived: false,
    },
  });

  const projOrbit = await prisma.project.create({
    data: {
      key: 'ORBIT',
      name: 'Orbit Global Logistics Engine',
      description: 'Container shipment GPS tracking, customs clearance automation, and carrier dispatch system.',
      ownerId: manager.id,
      isArchived: false,
    },
  });

  const projLegacy = await prisma.project.create({
    data: {
      key: 'LEGACY',
      name: 'Legacy CRM Data Migration',
      description: 'Archived project: Migration of historical customer data from on-premise Oracle to Postgres cloud.',
      ownerId: manager.id,
      isArchived: true,
    },
  });

  console.log('🤝 Assigning project memberships...');
  // Apex: manager, sarah, david
  await prisma.projectMember.createMany({
    data: [
      { projectId: projApex.id, userId: manager.id },
      { projectId: projApex.id, userId: member1.id },
      { projectId: projApex.id, userId: member2.id },
    ],
  });

  // Nova: manager, david, elena
  await prisma.projectMember.createMany({
    data: [
      { projectId: projNova.id, userId: manager.id },
      { projectId: projNova.id, userId: member2.id },
      { projectId: projNova.id, userId: member3.id },
    ],
  });

  // Orbit: manager, sarah, elena
  await prisma.projectMember.createMany({
    data: [
      { projectId: projOrbit.id, userId: manager.id },
      { projectId: projOrbit.id, userId: member1.id },
      { projectId: projOrbit.id, userId: member3.id },
    ],
  });

  // Legacy: manager, sarah
  await prisma.projectMember.createMany({
    data: [
      { projectId: projLegacy.id, userId: manager.id },
      { projectId: projLegacy.id, userId: member1.id },
    ],
  });

  console.log('📋 Creating tasks with lifecycles, dependencies, and audit histories...');
  const now = new Date();

  // ---------------- APEX TASKS ----------------
  // APEX-1: Done
  const apex1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      key: 'APEX-1',
      projectId: projApex.id,
      title: 'Architect JWT OAuth2 authentication flow',
      description: 'Design stateless session management, refresh token rotation, and RBAC permission scopes.',
      priority: 'high',
      status: 'Done',
      dueDate: subDays(now, 10),
      completedAt: subDays(now, 4),
      createdById: manager.id,
      createdAt: subDays(now, 14),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: apex1.id, userId: member1.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: apex1.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 14) },
      { taskId: apex1.id, userId: manager.id, type: 'assignment', field: 'assignee', newValue: member1.name, createdAt: subDays(now, 13) },
      { taskId: apex1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 10) },
      { taskId: apex1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 5) },
      { taskId: apex1.id, userId: manager.id, type: 'comment', comment: 'Security review passed with zero findings.', createdAt: subDays(now, 4) },
      { taskId: apex1.id, userId: manager.id, type: 'status_change', field: 'status', oldValue: 'In Review', newValue: 'Done', createdAt: subDays(now, 4) },
    ],
  });

  // APEX-2: In Review (Blocker for APEX-3)
  const apex2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      key: 'APEX-2',
      projectId: projApex.id,
      title: 'Implement trade execution WebSocket pipeline',
      description: 'Stream order book depth and live trade ticks over TLS WebSocket with automatic reconnects.',
      priority: 'urgent',
      status: 'In Review',
      dueDate: subDays(now, 2), // OVERDUE!
      createdById: manager.id,
      createdAt: subDays(now, 8),
    },
  });
  await prisma.taskAssignee.createMany({
    data: [
      { taskId: apex2.id, userId: member1.id },
      { taskId: apex2.id, userId: member2.id },
    ],
  });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: apex2.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 8) },
      { taskId: apex2.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 6) },
      { taskId: apex2.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 1) },
      { taskId: apex2.id, userId: member2.id, type: 'comment', comment: 'Load testing achieved 10k msgs/sec. Ready for manager sign-off.', createdAt: subDays(now, 1) },
    ],
  });

  // APEX-3: In Progress, Blocked by APEX-2
  const apex3 = await prisma.task.create({
    data: {
      taskNumber: 3,
      key: 'APEX-3',
      projectId: projApex.id,
      title: 'Build real-time portfolio risk heatmap UI',
      description: 'Visual grid displaying value-at-risk (VaR) and exposure by currency pair.',
      priority: 'high',
      status: 'In Progress',
      dueDate: addDays(now, 3), // Due this week
      createdById: member1.id,
      createdAt: subDays(now, 5),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: apex3.id, userId: member2.id } });
  await prisma.taskDependency.create({ data: { taskId: apex3.id, blockedById: apex2.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: apex3.id, userId: member1.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 5) },
      { taskId: apex3.id, userId: member1.id, type: 'dependency_add', field: 'blocker', newValue: 'APEX-2', createdAt: subDays(now, 5) },
      { taskId: apex3.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 3) },
    ],
  });

  // APEX-4: Blocked status (Blocked from In Progress)
  const apex4 = await prisma.task.create({
    data: {
      taskNumber: 4,
      key: 'APEX-4',
      projectId: projApex.id,
      title: 'Integrate SWIFT ISO-20022 wire payout gateway',
      description: 'Process batch cross-border payout XML files according to banking partner specification.',
      priority: 'urgent',
      status: 'Blocked',
      previousStatus: 'In Progress',
      dueDate: subDays(now, 4), // OVERDUE!
      createdById: manager.id,
      createdAt: subDays(now, 10),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: apex4.id, userId: member1.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: apex4.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 10) },
      { taskId: apex4.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 7) },
      { taskId: apex4.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'Blocked', comment: 'Waiting on sandbox credentials from partner bank API team.', createdAt: subDays(now, 4) },
      { taskId: apex4.id, userId: member1.id, type: 'comment', comment: 'Sent follow up email to bank compliance officer.', createdAt: subDays(now, 2) },
    ],
  });

  // APEX-5: Backlog
  const apex5 = await prisma.task.create({
    data: {
      taskNumber: 5,
      key: 'APEX-5',
      projectId: projApex.id,
      title: 'Automate tax withholding calculation reports',
      description: 'Generate annual Form 1099-B and local transaction tax summaries for end clients.',
      priority: 'low',
      status: 'Backlog',
      dueDate: addDays(now, 14),
      createdById: manager.id,
      createdAt: subDays(now, 3),
    },
  });
  await prisma.taskActivity.create({
    data: { taskId: apex5.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 3) },
  });

  // ---------------- NOVA TASKS ----------------
  // NOVA-1: Done
  const nova1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      key: 'NOVA-1',
      projectId: projNova.id,
      title: 'Setup WebRTC peer-to-peer encrypted video rooms',
      description: 'Peer connection orchestration with STUN/TURN failover servers.',
      priority: 'urgent',
      status: 'Done',
      dueDate: subDays(now, 12),
      completedAt: subDays(now, 6),
      createdById: manager.id,
      createdAt: subDays(now, 18),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: nova1.id, userId: member2.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: nova1.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 18) },
      { taskId: nova1.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 14) },
      { taskId: nova1.id, userId: member2.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 8) },
      { taskId: nova1.id, userId: manager.id, type: 'status_change', field: 'status', oldValue: 'In Review', newValue: 'Done', createdAt: subDays(now, 6) },
    ],
  });

  // NOVA-2: In Progress
  const nova2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      key: 'NOVA-2',
      projectId: projNova.id,
      title: 'FHIR EHR medical records sync adapter',
      description: 'Bi-directional sync of patient allergies, active prescriptions, and diagnosis codes.',
      priority: 'high',
      status: 'In Progress',
      dueDate: addDays(now, 2), // Due this week
      createdById: manager.id,
      createdAt: subDays(now, 7),
    },
  });
  await prisma.taskAssignee.createMany({
    data: [
      { taskId: nova2.id, userId: member2.id },
      { taskId: nova2.id, userId: member3.id },
    ],
  });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: nova2.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 7) },
      { taskId: nova2.id, userId: member3.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 4) },
    ],
  });

  // NOVA-3: Overdue In Progress
  const nova3 = await prisma.task.create({
    data: {
      taskNumber: 3,
      key: 'NOVA-3',
      projectId: projNova.id,
      title: 'E-Prescription digital signature & pharmacy routing',
      description: 'Cryptographic signature using doctor PKI smart cards and automated routing to local pharmacies.',
      priority: 'urgent',
      status: 'In Progress',
      dueDate: subDays(now, 3), // OVERDUE!
      createdById: manager.id,
      createdAt: subDays(now, 9),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: nova3.id, userId: member3.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: nova3.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 9) },
      { taskId: nova3.id, userId: member3.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 6) },
    ],
  });

  // ---------------- ORBIT TASKS ----------------
  // ORBIT-1: Done (completed this week)
  const orbit1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      key: 'ORBIT-1',
      projectId: projOrbit.id,
      title: 'Automate AIS marine satellite telemetry ingestion',
      description: 'Ingest vessel position, speed over ground, and heading stream every 60 seconds.',
      priority: 'high',
      status: 'Done',
      dueDate: subDays(now, 3),
      completedAt: subDays(now, 1), // Completed this week!
      createdById: manager.id,
      createdAt: subDays(now, 12),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: orbit1.id, userId: member1.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: orbit1.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 12) },
      { taskId: orbit1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 8) },
      { taskId: orbit1.id, userId: member1.id, type: 'status_change', field: 'status', oldValue: 'In Progress', newValue: 'In Review', createdAt: subDays(now, 2) },
      { taskId: orbit1.id, userId: manager.id, type: 'status_change', field: 'status', oldValue: 'In Review', newValue: 'Done', createdAt: subDays(now, 1) },
    ],
  });

  // ORBIT-2: In Progress
  const orbit2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      key: 'ORBIT-2',
      projectId: projOrbit.id,
      title: 'Port congestion ETA prediction ML model',
      description: 'Random Forest regressor estimating berth turnaround delay based on queue length and weather.',
      priority: 'medium',
      status: 'In Progress',
      dueDate: addDays(now, 4), // Due this week
      createdById: manager.id,
      createdAt: subDays(now, 6),
    },
  });
  await prisma.taskAssignee.create({ data: { taskId: orbit2.id, userId: member3.id } });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: orbit2.id, userId: manager.id, type: 'created', newValue: 'Backlog', createdAt: subDays(now, 6) },
      { taskId: orbit2.id, userId: member3.id, type: 'status_change', field: 'status', oldValue: 'Backlog', newValue: 'In Progress', createdAt: subDays(now, 4) },
    ],
  });

  // Historical completed tasks over the last 8 weeks for trend chart
  for (let w = 1; w <= 7; w++) {
    const pastDate = subWeeks(now, w);
    const pastTask = await prisma.task.create({
      data: {
        taskNumber: 10 + w,
        key: `HIST-${w}`,
        projectId: projApex.id,
        title: `Historical sprint sprint milestone delivery #${w}`,
        description: `Delivered milestone deliverables for iteration week ${w}.`,
        priority: 'medium',
        status: 'Done',
        dueDate: pastDate,
        completedAt: pastDate,
        createdById: manager.id,
        createdAt: subWeeks(pastDate, 1),
      },
    });
    await prisma.taskAssignee.create({ data: { taskId: pastTask.id, userId: member1.id } });
  }

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Manager Login : manager@company.com / password123');
  console.log('Member 1 Login: sarah@company.com   / password123 (Apex, Orbit)');
  console.log('Member 2 Login: david@company.com   / password123 (Apex, Nova)');
  console.log('Member 3 Login: elena@company.com   / password123 (Nova, Orbit)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
