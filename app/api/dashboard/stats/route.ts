import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Determine accessible projects
    let accessibleProjectIds: string[] = [];
    if (user.role === 'manager') {
      const projects = await prisma.project.findMany({
        where: { isArchived: false },
        select: { id: true },
      });
      accessibleProjectIds = projects.map((p) => p.id);
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: user.id, project: { isArchived: false } },
        select: { projectId: true },
      });
      accessibleProjectIds = memberships.map((m) => m.projectId);
    }

    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({
        metrics: {
          openTasks: 0,
          overdueTasks: 0,
          dueThisWeek: 0,
          completedThisWeek: 0,
          totalProjects: 0,
        },
        statusBreakdown: [],
        assigneeBreakdown: [],
        completionTrends: [],
      });
    }

    const projectScope = { projectId: { in: accessibleProjectIds } };

    // 1. Headline metrics (Goal 8)
    const [openCount, overdueCount, dueThisWeekCount, completedThisWeekCount, totalProjectsCount] =
      await Promise.all([
        prisma.task.count({
          where: { ...projectScope, status: { not: 'Done' } },
        }),
        prisma.task.count({
          where: {
            ...projectScope,
            status: { not: 'Done' },
            dueDate: { lt: now },
          },
        }),
        prisma.task.count({
          where: {
            ...projectScope,
            status: { not: 'Done' },
            dueDate: { gte: thisWeekStart, lte: thisWeekEnd },
          },
        }),
        prisma.task.count({
          where: {
            ...projectScope,
            status: 'Done',
            OR: [
              { completedAt: { gte: thisWeekStart, lte: thisWeekEnd } },
              { updatedAt: { gte: thisWeekStart, lte: thisWeekEnd } },
            ],
          },
        }),
        prisma.project.count({
          where: { id: { in: accessibleProjectIds }, isArchived: false },
        }),
      ]);

    // 2. Status Breakdown
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: projectScope,
      _count: { id: true },
    });

    const statusOrder = ['Backlog', 'In Progress', 'In Review', 'Blocked', 'Done'];
    const statusBreakdown = statusOrder.map((st) => {
      const found = statusCounts.find((s) => s.status === st);
      return {
        status: st,
        count: found ? found._count.id : 0,
      };
    });

    // 3. Assignee Workload Breakdown ("who is overloaded")
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        taskAssignments: {
          where: {
            task: projectScope,
          },
          include: {
            task: {
              select: {
                id: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const assigneeBreakdown = allUsers
      .map((u) => {
        const assignedTasks = u.taskAssignments.map((ta) => ta.task);
        const open = assignedTasks.filter((t) => t.status !== 'Done').length;
        const overdue = assignedTasks.filter(
          (t) => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now
        ).length;
        const inProgress = assignedTasks.filter((t) => t.status === 'In Progress').length;
        const done = assignedTasks.filter((t) => t.status === 'Done').length;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          totalAssigned: assignedTasks.length,
          openTasks: open,
          overdueTasks: overdue,
          inProgressTasks: inProgress,
          completedTasks: done,
          isOverloaded: open >= 4 || overdue >= 2, // Highlight overloaded staff
        };
      })
      .filter((u) => u.totalAssigned > 0 || user.role === 'manager')
      .sort((a, b) => b.openTasks - a.openTasks);

    // 4. Completions over the last 8 weeks (Goal 8)
    const eightWeeksAgo = subWeeks(thisWeekStart, 7);
    const completedTasksLast8Weeks = await prisma.task.findMany({
      where: {
        ...projectScope,
        status: 'Done',
        OR: [
          { completedAt: { gte: eightWeeksAgo } },
          { updatedAt: { gte: eightWeeksAgo } },
        ],
      },
      select: {
        completedAt: true,
        updatedAt: true,
      },
    });

    // Bucket into 8 week slots
    const completionTrends: Array<{ weekLabel: string; count: number; weekIndex: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = subWeeks(thisWeekStart, i);
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
      const label = `Wk ${format(wStart, 'MMM d')}`;

      const count = completedTasksLast8Weeks.filter((t) => {
        const date = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
        return date >= wStart && date <= wEnd;
      }).length;

      completionTrends.push({
        weekLabel: label,
        count,
        weekIndex: 8 - i,
      });
    }

    return NextResponse.json({
      metrics: {
        openTasks: openCount,
        overdueTasks: overdueCount,
        dueThisWeek: dueThisWeekCount,
        completedThisWeek: completedThisWeekCount,
        totalProjects: totalProjectsCount,
      },
      statusBreakdown,
      assigneeBreakdown,
      completionTrends,
    });
  } catch (error: any) {
    console.error('Error calculating dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
