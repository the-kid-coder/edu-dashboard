# Edu Dashboard Backend

Express backend for Google Classroom API integration with OAuth 2.0 authentication.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Google OAuth credentials:
     ```
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-client-secret
     GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
     FRONTEND_URL=http://localhost:8000
     PORT=3001
     ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3001`

## Endpoints

### Authentication
- `GET /auth/login` - Initiates Google OAuth flow
- `GET /auth/callback` - Handles OAuth callback (redirects to frontend with sessionToken)
- `POST /auth/verify` - Verifies a session token

### Classroom API (all require `?sessionToken=<token>`)
- `GET /api/courses` - List user's courses
- `GET /api/courses/:courseId/work` - List assignments in a course
- `GET /api/me` - Get authenticated user profile

### Health
- `GET /health` - Server health check

## Frontend Integration

After OAuth login, the frontend will receive:
- `sessionToken` - Use this in all API calls
- `user` - User info (name, email, picture)

Example frontend call:
```javascript
fetch(`http://localhost:3001/api/courses?sessionToken=${sessionToken}`)
  .then(r => r.json())
  .then(courses => console.log(courses));
```

## Environment Variables (.env)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL (must match Cloud Console) |
| `FRONTEND_URL` | Frontend URL for redirect after auth |
| `PORT` | Server port (default: 3001) |

## Notes

- Tokens are stored in memory; use a database for production
- CORS is enabled for local development
- Scopes include read-only access to courses, coursework, and submissions
