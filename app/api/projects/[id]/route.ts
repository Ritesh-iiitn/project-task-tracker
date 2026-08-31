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
        owner: { select: { id: true, name: true, email: true } },
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

    // RBAC: Members can only view projects they belong to
    if (user.role !== 'manager') {
      const isMember = project.members.some((m) => m.userId === user.id) || project.ownerId === user.id;
      if (!isMember) {
        return NextResponse.json(
          { error: 'Forbidden: You are not a member of this project.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only managers can edit projects
    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can edit projects.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, description, ownerId, key } = body;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (ownerId !== undefined) updateData.ownerId = ownerId;

    if (key !== undefined) {
      const cleanKey = key.trim().toUpperCase();
      if (!/^[A-Z0-9]{2,10}$/.test(cleanKey)) {
        return NextResponse.json(
          { error: 'Project key must be 2-10 alphanumeric characters.' },
          { status: 400 }
        );
      }
      if (cleanKey !== existingProject.key) {
        const keyExists = await prisma.project.findUnique({ where: { key: cleanKey } });
        if (keyExists) {
          return NextResponse.json({ error: `Project key '${cleanKey}' is already taken.` }, { status: 400 });
        }
        updateData.key = cleanKey;
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only managers can delete projects
    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can delete projects.' },
        { status: 403 }
      );
    }

    const { id } = params;
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
