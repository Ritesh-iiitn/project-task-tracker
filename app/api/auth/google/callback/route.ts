import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/client';
import { hashPassword, signToken } from '@/backend/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const stateParam = req.nextUrl.searchParams.get('state');
    const errorParam = req.nextUrl.searchParams.get('error');

    if (errorParam || !code) {
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=google_auth_cancelled`);
    }

    let role = 'member';
    if (stateParam) {
      try {
        const parsed = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf-8'));
        if (parsed.role === 'manager') {
          role = 'manager';
        }
      } catch (err) {
        // default to member
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${req.nextUrl.origin}/api/auth/google/callback`;

    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=token_exchange_failed`);
    }

    // 2. Fetch Google user profile identity
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=no_email_returned`);
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const cleanName = googleUser.name || googleUser.given_name || cleanEmail.split('@')[0];

    // 3. Find or Create User in DB (Signup Flow)
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          passwordHash,
          role,
        },
      });
    }

    // 4. Create App JWT session
    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'manager' | 'member',
    };

    const token = await signToken(authUser);

    // 5. Redirect to Dashboard with JWT cookie
    const response = NextResponse.redirect(`${req.nextUrl.origin}/`);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${req.nextUrl.origin}/?error=server_oauth_error`);
  }
}
