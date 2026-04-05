# Unizuya - Pending Tasks

## Attendance System

### Security
- [ ] Rate limiting on token submission via Cloudflare Worker
  - Add a new `/attendance/mark` endpoint to the existing push Worker
    (or a dedicated attendance Worker)
  - On each mark attempt, check KV key `ratelimit:{studentId}:{sessionId}`
  - Allow max 5 attempts per student per session, then return 429
  - On success, proxy the mark call to Appwrite using the Appwrite API key
    stored as a Worker secret
  - Update frontend to call Worker endpoint instead of Appwrite directly
  - Appwrite API key must be added as a Worker secret via Cloudflare dashboard

### Minor Polish
- [ ] Improve error message when teacher starts session on inactive class
  - Current: generic toast from service error
  - Target: friendly inline message explaining how to reactivate
- [ ] Show live active session count in Admin Attendance overview
  - Currently hardcoded to 0
  - Needs Appwrite Realtime subscription on sessions collection in AdminAttendance

## Other Features
<!-- Add future feature TODOs here -->
