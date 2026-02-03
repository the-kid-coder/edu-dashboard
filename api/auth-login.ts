// api/auth-login.ts
// Handler for GET /api/auth/login - initiates Google OAuth flow

import { defineEventHandler, getHeader, sendRedirect } from 'h3';

export default defineEventHandler(async (event) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.ITSALIVE_URL}/api/auth-callback`;
  
  if (!clientId) {
    return { error: 'GOOGLE_CLIENT_ID not configured' };
  }

  const scope = encodeURIComponent([
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' '));

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline`;

  return sendRedirect(event, authUrl);
});
