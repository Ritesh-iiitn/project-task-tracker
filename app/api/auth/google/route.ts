import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getRedirectUri(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  return `${origin}/api/auth/google/callback`;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(req);

  // If Google OAuth credentials are not configured
  if (!clientId || clientId.includes('your-google-client-id')) {
    return NextResponse.redirect(`${req.nextUrl.origin}/?google_oauth_info=config_required`);
  }

  const role = req.nextUrl.searchParams.get('role') || 'member';
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ].join(' '),
    state,
  };

  const qs = new URLSearchParams(options);
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
