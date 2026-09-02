import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ user: null, message: 'Not authenticated' }, { status: 200 });
    }

    // Get user's accessible project IDs
    let projectIds: string[] = [];
    if (user.role === 'manager') {
      const allProjects = await prisma.project.findMany({ select: { id: true } });
      projectIds = allProjects.map((p) => p.id);
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      projectIds = memberships.map((m) => m.projectId);
    }

    return NextResponse.json({
      user,
      accessibleProjectIds: projectIds,
    });
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error', user: null }, { status: 500 });
  }
}
