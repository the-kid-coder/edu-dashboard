// api/courses.ts
// Handler for GET /api/courses - fetch user's courses from Google Classroom

import { defineEventHandler, getQuery } from 'h3';
import axios from 'axios';

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
    const accessToken = session.accessToken;

    // Fetch courses from Google Classroom API
    const response = await axios.get('https://classroom.googleapis.com/v1/courses', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { pageSize: 10 }
    });

    return response.data.courses || [];
  } catch (error: any) {
    console.error('Error fetching courses:', error.message);
    return { error: 'Failed to fetch courses', details: error.message };
  }
});
