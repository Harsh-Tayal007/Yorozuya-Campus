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

## Teacher Authentication Workflow
- [x] Add `accountType` attribute (string, default "student") to the `users` collection in Appwrite.
- [x] Implement Role Selection Gateway logic on `/login` and `/signup` routes via URL parameters (`?role=teacher`).
  - If no param exists, display a selection popup: "Are you a Student or Teacher?".
- [x] Update `Login.jsx` & `Signup.jsx` layouts for teacher contexts based on the URL parameter.
- [x] Update `AcademicStep.jsx` to hide `Program` and `Branch` details if registering as a teacher.
- [x] Modify `AuthContext.completeSignup` to accept `accountType` and map it during user document creation.
- [x] Add UI warning stating teacher accounts remain as standard users until upgraded by an Administrator.
- [x] Validate manual upgrade workflow for teachers on the Admin Roles page.

## Other Features
<!-- Add future feature TODOs here -->

## Future TODO
- [ ] Add teacher-specific dashboard with attendance widgets (option 2)
