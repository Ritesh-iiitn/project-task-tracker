import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Managers can see all projects; Members only see projects where they are assigned as members or owner
    let whereClause: any = {};

    if (!includeArchived) {
      whereClause.isArchived = false;
    }

    if (user.role !== 'manager') {
      whereClause.OR = [
        { members: { some: { userId: user.id } } },
        { ownerId: user.id },
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add quick task stats per project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const [openCount, doneCount, overdueCount] = await Promise.all([
          prisma.task.count({
            where: {
              projectId: project.id,
              status: { not: 'Done' },
            },
          }),
          prisma.task.count({
            where: {
              projectId: project.id,
              status: 'Done',
            },
          }),
          prisma.task.count({
            where: {
              projectId: project.id,
              status: { not: 'Done' },
              dueDate: { lt: new Date() },
            },
          }),
        ]);

        return {
          ...project,
          stats: {
            totalTasks: project._count.tasks,
            openTasks: openCount,
            doneTasks: doneCount,
            overdueTasks: overdueCount,
          },
        };
      })
    );

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only managers can create projects (Goal 1 & 2)
    if (user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can create projects.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, name, description, ownerId, memberIds } = body;

    if (!key || !name) {
      return NextResponse.json({ error: 'Project key and name are required.' }, { status: 400 });
    }

    const cleanKey = key.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(cleanKey)) {
      return NextResponse.json(
        { error: 'Project key must be 2-10 alphanumeric characters (e.g. ACME, PRJ).' },
        { status: 400 }
      );
    }

    // Check unique key
    const existing = await prisma.project.findUnique({
      where: { key: cleanKey },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Project key '${cleanKey}' is already in use.` },
        { status: 400 }
      );
    }

    const effectiveOwnerId = ownerId || user.id;

    // Create project and initial memberships
    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          key: cleanKey,
          name: name.trim(),
          description: description?.trim() || null,
          ownerId: effectiveOwnerId,
        },
      });

      // Automatically add owner as a member
      const memberIdSet = new Set<string>([effectiveOwnerId]);
      if (Array.isArray(memberIds)) {
        memberIds.forEach((id: string) => memberIdSet.add(id));
      }

      await tx.projectMember.createMany({
        data: Array.from(memberIdSet).map((uId) => ({
          projectId: newProj.id,
          userId: uId,
        })),
      });

      return newProj;
    });

    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({ project: fullProject }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
