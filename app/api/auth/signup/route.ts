import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/client';
import { hashPassword, signToken } from '@/backend/auth/auth.service';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const validRole = role === 'manager' ? 'manager' : 'member';
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: validRole,
      },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'manager' | 'member',
    };

    const token = await signToken(authUser);

    const response = NextResponse.json({
      user: authUser,
      token,
      message: 'Account created successfully',
    }, { status: 201 });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
