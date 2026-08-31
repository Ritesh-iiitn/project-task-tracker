import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can archive or restore projects.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { isArchived } = body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const newArchivedState = isArchived !== undefined ? Boolean(isArchived) : !project.isArchived;

    const updated = await prisma.project.update({
      where: { id },
      data: { isArchived: newArchivedState },
    });

    return NextResponse.json({
      project: updated,
      message: newArchivedState ? 'Project archived successfully' : 'Project restored successfully',
    });
  } catch (error: any) {
    console.error('Error toggling project archive status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
