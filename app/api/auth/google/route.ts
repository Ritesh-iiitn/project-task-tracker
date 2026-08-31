import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/auth/google/callback`;

  // If Google OAuth credentials are not configured, return an informational response or redirect to sign-in with query
  if (!clientId || clientId.includes('your-google-client-id')) {
    // Redirect back to app with an info param so frontend can open the Google profile dialog
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
