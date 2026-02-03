// api/auth-callback.ts
// Handler for GET /api/auth-callback - handles Google OAuth callback

import { defineEventHandler, getQuery, readBody, sendRedirect } from 'h3';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;
  const error = query.error as string;

  if (error) {
    return { error: `OAuth error: ${error}` };
  }

  if (!code) {
    return { error: 'Missing authorization code' };
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.ITSALIVE_URL}/api/auth-callback`;

    if (!clientId || !clientSecret) {
      return { error: 'OAuth credentials not configured' };
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;

    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = userResponse.data;

    // Store in database (using itsalive.co database)
    // For now, we'll encode tokens in the response
    const sessionToken = Buffer.from(JSON.stringify({
      accessToken,
      refreshToken,
      user: userData,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    })).toString('base64');

    // Redirect back to frontend with session token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    const redirectUrl = `${frontendUrl}?sessionToken=${sessionToken}&user=${encodeURIComponent(JSON.stringify(userData))}`;

    return sendRedirect(event, redirectUrl);
  } catch (error: any) {
    console.error('OAuth callback error:', error.message);
    return { error: 'Authentication failed', details: error.message };
  }
});
