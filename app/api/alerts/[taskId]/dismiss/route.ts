import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Goal 10 Rule: A person can dismiss an alert for a task they are ASSIGNED to
    const isAssigned = task.assignees.some((a) => a.userId === user.id);
    if (!isAssigned && user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: You can only dismiss overdue alerts for tasks assigned to you.' },
        { status: 403 }
      );
    }

    // Upsert dismissal record with current dueDate
    await prisma.taskAlertDismissal.upsert({
      where: {
        taskId_userId: { taskId, userId: user.id },
      },
      create: {
        taskId,
        userId: user.id,
        dueDateAtDismissal: task.dueDate,
      },
      update: {
        dueDateAtDismissal: task.dueDate,
        dismissedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Alert dismissed. It will remain dismissed unless the task due date is changed.',
    });
  } catch (error: any) {
    console.error('Error dismissing alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    await prisma.taskAlertDismissal.deleteMany({
      where: { taskId, userId: user.id },
    });

    return NextResponse.json({ message: 'Alert dismissal restored.' });
  } catch (error: any) {
    console.error('Error un-dismissing alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
