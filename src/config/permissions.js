// src/config/permissions.js

export const PERMISSIONS = {
  // ─── Admin access ────────────────────────────────────────────────────────
  VIEW_ADMIN_DASHBOARD: "view:admin-dashboard",

  // ─── Universities ────────────────────────────────────────────────────────
  VIEW_UNIVERSITIES:         "view:universities",
  MANAGE_UNIVERSITIES:       "manage:universities",
  /** Requires owner confirmation key — permanent deletion */
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
  /** Only owner can permanently delete a user account */
  DELETE_USER:               "delete:user",

  // ─── Moderation ──────────────────────────────────────────────────────────
  VIEW_REPORTS:              "view:reports",
  RESOLVE_REPORTS:           "resolve:reports",
  BAN_USER:                  "ban:user",
  UNBAN_USER:                "unban:user",
  /** Permanent ban — owner only */
  PERMANENT_BAN_USER:        "ban:user-permanent",

  // ─── Audit / Activity ────────────────────────────────────────────────────
  VIEW_ACTIVITY_LOG:         "view:activity-log",

  // ─── Forum ───────────────────────────────────────────────────────────────
  PIN_REPLY:                 "pin:reply",

  // ─── Owner-only gates ────────────────────────────────────────────────────
  /** Master key actions — only the single platform owner */
  OWNER_ACTIONS:             "owner:actions",
}


export const ROLE_PERMISSIONS = {
  /**
   * 👑 OWNER — single platform owner, absolute control.
   * In future, destructive actions (delete university, delete user, etc.)
   * will additionally require a runtime confirmation key checked server-side.
   */
  owner: Object.values(PERMISSIONS),   // every permission automatically

  /**
   * 🔴 ADMIN — full operational control, no destructive deletes,
   * no owner-only gates.
   */
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

    // Moderation
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.RESOLVE_REPORTS,
    PERMISSIONS.BAN_USER,
    PERMISSIONS.UNBAN_USER,
    PERMISSIONS.PERMANENT_BAN_USER,

    PERMISSIONS.VIEW_ACTIVITY_LOG,

    PERMISSIONS.PIN_REPLY,
  ],

  /**
   * 🟠 MODERATOR — forum & content moderation, no structural changes.
   */
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

    // Moderation — can view & resolve reports, temp-ban only
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.RESOLVE_REPORTS,
    PERMISSIONS.BAN_USER,
    PERMISSIONS.UNBAN_USER,
    // ← no PERMANENT_BAN_USER

    PERMISSIONS.VIEW_ACTIVITY_LOG,

    PERMISSIONS.PIN_REPLY,
  ],

  /**
   * 🟡 EDITOR — upload content only, zero moderation.
   */
  editor: [
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,

    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.MANAGE_RESOURCES,

    PERMISSIONS.VIEW_PYQS,
    PERMISSIONS.MANAGE_PYQS,
  ],

  /**
   * 🔵 USER — no admin access.
   */
  user: [],
}

// ── Helper: check if a role can perform permanent bans ────────────────────────
export const canPermanentBan = (role) =>
  ROLE_PERMISSIONS[role]?.includes(PERMISSIONS.PERMANENT_BAN_USER) ?? false

// ── Helper: owner-only gate (for future confirmation-key flows) ───────────────
export const isOwnerRole = (role) => role === "owner"