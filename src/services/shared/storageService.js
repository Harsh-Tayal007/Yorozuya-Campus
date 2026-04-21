import { getFileViewUrl, getFileDownloadUrl } from "@/services/shared/storageAdapter"

/**
 * Get a URL for viewing a PDF in the browser.
 * Supports both Appwrite and Cloudflare R2 via the adapter.
 *
 * @param {string} fileId
 * @param {string} [storageProvider] - "appwrite" | "cloudflare" (default: "appwrite")
 * @param {"pyq" | "resource" | "syllabus"} [type] - R2 key prefix (required for cloudflare)
 * @param {string} [bucketId] - Appwrite bucket ID (falls back to default)
 */
export const getPdfViewUrl = (fileId, storageProvider, type, bucketId) => {
  return getFileViewUrl(fileId, storageProvider, type, bucketId)
}

/**
 * Get a URL for downloading a PDF.
 */
export const getPdfDownloadUrl = (fileId, storageProvider, type, bucketId) => {
  return getFileDownloadUrl(fileId, storageProvider, type, bucketId)
}
