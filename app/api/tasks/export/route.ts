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

    // Compute accessible projects
    let accessibleProjectIds: string[] = [];
    if (user.role === 'manager') {
      const projects = await prisma.project.findMany({ select: { id: true } });
      accessibleProjectIds = projects.map((p) => p.id);
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      accessibleProjectIds = memberships.map((m) => m.projectId);
    }

    const where: Prisma.TaskWhereInput = {
      projectId: projectId
        ? (accessibleProjectIds.includes(projectId) ? projectId : 'forbidden-id')
        : { in: accessibleProjectIds },
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { key: { contains: search } },
      ];
    }
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (myTasksOnly || assigneeId) {
      const targetUserId = myTasksOnly ? user.id : assigneeId;
      if (targetUserId && targetUserId !== 'all') {
        where.assignees = { some: { userId: targetUserId } };
      }
    }
    if (overdueOnly) {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'Done' };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { name: true, key: true } },
        assignees: { include: { user: { select: { name: true, email: true } } } },
        blockedBy: { include: { blockedBy: { select: { key: true } } } },
      },
      orderBy: { key: 'asc' },
    });

    // Helper to escape CSV fields
    const escapeCsv = (str: string | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const formatted = String(str).replace(/"/g, '""');
      return `"${formatted}"`;
    };

    const headers = [
      'Key',
      'Project',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Due Date',
      'Assignees',
      'Blocked By',
      'Created At',
      'Updated At',
    ];

    const rows = tasks.map((t) => [
      escapeCsv(t.key),
      escapeCsv(`${t.project.name} (${t.project.key})`),
      escapeCsv(t.title),
      escapeCsv(t.description),
      escapeCsv(t.status),
      escapeCsv(t.priority),
      escapeCsv(t.dueDate ? t.dueDate.toISOString().split('T')[0] : ''),
      escapeCsv(t.assignees.map((a) => a.user.name).join(', ')),
      escapeCsv(t.blockedBy.map((b) => b.blockedBy.key).join(', ')),
      escapeCsv(t.createdAt.toISOString()),
      escapeCsv(t.updatedAt.toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tasks-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting tasks CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
