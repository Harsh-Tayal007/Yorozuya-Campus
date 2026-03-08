// src/config/permissions.js

export const PERMISSIONS = {
  // 🧭 Admin access
  VIEW_ADMIN_DASHBOARD: "view:admin-dashboard",

  // 🏫 Universities
  VIEW_UNIVERSITIES: "view:universities",
  MANAGE_UNIVERSITIES: "manage:universities",

  // 🎓 Programs
  VIEW_PROGRAMS: "view:programs",
  MANAGE_PROGRAMS: "manage:programs",

  // 📘 Syllabus
  VIEW_SYLLABUS: "view:syllabus",
  MANAGE_SYLLABUS: "manage:syllabus",

  // 🧩 Units
  VIEW_UNITS: "view:units",
  MANAGE_UNITS: "manage:units",

  // 📂 Resources
  VIEW_RESOURCES: "view:resources",
  MANAGE_RESOURCES: "manage:resources",

  // 📄 PYQs
  VIEW_PYQS: "view:pyqs",
  MANAGE_PYQS: "manage:pyqs",

  // 👤 Users
  MANAGE_USERS: "manage:users",

  // 🕒 Audit / Activity
  VIEW_ACTIVITY_LOG: "view:activity-log",

  // 📌 Forum
  PIN_REPLY: "pin:reply",
}


export const ROLE_PERMISSIONS = {
  /** 🔴 Full control */
  admin: [
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,

    PERMISSIONS.VIEW_UNIVERSITIES,
    PERMISSIONS.MANAGE_UNIVERSITIES,

    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_PROGRAMS,

    PERMISSIONS.VIEW_SYLLABUS,
    PERMISSIONS.MANAGE_SYLLABUS,

    PERMISSIONS.VIEW_UNITS,
    PERMISSIONS.MANAGE_UNITS,

    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.MANAGE_RESOURCES,

    PERMISSIONS.VIEW_PYQS,
    PERMISSIONS.MANAGE_PYQS,

    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ACTIVITY_LOG,

    PERMISSIONS.PIN_REPLY,        // ← admin can pin
  ],

  /** 🟠 Limited admin */
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

    PERMISSIONS.VIEW_ACTIVITY_LOG,

    PERMISSIONS.PIN_REPLY,        // ← moderator can pin
  ],

  /** 🟡 Content editor */
  editor: [
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,

    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.MANAGE_RESOURCES,

    PERMISSIONS.VIEW_PYQS,
    PERMISSIONS.MANAGE_PYQS,
    // ← editor cannot pin
  ],

  /** 🔵 Normal user */
  user: [
    // ← user cannot pin (OP check is separate, done at component level)
  ],
}