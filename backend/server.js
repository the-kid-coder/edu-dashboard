require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth-callback'
);

// Store tokens in memory (in production, use a database)
const tokenStore = {};

// ============= OAuth Endpoints =============

app.get('/api/auth-login', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
  res.redirect(authUrl);
});

app.get('/api/auth-callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store token by a session ID or user identifier
    const sessionId = `session_${Date.now()}`;
    tokenStore[sessionId] = tokens;

    // Get user info to display
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Redirect back to frontend with session token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    res.redirect(`${frontendUrl}?sessionToken=${sessionId}&user=${encodeURIComponent(JSON.stringify(userInfo.data))}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

app.post('/api/auth-verify', (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken || !tokenStore[sessionToken]) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  res.json({ valid: true, sessionToken });
});

// ============= Classroom API Endpoints =============

// Middleware to verify and set credentials
const authenticateToken = (req, res, next) => {
  const { sessionToken } = req.query;
  if (!sessionToken || !tokenStore[sessionToken]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  oauth2Client.setCredentials(tokenStore[sessionToken]);
  next();
};

// GET /api/courses - List all courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const response = await classroom.courses.list({ pageSize: 10 });
    res.json(response.data.courses || []);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
});

// GET /api/coursework - List assignments for a course
app.get('/api/coursework', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    
    const response = await classroom.courses.courseWork.list({
      courseId,
      pageSize: 20,
      orderBy: 'dueDate'
    });
    
    const courseWork = response.data.courseWork || [];
    
    // Fetch student submissions for each assignment
    const enriched = await Promise.all(
      courseWork.map(async (work) => {
        try {
          const subResponse = await classroom.courses.courseWork.studentSubmissions.list({
            courseId,
            courseWorkId: work.id,
            pageSize: 1
          });
          const submission = subResponse.data.studentSubmissions?.[0];
          return {
            ...work,
            studentSubmission: submission
          };
        } catch (e) {
          console.warn(`Could not fetch submission for work ${work.id}:`, e.message);
          return work;
        }
      })
    );
    
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching coursework:', error);
    res.status(500).json({ error: 'Failed to fetch assignments', details: error.message });
  }
});

// GET /api/me - Get current user profile
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    res.json(userInfo.data);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user info', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`   Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env`);
});
