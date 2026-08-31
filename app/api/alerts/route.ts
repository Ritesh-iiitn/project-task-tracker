import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

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
      return NextResponse.json({ alerts: [], count: 0 });
    }

    // Query overdue tasks: dueDate < now, status != 'Done', in accessible projects
    const overdueTasks = await prisma.task.findMany({
      where: {
        projectId: { in: accessibleProjectIds },
        status: { not: 'Done' },
        dueDate: { lt: now },
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        alertDismissals: {
          where: { userId: user.id },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Filter out alerts dismissed by the current user
    // A dismissal is valid only if it was dismissed for the CURRENT dueDate
    const activeAlerts = overdueTasks.map((t) => {
      const isAssigned = t.assignees.some((a) => a.userId === user.id);
      const userDismissal = t.alertDismissals[0];

      let isDismissed = false;
      if (userDismissal && t.dueDate) {
        // If dismissal recorded and dates match
        if (
          userDismissal.dueDateAtDismissal &&
          new Date(userDismissal.dueDateAtDismissal).getTime() === new Date(t.dueDate).getTime()
        ) {
          isDismissed = true;
        }
      }

      return {
        ...t,
        isAssignedToMe: isAssigned,
        isDismissedByMe: isDismissed,
      };
    });

    // Count of un-dismissed alerts relevant to user (all un-dismissed if manager, or assigned un-dismissed for member)
    const visibleAlerts = activeAlerts.filter((a) => !a.isDismissedByMe);

    return NextResponse.json({
      alerts: activeAlerts,
      visibleCount: visibleAlerts.length,
      allOverdueCount: overdueTasks.length,
    });
  } catch (error: any) {
    console.error('Error fetching overdue alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
