import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateStatusTransition } from '@/lib/state-machine';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskIds, action, status, assigneeId, dueDate } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds array is required.' }, { status: 400 });
    }

    if (!action || !['status', 'assignee', 'dueDate'].includes(action)) {
      return NextResponse.json({ error: 'Valid action (status, assignee, dueDate) is required.' }, { status: 400 });
    }

    // Fetch accessible tasks
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        project: {
          include: { members: true },
        },
        assignees: true,
        blockedBy: {
          include: {
            blockedBy: { select: { id: true, key: true, title: true, status: true } },
          },
        },
      },
    });

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const results: Array<{
      taskId: string;
      key: string;
      title: string;
      success: boolean;
      reason?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    for (const taskId of taskIds) {
      const task = taskMap.get(taskId);

      if (!task) {
        failureCount++;
        results.push({
          taskId,
          key: 'UNKNOWN',
          title: 'Unknown Task',
          success: false,
          reason: 'Task not found or has been deleted.',
        });
        continue;
      }

      // Check user permissions
      if (user.role !== 'manager') {
        const isMember =
          task.project.members.some((m) => m.userId === user.id) || task.project.ownerId === user.id;
        if (!isMember) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: `You are not a member of project '${task.project.name}'.`,
          });
          continue;
        }
      }

      // Action 1: Status Change
      if (action === 'status') {
        if (!status) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: 'Target status not specified.',
          });
          continue;
        }

        const unfinishedBlockers = task.blockedBy
          .map((b) => b.blockedBy)
          .filter((b) => b.status !== 'Done');

        const validation = validateStatusTransition(
          task.status,
          status,
          task.previousStatus,
          unfinishedBlockers
        );

        if (!validation.valid) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: validation.reason || 'Illegal status transition.',
          });
          continue;
        }

        // Apply status update
        try {
          await prisma.$transaction(async (tx) => {
            await tx.task.update({
              where: { id: taskId },
              data: {
                status,
                previousStatus: validation.newPreviousStatus,
                completedAt: status === 'Done' ? new Date() : task.status === 'Done' ? null : undefined,
                updatedAt: new Date(),
              },
            });

            await tx.taskActivity.create({
              data: {
                taskId,
                userId: user.id,
                type: 'status_change',
                field: 'status',
                oldValue: task.status,
                newValue: status,
                comment: 'Bulk status update',
              },
            });
          });

          successCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: true,
          });
        } catch (err: any) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: err.message || 'Database error during update.',
          });
        }
      }

      // Action 2: Assignee Change (Add assignee)
      else if (action === 'assignee') {
        if (!assigneeId) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: 'Target assignee not specified.',
          });
          continue;
        }

        const validMemberIds = new Set(task.project.members.map((m) => m.userId));
        validMemberIds.add(task.project.ownerId);

        if (!validMemberIds.has(assigneeId)) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: `Assignee is not a member of project '${task.project.name}'.`,
          });
          continue;
        }

        const isAlreadyAssigned = task.assignees.some((a) => a.userId === assigneeId);
        if (isAlreadyAssigned) {
          successCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: true,
          });
          continue;
        }

        try {
          const assigneeUser = await prisma.user.findUnique({ where: { id: assigneeId } });

          await prisma.$transaction(async (tx) => {
            await tx.taskAssignee.create({
              data: { taskId, userId: assigneeId },
            });

            await tx.taskActivity.create({
              data: {
                taskId,
                userId: user.id,
                type: 'assignment',
                field: 'assignee',
                newValue: assigneeUser?.name || assigneeId,
                comment: 'Bulk assignment update',
              },
            });

            await tx.task.update({
              where: { id: taskId },
              data: { updatedAt: new Date() },
            });
          });

          successCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: true,
          });
        } catch (err: any) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: err.message || 'Database error during assignment.',
          });
        }
      }

      // Action 3: Due Date Change
      else if (action === 'dueDate') {
        const parsedDate = dueDate ? new Date(dueDate) : null;
        const oldTime = task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'None';
        const newTime = parsedDate ? parsedDate.toISOString().split('T')[0] : 'None';

        try {
          await prisma.$transaction(async (tx) => {
            await tx.task.update({
              where: { id: taskId },
              data: {
                dueDate: parsedDate,
                updatedAt: new Date(),
              },
            });

            // Reset dismissals if date changed
            await tx.taskAlertDismissal.deleteMany({
              where: { taskId },
            });

            await tx.taskActivity.create({
              data: {
                taskId,
                userId: user.id,
                type: 'field_change',
                field: 'dueDate',
                oldValue: oldTime,
                newValue: newTime,
                comment: 'Bulk due date update',
              },
            });
          });

          successCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: true,
          });
        } catch (err: any) {
          failureCount++;
          results.push({
            taskId,
            key: task.key,
            title: task.title,
            success: false,
            reason: err.message || 'Database error during due date update.',
          });
        }
      }
    }

    return NextResponse.json({
      total: taskIds.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error: any) {
    console.error('Error in bulk task operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
