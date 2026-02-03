// api/me.ts
// Handler for GET /api/me - get current user profile

import { defineEventHandler, getQuery } from 'h3';

interface SessionData {
  accessToken: string;
  refreshToken?: string;
  user: any;
  expiresAt: string;
}

function decodeSession(token: string): SessionData {
  return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const sessionToken = query.sessionToken as string;

  if (!sessionToken) {
    return { error: 'Unauthorized' };
  }

  try {
    const session = decodeSession(sessionToken);
    return session.user;
  } catch (error: any) {
    console.error('Error getting user:', error.message);
    return { error: 'Failed to fetch user info' };
  }
});
