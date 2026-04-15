// src/services/updateLogsService.js
import { databases, ID } from "@/lib/appwrite"
import { Query } from "appwrite"

const DB   = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COL  = import.meta.env.VITE_APPWRITE_UPDATE_LOGS_COLLECTION_ID

function parseVersionParts(version = "") {
  return String(version)
    .trim()
    .replace(/^v/i, "")
    .split(/[.\-_]/)
    .map(part => {
      const n = Number(part)
      return Number.isNaN(n) ? part.toLowerCase() : n
    })
}

function compareVersionsDesc(aVersion = "", bVersion = "") {
  const a = parseVersionParts(aVersion)
  const b = parseVersionParts(bVersion)
  const len = Math.max(a.length, b.length)

  for (let i = 0; i < len; i += 1) {
    const aPart = a[i] ?? 0
    const bPart = b[i] ?? 0
    if (aPart === bPart) continue
    if (typeof aPart === "number" && typeof bPart === "number") return bPart - aPart
    return String(bPart).localeCompare(String(aPart))
  }
  return 0
}

export function sortUpdateLogs(logs = []) {
  return [...logs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1

    const versionDiff = compareVersionsDesc(a.version, b.version)
    if (versionDiff !== 0) return versionDiff

    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
  })
}

export const updateLogsService = {
  list: (onlyPublished = false) => {
    const queries = [Query.orderDesc("publishedAt"), Query.limit(50)]
    if (onlyPublished) queries.push(Query.equal("isPublished", true))
    return databases.listDocuments(DB, COL, queries)
  },

  create: (data) =>
    databases.createDocument(DB, COL, ID.unique(), data),

  update: (id, data) =>
    databases.updateDocument(DB, COL, id, data),

  delete: (id) =>
    databases.deleteDocument(DB, COL, id),
}
