// api/coursework.ts
// Handler for GET /api/coursework - fetch assignments for a course

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
  const courseId = query.courseId as string;

  if (!sessionToken || !courseId) {
    return { error: 'Missing sessionToken or courseId' };
  }

  try {
    const session = decodeSession(sessionToken);
    const accessToken = session.accessToken;

    // Fetch course work
    const workResponse = await axios.get(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { pageSize: 20, orderBy: 'dueDate' }
      }
    );

    const courseWork = workResponse.data.courseWork || [];

    // Fetch student submissions for each assignment
    const enriched = await Promise.all(
      courseWork.map(async (work) => {
        try {
          const subResponse = await axios.get(
            `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${work.id}/studentSubmissions`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              params: { pageSize: 1 }
            }
          );
          const submission = subResponse.data.studentSubmissions?.[0];
          return { ...work, studentSubmission: submission };
        } catch (e) {
          console.warn(`Could not fetch submission for work ${work.id}`);
          return work;
        }
      })
    );

    return enriched;
  } catch (error: any) {
    console.error('Error fetching coursework:', error.message);
    return { error: 'Failed to fetch assignments', details: error.message };
  }
});
