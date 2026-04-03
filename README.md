# Unizuya

Unizuya is an all in one campus platform designed to simplify student life.  
It combines attendance tracking, study resources, discussions, and productivity tools into a single web app.

🌐 Live: https://unizuya.in

---

## Overview

Unizuya aims to solve common problems faced by students and teachers in colleges by bringing everything into one place.

Instead of using multiple tools for attendance, notes, discussions, and planning, Unizuya provides a unified platform that is simple and efficient.

---

## Features

- Attendance management system for students and teachers  
- Study resources including notes, syllabus, and previous year questions  
- Student discussion forum with threaded conversations  
- Personal dashboard with academic insights  
- CGPA and grade calculator  
- Study planner and task tracking  
- Timetable builder  
- Bookmarking and saved content  
- Notifications and updates system  

---

## Upcoming Features

- Direct messages and group chats  
- AI powered study assistant  
- Collaborative notes  
- Improved PWA experience (mobile support)  

---

## Tech Stack

- React  
- Vite  
- Appwrite  
- Vercel  

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Harsh-Tayal007/Yorozuya-Campus.git
cd Yorozuya-Campus
```
---

Environment setup:
> Create a `.env` file in the root directory and add the following variables.
> Do not commit your `.env` file to version control.

```env
VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id

VITE_APPWRITE_SYLLABUS_COLLECTION_ID=your_syllabus_collection_id
VITE_APPWRITE_UNITS_COLLECTION_ID=your_units_collection_id
VITE_APPWRITE_RESOURCES_COLLECTION_ID=your_resources_collection_id
VITE_APPWRITE_ACTIVITIES_COLLECTION_ID=your_activities_collection_id
VITE_APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID=your_universities_collection_id
VITE_APPWRITE_PROGRAMS_COLLECTION_ID=your_programs_collection_id
VITE_APPWRITE_PYQS_COLLECTION_ID=your_pyqs_collection_id
VITE_APPWRITE_SUBJECTS_COLLECTION_ID=your_subjects_collection_id
VITE_APPWRITE_BRANCHES_COLLECTION_ID=your_branches_collection_id

VITE_APPWRITE_STORAGE_BUCKET_ID=your_storage_bucket_id

VITE_APPWRITE_THREADS_COLLECTION_ID=your_threads_collection_id
VITE_APPWRITE_REPLIES_COLLECTION_ID=your_replies_collection_id
VITE_APPWRITE_VOTES_COLLECTION_ID=your_votes_collection_id

VITE_GIPHY_KEY=your_giphy_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

VITE_RESEND_API_KEY=your_resend_api_key

VITE_APPWRITE_RECOVERY_FUNCTION_ID=your_recovery_function_id

VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID=your_notifications_collection_id

VITE_NOTICES_WORKER_URL=your_notices_worker_url

VITE_GEMINI_API_KEY=your_gemini_api_key

VITE_APPWRITE_TASKS_COLLECTION_ID=your_tasks_collection_id

VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_PUSH_WORKER_URL=your_push_worker_url
VITE_FLUSH_SECRET=your_flush_secret

VITE_APPWRITE_TIMETABLES_COLLECTION_ID=your_timetables_collection_id

VITE_APPWRITE_REPORTS_COLLECTION_ID=your_reports_collection_id
VITE_APPWRITE_BANS_COLLECTION_ID=your_bans_collection_id

VITE_APPWRITE_UPDATE_LOGS_COLLECTION_ID=your_update_logs_collection_id

VITE_APPWRITE_PUSH_SUBSCRIPTIONS_COLLECTION_ID=your_push_subscriptions_collection_id

VITE_APPWRITE_CLASSES_COLLECTION_ID=your_classes_collection_id
VITE_APPWRITE_ENROLLMENTS_COLLECTION_ID=your_enrollments_collection_id
VITE_APPWRITE_SESSIONS_COLLECTION_ID=your_sessions_collection_id
VITE_APPWRITE_ATTENDANCE_RECORDS_COLLECTION_ID=your_attendance_records_collection_id

VITE_APPWRITE_SESSION_TOKENS_COLLECTION_ID=your_session_tokens_collection_id

VITE_DELETE_ACCOUNT_WORKER_URL=your_delete_account_worker_url
```
---

Install dependencies:

```bash
npm install
```
---

Run the development server:

```bash
npm run dev
```
---

# Project Vision

The goal of Unizuya is to become a complete digital campus platform where students can manage academics, collaborate, and stay organized without switching between multiple apps.

---

# Contributing

Contributions are welcome.
If you have ideas, improvements, or bug fixes, feel free to open an issue or submit a pull request.

---

# Author

Harsh Tayal
