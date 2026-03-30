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