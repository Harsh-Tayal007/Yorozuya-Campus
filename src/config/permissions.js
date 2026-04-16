// src/config/permissions.js

export const PERMISSIONS = {
  // ─── Admin access ────────────────────────────────────────────────────────
  VIEW_ADMIN_DASHBOARD: "view:admin-dashboard",

  // ─── Universities ────────────────────────────────────────────────────────
  VIEW_UNIVERSITIES:         "view:universities",
  MANAGE_UNIVERSITIES:       "manage:universities",
  DELETE_UNIVERSITY:         "delete:university",

  // ─── Programs ────────────────────────────────────────────────────────────
  VIEW_PROGRAMS:             "view:programs",
  MANAGE_PROGRAMS:           "manage:programs",
  DELETE_PROGRAM:            "delete:program",

  // ─── Branches ────────────────────────────────────────────────────────────
  MANAGE_BRANCHES:           "manage:branches",
  DELETE_BRANCH:             "delete:branch",

  // ─── Syllabus ────────────────────────────────────────────────────────────
  VIEW_SYLLABUS:             "view:syllabus",
  MANAGE_SYLLABUS:           "manage:syllabus",
  DELETE_SYLLABUS:           "delete:syllabus",

  // ─── Units ───────────────────────────────────────────────────────────────
  VIEW_UNITS:                "view:units",
  MANAGE_UNITS:              "manage:units",

  // ─── Resources ───────────────────────────────────────────────────────────
  VIEW_RESOURCES:            "view:resources",
  MANAGE_RESOURCES:          "manage:resources",

  // ─── PYQs ────────────────────────────────────────────────────────────────
  VIEW_PYQS:                 "view:pyqs",
  MANAGE_PYQS:               "manage:pyqs",

  // ─── Users ───────────────────────────────────────────────────────────────
  MANAGE_USERS:              "manage:users",
  DELETE_USER:               "delete:user",

  // ─── Moderation ──────────────────────────────────────────────────────────
  VIEW_REPORTS:              "view:reports",
  RESOLVE_REPORTS:           "resolve:reports",
  BAN_USER:                  "ban:user",
  UNBAN_USER:                "unban:user",
  PERMANENT_BAN_USER:        "ban:user-permanent",
  DELETE_REPORTS:            "delete:reports",
  BULK_DELETE_REPORTS:       "delete:reports-bulk",

  // ─── Audit / Activity ────────────────────────────────────────────────────
  VIEW_ACTIVITY_LOG:         "view:activity-log",

  // ─── Forum ───────────────────────────────────────────────────────────────
  PIN_REPLY:                 "pin:reply",

  // ─── Attendance ──────────────────────────────────────────────────────────
  MANAGE_CLASSES:              "manage:classes",
  CREATE_ATTENDANCE_SESSION:   "create:attendance-session",
  MARK_ATTENDANCE:             "mark:attendance",
  VIEW_ATTENDANCE_REPORTS:     "view:attendance-reports",

  // ─── Owner-only gates ────────────────────────────────────────────────────
  OWNER_ACTIONS:             "owner:actions",

  // ───Contact Messages ────────────────────────────────────────────────────
  VIEW_CONTACT_MESSAGES: "view_contact_messages",
}


export const ROLE_PERMISSIONS = {
  owner: Object.values(PERMISSIONS),

  admin: [
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_UNIVERSITIES,
    PERMISSIONS.MANAGE_UNIVERSITIES,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.VIEW_SYLLABUS,
    PERMISSIONS.MANAGE_SYLLABUS,
    PERMISSIONS.VIEW_UNITS,
    PERMISSIONS.MANAGE_UNITS,
    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.MANAGE_RESOURCES,
    PERMISSIONS.VIEW_PYQS,
    PERMISSIONS.MANAGE_PYQS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.RESOLVE_REPORTS,
    PERMISSIONS.BAN_USER,
    PERMISSIONS.UNBAN_USER,
    PERMISSIONS.PERMANENT_BAN_USER,
    PERMISSIONS.DELETE_REPORTS,
    PERMISSIONS.VIEW_ACTIVITY_LOG,
    PERMISSIONS.PIN_REPLY,
    // Attendance — admin has full oversight
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.CREATE_ATTENDANCE_SESSION,
    PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
    PERMISSIONS.VIEW_CONTACT_MESSAGES,
  ],

  moderator: [
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_UNITS,
    PERMISSIONS.MANAGE_UNITS,
    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.MANAGE_RESOURCES,
    PERMISSIONS.VIEW_PYQS,
    PERMISSIONS.MANAGE_PYQS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.RESOLVE_REPORTS,
    PERMISSIONS.BAN_USER,
    PERMISSIONS.UNBAN_USER,
    PERMISSIONS.VIEW_ACTIVITY_LOG,
    PERMISSIONS.PIN_REPLY,
  ],

  editor: [
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.MANAGE_RESOURCES,
    PERMISSIONS.VIEW_PYQS,
    PERMISSIONS.MANAGE_PYQS,
  ],

  // ─── Teacher ─────────────────────────────────────────────────────────────
  teacher: [
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.CREATE_ATTENDANCE_SESSION,
    PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
  ],

  // ─── Student / default user ───────────────────────────────────────────────
  user: [
    PERMISSIONS.MARK_ATTENDANCE,
  ],
}

export const canPermanentBan = (role) =>
  ROLE_PERMISSIONS[role]?.includes(PERMISSIONS.PERMANENT_BAN_USER) ?? false

export const isOwnerRole = (role) => role === "owner"