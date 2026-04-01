// src/services/moderation/reportService.js
import { databases, ID, Query } from "@/lib/appwrite"

const DATABASE_ID  = import.meta.env.VITE_APPWRITE_DATABASE_ID
const REPORTS_COL  = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID

export const REPORT_REASONS = [
  "Harassment or bullying",
  "Hate speech",
  "Explicit or NSFW content",
  "Spam or self-promotion",
  "Misinformation",
  "Abusing Gemini tokens / exploits",
  "Impersonation",
  "Other",
]

/**
 * Submit a report on a reply, thread, or user.
 */
export async function createReport({
  reporterId,
  reporterUsername,
  targetType,        // 'reply' | 'thread' | 'user'
  targetId,
  targetAuthorId,
  targetAuthorUsername,
  reason,
  details       = null,
  contentPreview = null,
  threadId      = null,
}) {
  // Prevent duplicate pending reports from same reporter on same target
  const existing = await databases.listDocuments(DATABASE_ID, REPORTS_COL, [
    Query.equal("reporterId", reporterId),
    Query.equal("targetId", targetId),
    Query.equal("status", "pending"),
    Query.limit(1),
  ])
  if (existing.total > 0) {
    throw new Error("You have already reported this content.")
  }

  return databases.createDocument(DATABASE_ID, REPORTS_COL, ID.unique(), {
    reporterId,
    reporterUsername,
    targetType,
    targetId,
    targetAuthorId,
    targetAuthorUsername,
    reason,
    details,
    contentPreview,
    threadId,
    status: "pending",
    resolvedBy: null,
    resolvedAt: null,
    resolution: null,
  })
}

/**
 * List reports for admin panel.
 * @param {'pending'|'resolved'|'dismissed'|null} status - null = all
 */
export async function listReports({ status = "pending", limit = 50, offset = 0 } = {}) {
  const filters = []
  if (status) filters.push(Query.equal("status", status))

  const res = await databases.listDocuments(DATABASE_ID, REPORTS_COL, [
    ...filters,
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ])
  return { reports: res.documents, total: res.total }
}

/**
 * Resolve a report (mark as resolved or dismissed).
 */
export async function resolveReport({ reportId, resolvedBy, resolution, dismiss = false }) {
  return databases.updateDocument(DATABASE_ID, REPORTS_COL, reportId, {
    status:     dismiss ? "dismissed" : "resolved",
    resolvedBy,
    resolvedAt: new Date().toISOString(),
    resolution,
  })
}

/**
 * Get count of pending reports (for admin badge).
 */
export async function getPendingReportCount() {
  const res = await databases.listDocuments(DATABASE_ID, REPORTS_COL, [
    Query.equal("status", "pending"),
    Query.limit(1),
  ])
  return res.total
}

/**
 * Report a broken/404 URL. Works for both logged-in and anonymous users.
 */
export async function reportBrokenLink({ url, reporterId = "anonymous", reporterUsername = "anonymous" }) {
  // Dedup: don't create another pending report for the same URL from same reporter
  const existing = await databases.listDocuments(DATABASE_ID, REPORTS_COL, [
    Query.equal("reporterId", reporterId),
    Query.equal("targetType", "broken_link"),
    Query.equal("targetId", url),
    Query.equal("status", "pending"),
    Query.limit(1),
  ])
  if (existing.total > 0) return // silently skip, don't throw

  return databases.createDocument(DATABASE_ID, REPORTS_COL, ID.unique(), {
    reporterId,
    reporterUsername,
    targetType:           "broken_link",
    targetId:             url,           // full URL as the unique key
    targetAuthorId:       "system",
    targetAuthorUsername: "system",
    reason:               "Broken link",
    details:              null,
    contentPreview:       url,           // shown in admin panel as preview
    threadId:             null,
    status:               "pending",
    resolvedBy:           null,
    resolvedAt:           null,
    resolution:           null,
  })
}

/**
 * Hard-delete a single report document from the database.
 * Requires DELETE_REPORTS permission (admin + owner).
 */
export async function deleteReport(reportId) {
  return databases.deleteDocument(DATABASE_ID, REPORTS_COL, reportId)
}

/**
 * Bulk-delete an array of report IDs.
 * Appwrite has no batch delete, so we fire all deletes in parallel.
 * Requires BULK_DELETE_REPORTS permission (owner only).
 *
 * @param {string[]} reportIds
 */
export async function bulkDeleteReports(reportIds) {
  if (!reportIds?.length) return
  await Promise.all(
    reportIds.map(id => databases.deleteDocument(DATABASE_ID, REPORTS_COL, id))
  )
}