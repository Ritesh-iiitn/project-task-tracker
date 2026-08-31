import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');
    const overdueOnly = searchParams.get('overdue') === 'true';
    const myTasksOnly = searchParams.get('myTasks') === 'true';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // 1. Compute accessible projects for the viewer
    let accessibleProjectIds: string[] = [];
    if (user.role === 'manager') {
      const projects = await prisma.project.findMany({
        where: includeArchived ? {} : { isArchived: false },
        select: { id: true },
      });
      accessibleProjectIds = projects.map((p) => p.id);
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: {
          userId: user.id,
          project: includeArchived ? {} : { isArchived: false },
        },
        select: { projectId: true },
      });
      accessibleProjectIds = memberships.map((m) => m.projectId);
    }

    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({
        tasks: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    // 2. Build Prisma where clause (Goal 6: Server-side search & filtering)
    const where: Prisma.TaskWhereInput = {
      projectId: projectId
        ? (accessibleProjectIds.includes(projectId) ? projectId : 'forbidden-id')
        : { in: accessibleProjectIds },
    };

    // Text search over title and description
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { key: { contains: search } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Assignee filter
    if (myTasksOnly || assigneeId) {
      const targetUserId = myTasksOnly ? user.id : assigneeId;
      if (targetUserId && targetUserId !== 'all') {
        where.assignees = {
          some: { userId: targetUserId },
        };
      }
    }

    // Overdue filter: past due date and not finished ('Done')
    if (overdueOnly) {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'Done' };
    }

    // 3. Sorting configuration
    let orderBy: Prisma.TaskOrderByWithRelationInput = {};
    if (sortBy === 'dueDate') {
      orderBy = { dueDate: sortOrder };
    } else if (sortBy === 'priority') {
      orderBy = { priority: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else {
      orderBy = { updatedAt: sortOrder };
    }

    // 4. Query total count and paginated items on server
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, key: true, name: true, isArchived: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          blockedBy: {
            include: {
              blockedBy: {
                select: { id: true, key: true, title: true, status: true },
              },
            },
          },
          blocks: {
            include: {
              task: {
                select: { id: true, key: true, title: true, status: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      tasks,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error querying tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, title, description, priority, dueDate, assigneeIds, blockedByIds } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Project and title are required.' }, { status: 400 });
    }

    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (user.role !== 'manager') {
      const isMember = project.members.some((m) => m.userId === user.id) || project.ownerId === user.id;
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden: You must be a project member to create tasks.' }, { status: 403 });
      }
    }

    // Goal 5: Only members of a task's project may be assigned to it
    const validMemberIds = new Set(project.members.map((m) => m.userId));
    validMemberIds.add(project.ownerId);

    const safeAssigneeIds = Array.isArray(assigneeIds) ? assigneeIds : [];
    for (const uid of safeAssigneeIds) {
      if (!validMemberIds.has(uid)) {
        return NextResponse.json(
          { error: `User ${uid} is not a member of project '${project.name}'. Cannot assign.` },
          { status: 400 }
        );
      }
    }

    // Verify blocker tasks belong to same project (Goal 3)
    const safeBlockerIds = Array.isArray(blockedByIds) ? blockedByIds : [];
    if (safeBlockerIds.length > 0) {
      const blockerTasks = await prisma.task.findMany({
        where: { id: { in: safeBlockerIds } },
        select: { id: true, projectId: true, key: true },
      });

      for (const b of blockerTasks) {
        if (b.projectId !== projectId) {
          return NextResponse.json(
            { error: `Blocker task ${b.key} does not belong to the same project.` },
            { status: 400 }
          );
        }
      }
    }

    const validPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    // Atomic task creation with incremental taskNumber
    const newTask = await prisma.$transaction(async (tx) => {
      // Find highest taskNumber for this project
      const lastTask = await tx.task.findFirst({
        where: { projectId },
        orderBy: { taskNumber: 'desc' },
        select: { taskNumber: true },
      });

      const nextNum = (lastTask?.taskNumber || 0) + 1;
      const key = `${project.key}-${nextNum}`;

      const created = await tx.task.create({
        data: {
          taskNumber: nextNum,
          key,
          projectId,
          title: title.trim(),
          description: description?.trim() || null,
          priority: validPriority,
          status: 'Backlog',
          dueDate: parsedDueDate,
          createdById: user.id,
        },
      });

      // Add assignees
      if (safeAssigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: safeAssigneeIds.map((uId: string) => ({
            taskId: created.id,
            userId: uId,
          })),
        });
      }

      // Add blockers
      if (safeBlockerIds.length > 0) {
        await tx.taskDependency.createMany({
          data: safeBlockerIds.map((bId: string) => ({
            taskId: created.id,
            blockedById: bId,
          })),
        });
      }

      // Log creation activity (Goal 9: Immutable audit history)
      await tx.taskActivity.create({
        data: {
          taskId: created.id,
          userId: user.id,
          type: 'created',
          newValue: 'Backlog',
          comment: `Task created in project '${project.name}'.`,
        },
      });

      return created;
    });

    const fullTask = await prisma.task.findUnique({
      where: { id: newTask.id },
      include: {
        project: true,
        assignees: { include: { user: true } },
        blockedBy: { include: { blockedBy: true } },
        blocks: { include: { task: true } },
        activities: { include: { user: true } },
      },
    });

    return NextResponse.json({ task: fullTask }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
