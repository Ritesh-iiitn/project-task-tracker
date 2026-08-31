import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC: members can only see project members if they are part of the project
    if (user.role !== 'manager') {
      const isMember = project.members.some((m) => m.userId === user.id) || project.ownerId === user.id;
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ members: project.members });
  } catch (error: any) {
    console.error('Error fetching project members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only managers can add project members (Goal 1)
    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can modify project membership.' },
        { status: 403 }
      );
    }

    const { id: projectId } = params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (existingMember) {
      return NextResponse.json({ message: 'User is already a member of this project.' });
    }

    const newMember = await prisma.projectMember.create({
      data: { projectId, userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding project member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only managers can remove project members (Goal 1)
    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can modify project membership.' },
        { status: 403 }
      );
    }

    const { id: projectId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required.' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const removedUser = await prisma.user.findUnique({ where: { id: userId } });

    // Execute atomic removal + automatic task unassignment (Goal 5)
    await prisma.$transaction(async (tx) => {
      // 1. Delete project membership
      await tx.projectMember.deleteMany({
        where: { projectId, userId },
      });

      // 2. Find all tasks in this project assigned to this user
      const assignedTasks = await tx.task.findMany({
        where: {
          projectId,
          assignees: { some: { userId } },
        },
        select: { id: true, key: true, title: true },
      });

      if (assignedTasks.length > 0) {
        // 3. Remove assignments
        await tx.taskAssignee.deleteMany({
          where: {
            userId,
            taskId: { in: assignedTasks.map((t) => t.id) },
          },
        });

        // 4. Log immutable activity on each task
        for (const task of assignedTasks) {
          await tx.taskActivity.create({
            data: {
              taskId: task.id,
              userId: user.id,
              type: 'unassignment',
              field: 'assignee',
              oldValue: removedUser ? removedUser.name : userId,
              newValue: null,
              comment: `Automatically unassigned because user was removed from project '${project.name}'.`,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: 'User removed from project and unassigned from all project tasks.',
    });
  } catch (error: any) {
    console.error('Error removing project member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
