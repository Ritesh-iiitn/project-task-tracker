import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = params;
    const body = await req.json();
    const { comment } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // RBAC: Must have project access
    if (user.role !== 'manager') {
      const isMember =
        task.project.members.some((m) => m.userId === user.id) || task.project.ownerId === user.id;
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden: Access denied.' }, { status: 403 });
      }
    }

    // Add comment as an immutable timeline activity (Goal 9)
    const activity = await prisma.taskActivity.create({
      data: {
        taskId,
        userId: user.id,
        type: 'comment',
        comment: comment.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Touch task updated timestamp
    await prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
