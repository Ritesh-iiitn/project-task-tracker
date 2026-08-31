import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateStatusTransition, getLegalTransitions } from '@/lib/state-machine';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true } },
              },
            },
          },
        },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        blockedBy: {
          include: {
            blockedBy: {
              select: { id: true, key: true, title: true, status: true, priority: true },
            },
          },
        },
        blocks: {
          include: {
            task: {
              select: { id: true, key: true, title: true, status: true, priority: true },
            },
          },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // RBAC: Verify user has access to task's project
    if (user.role !== 'manager') {
      const isMember =
        task.project.members.some((m) => m.userId === user.id) || task.project.ownerId === user.id;
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden: Access denied to this project task.' }, { status: 403 });
      }
    }

    const legalTransitions = getLegalTransitions(task.status, task.previousStatus);

    return NextResponse.json({
      task,
      legalTransitions,
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, description, priority, status, dueDate, assigneeIds, blockedByIds } = body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
        assignees: { include: { user: true } },
        blockedBy: { include: { blockedBy: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Access check: User must be member or manager
    if (user.role !== 'manager') {
      const isMember =
        task.project.members.some((m) => m.userId === user.id) || task.project.ownerId === user.id;
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden: Access denied.' }, { status: 403 });
      }
    }

    // Execute atomic update with all validations and immutable activity logs
    const updatedTask = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      const activitiesToCreate: any[] = [];

      // 1. Status Transition Validation (Goal 4)
      if (status && status !== task.status) {
        // Fetch unfinished blockers in same project
        const blockers = await tx.taskDependency.findMany({
          where: { taskId: id },
          include: {
            blockedBy: { select: { id: true, key: true, title: true, status: true } },
          },
        });

        const unfinishedBlockers = blockers
          .map((b) => b.blockedBy)
          .filter((b) => b.status !== 'Done');

        const validation = validateStatusTransition(
          task.status,
          status,
          task.previousStatus,
          unfinishedBlockers
        );

        if (!validation.valid) {
          throw new Error(`STATUS_INVALID: ${validation.reason}`);
        }

        dataToUpdate.status = status;
        dataToUpdate.previousStatus = validation.newPreviousStatus;
        if (status === 'Done') {
          dataToUpdate.completedAt = new Date();
        } else if (task.status === 'Done') {
          dataToUpdate.completedAt = null;
        }

        activitiesToCreate.push({
          taskId: id,
          userId: user.id,
          type: 'status_change',
          field: 'status',
          oldValue: task.status,
          newValue: status,
        });
      }

      // 2. Title Change
      if (title !== undefined && title.trim() !== task.title) {
        dataToUpdate.title = title.trim();
        activitiesToCreate.push({
          taskId: id,
          userId: user.id,
          type: 'field_change',
          field: 'title',
          oldValue: task.title,
          newValue: title.trim(),
        });
      }

      // 3. Description Change
      if (description !== undefined && (description?.trim() || null) !== task.description) {
        dataToUpdate.description = description?.trim() || null;
        activitiesToCreate.push({
          taskId: id,
          userId: user.id,
          type: 'field_change',
          field: 'description',
          oldValue: task.description ? task.description.slice(0, 50) : '(empty)',
          newValue: description?.trim() ? description.trim().slice(0, 50) : '(empty)',
        });
      }

      // 4. Priority Change
      if (priority && priority !== task.priority) {
        if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
          throw new Error('PRIORITY_INVALID: Invalid priority value.');
        }
        dataToUpdate.priority = priority;
        activitiesToCreate.push({
          taskId: id,
          userId: user.id,
          type: 'field_change',
          field: 'priority',
          oldValue: task.priority,
          newValue: priority,
        });
      }

      // 5. Due Date Change (Goal 10: Reset alert dismissals when due date changes)
      if (dueDate !== undefined) {
        const newDate = dueDate ? new Date(dueDate) : null;
        const oldTime = task.dueDate ? task.dueDate.toISOString() : null;
        const newTime = newDate ? newDate.toISOString() : null;

        if (oldTime !== newTime) {
          dataToUpdate.dueDate = newDate;

          // Goal 10: "If that task's due date later changes, the alert comes back."
          await tx.taskAlertDismissal.deleteMany({
            where: { taskId: id },
          });

          activitiesToCreate.push({
            taskId: id,
            userId: user.id,
            type: 'field_change',
            field: 'dueDate',
            oldValue: oldTime ? oldTime.split('T')[0] : 'None',
            newValue: newTime ? newTime.split('T')[0] : 'None',
          });
        }
      }

      // 6. Assignees Update (Goal 5: Only project members can be assigned)
      if (Array.isArray(assigneeIds)) {
        const validMemberIds = new Set(task.project.members.map((m) => m.userId));
        validMemberIds.add(task.project.ownerId);

        for (const uid of assigneeIds) {
          if (!validMemberIds.has(uid)) {
            throw new Error(`ASSIGNEE_INVALID: User ${uid} is not a member of project '${task.project.name}'.`);
          }
        }

        const currentAssigneeIds = new Set(task.assignees.map((a) => a.userId));
        const newAssigneeIds = new Set(assigneeIds);

        // Added assignees
        const toAdd = assigneeIds.filter((uid) => !currentAssigneeIds.has(uid));
        // Removed assignees
        const toRemove = Array.from(currentAssigneeIds).filter((uid) => !newAssigneeIds.has(uid));

        if (toAdd.length > 0) {
          await tx.taskAssignee.createMany({
            data: toAdd.map((uid) => ({ taskId: id, userId: uid })),
          });

          const addedUsers = await tx.user.findMany({
            where: { id: { in: toAdd } },
            select: { id: true, name: true },
          });

          for (const u of addedUsers) {
            activitiesToCreate.push({
              taskId: id,
              userId: user.id,
              type: 'assignment',
              field: 'assignee',
              oldValue: null,
              newValue: u.name,
            });
          }
        }

        if (toRemove.length > 0) {
          await tx.taskAssignee.deleteMany({
            where: {
              taskId: id,
              userId: { in: toRemove },
            },
          });

          const removedUsers = await tx.user.findMany({
            where: { id: { in: toRemove } },
            select: { id: true, name: true },
          });

          for (const u of removedUsers) {
            activitiesToCreate.push({
              taskId: id,
              userId: user.id,
              type: 'unassignment',
              field: 'assignee',
              oldValue: u.name,
              newValue: null,
            });
          }
        }
      }

      // 7. Blockers Update (Goal 3: tasks in same project)
      if (Array.isArray(blockedByIds)) {
        // Prevent self blocking
        if (blockedByIds.includes(id)) {
          throw new Error('BLOCKER_INVALID: A task cannot block itself.');
        }

        if (blockedByIds.length > 0) {
          const blockerTasks = await tx.task.findMany({
            where: { id: { in: blockedByIds } },
            select: { id: true, projectId: true, key: true },
          });

          for (const b of blockerTasks) {
            if (b.projectId !== task.projectId) {
              throw new Error(`BLOCKER_INVALID: Blocker task ${b.key} belongs to a different project.`);
            }
          }
        }

        const currentBlockerIds = new Set(task.blockedBy.map((b) => b.blockedById));
        const newBlockerIds = new Set(blockedByIds);

        const blockersToAdd = blockedByIds.filter((bid) => !currentBlockerIds.has(bid));
        const blockersToRemove = Array.from(currentBlockerIds).filter((bid) => !newBlockerIds.has(bid));

        if (blockersToAdd.length > 0) {
          await tx.taskDependency.createMany({
            data: blockersToAdd.map((bid) => ({ taskId: id, blockedById: bid })),
          });

          const addedTasks = await tx.task.findMany({
            where: { id: { in: blockersToAdd } },
            select: { id: true, key: true },
          });

          for (const bt of addedTasks) {
            activitiesToCreate.push({
              taskId: id,
              userId: user.id,
              type: 'dependency_add',
              field: 'blocker',
              newValue: bt.key,
            });
          }
        }

        if (blockersToRemove.length > 0) {
          await tx.taskDependency.deleteMany({
            where: {
              taskId: id,
              blockedById: { in: blockersToRemove },
            },
          });

          const removedTasks = await tx.task.findMany({
            where: { id: { in: blockersToRemove } },
            select: { id: true, key: true },
          });

          for (const bt of removedTasks) {
            activitiesToCreate.push({
              taskId: id,
              userId: user.id,
              type: 'dependency_remove',
              field: 'blocker',
              oldValue: bt.key,
            });
          }
        }
      }

      // Perform task update if any field changed
      if (Object.keys(dataToUpdate).length > 0) {
        dataToUpdate.updatedAt = new Date();
        await tx.task.update({
          where: { id },
          data: dataToUpdate,
        });
      }

      // Insert all immutable activities
      if (activitiesToCreate.length > 0) {
        await tx.taskActivity.createMany({
          data: activitiesToCreate,
        });
      }

      return tx.task.findUnique({
        where: { id },
        include: {
          project: true,
          assignees: { include: { user: true } },
          blockedBy: { include: { blockedBy: true } },
          blocks: { include: { task: true } },
          activities: {
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error('Error updating task:', error.message || error);
    const message = error.message || 'Internal server error';

    if (
      message.startsWith('STATUS_INVALID:') ||
      message.startsWith('ASSIGNEE_INVALID:') ||
      message.startsWith('BLOCKER_INVALID:') ||
      message.startsWith('PRIORITY_INVALID:')
    ) {
      return NextResponse.json(
        { error: message.split(': ')[1] || message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only managers can delete tasks (Goal 1 & 3)
    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can delete tasks.' },
        { status: 403 }
      );
    }

    const { id } = params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
