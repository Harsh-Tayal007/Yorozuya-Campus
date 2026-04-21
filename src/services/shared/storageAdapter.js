/**
 * storageAdapter.js
 *
 * Central abstraction layer for dual-storage (Appwrite + Cloudflare R2).
 * Routes upload / delete / view / download / metadata calls to the correct
 * backend based on the `storageProvider` field.
 *
 * - storageProvider = "appwrite"   → Appwrite SDK (existing behavior)
 * - storageProvider = "cloudflare" → unizuya-storage Cloudflare Worker
 * - storageProvider = undefined    → defaults to "appwrite" (backward compat)
 */

import { storage, ID } from "@/lib/appwrite"
import {
  getStorageConfig,
  getWorkerUrl,
  getStorageSecret,
} from "./storageConfigService"

const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

// ── Helpers ─────────────────────────────────────────────────────────────────
function resolveProvider(storageProvider) {
  return storageProvider || "appwrite"
}

function authedHeaders() {
  return {
    Authorization: `Bearer ${getStorageSecret()}`,
  }
}

// ── Get Active Storage ──────────────────────────────────────────────────────
/**
 * Get the currently active storage provider.
 * @returns {Promise<"appwrite" | "cloudflare">}
 */
export async function getActiveStorage() {
  const config = await getStorageConfig()
  return config.activeStorage
}

// ── Upload ──────────────────────────────────────────────────────────────────
/**
 * Upload a file to the currently active storage.
 *
 * @param {File} file — the File object to upload
 * @param {"pyq" | "resource" | "syllabus"} type — content type for R2 key prefix
 * @returns {Promise<{ fileId: string, storageProvider: "appwrite" | "cloudflare", bucketId?: string }>}
 */
export async function uploadFile(file, type) {
  const activeStorage = await getActiveStorage()

  if (activeStorage === "cloudflare") {
    return _uploadToCloudflare(file, type)
  }
  return _uploadToAppwrite(file)
}

async function _uploadToAppwrite(file) {
  const result = await storage.createFile(APPWRITE_BUCKET_ID, ID.unique(), file)
  return {
    fileId: result.$id,
    storageProvider: "appwrite",
    bucketId: APPWRITE_BUCKET_ID,
  }
}

async function _uploadToCloudflare(file, type) {
  const fileId = ID.unique()
  const key = `${type}/${fileId}`
  const workerUrl = getWorkerUrl()

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${workerUrl}/upload?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: authedHeaders(),
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Cloudflare upload failed: ${res.status}`)
  }

  return {
    fileId,
    storageProvider: "cloudflare",
    // No bucketId for cloudflare — the worker knows the bucket
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────
/**
 * Delete a file from the correct storage backend.
 * Uses the storageProvider from the document, NOT the current toggle.
 *
 * @param {string} fileId
 * @param {string} storageProvider — "appwrite" | "cloudflare" | undefined
 * @param {"pyq" | "resource" | "syllabus"} type — for R2 key prefix
 * @param {string} [bucketId] — Appwrite bucket ID (falls back to default)
 */
export async function deleteFile(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    return _deleteFromCloudflare(fileId, type)
  }
  return _deleteFromAppwrite(fileId, bucketId)
}

async function _deleteFromAppwrite(fileId, bucketId) {
  try {
    await storage.deleteFile(bucketId || APPWRITE_BUCKET_ID, fileId)
  } catch (err) {
    // Swallow "file not found" errors — file may already be deleted
    if (err?.code === 404 || err?.message?.includes("not found")) {
      console.warn(`File ${fileId} not found in Appwrite, skipping delete.`)
      return
    }
    throw err
  }
}

async function _deleteFromCloudflare(fileId, type) {
  const workerUrl = getWorkerUrl()
  const res = await fetch(`${workerUrl}/file/${type}/${fileId}`, {
    method: "DELETE",
    headers: authedHeaders(),
  })

  if (!res.ok && res.status !== 404) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Cloudflare delete failed: ${res.status}`)
  }
  // 404 is fine — R2 deletes are idempotent
}

// ── View URL ────────────────────────────────────────────────────────────────
/**
 * Get the URL for viewing/rendering a file in the browser.
 *
 * @param {string} fileId
 * @param {string} storageProvider — "appwrite" | "cloudflare" | undefined
 * @param {"pyq" | "resource" | "syllabus"} type — for R2 key prefix
 * @param {string} [bucketId] — Appwrite bucket ID (falls back to default)
 * @returns {string}
 */
export function getFileViewUrl(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    return `${getWorkerUrl()}/file/${type}/${fileId}`
  }
  return storage.getFileView(bucketId || APPWRITE_BUCKET_ID, fileId)
}

// ── Download URL ────────────────────────────────────────────────────────────
/**
 * Get the URL for downloading a file.
 *
 * @param {string} fileId
 * @param {string} storageProvider
 * @param {"pyq" | "resource" | "syllabus"} type
 * @param {string} [bucketId]
 * @returns {string}
 */
export function getFileDownloadUrl(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    // R2 Worker serves the file directly — same URL works for download
    return `${getWorkerUrl()}/file/${type}/${fileId}`
  }
  return storage.getFileDownload(bucketId || APPWRITE_BUCKET_ID, fileId)
}

// ── File Metadata ───────────────────────────────────────────────────────────
/**
 * Get file metadata (size, etc).
 *
 * @param {string} fileId
 * @param {string} storageProvider
 * @param {"pyq" | "resource" | "syllabus"} type
 * @param {string} [bucketId]
 * @returns {Promise<{ size: number }>}
 */
export async function getFileMetadata(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    const workerUrl = getWorkerUrl()
    const res = await fetch(`${workerUrl}/file-meta/${type}/${fileId}`, {
      headers: authedHeaders(),
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch file metadata: ${res.status}`)
    }

    const data = await res.json()
    return { size: data.size }
  }

  // Appwrite
  const file = await storage.getFile(bucketId || APPWRITE_BUCKET_ID, fileId)
  return { size: file.sizeOriginal }
}

// ── Appwrite Usage (for AdminStats) ─────────────────────────────────────────
/**
 * Calculate total Appwrite storage usage by paginating all files.
 * @returns {Promise<{ totalSize: number, fileCount: number }>}
 */
export async function getAppwriteUsage() {
  const { Query } = await import("appwrite")
  let totalSize = 0
  let fileCount = 0
  let offset = 0
  const BATCH_SIZE = 100

  while (true) {
    const batch = await storage.listFiles(APPWRITE_BUCKET_ID, [
      Query.limit(BATCH_SIZE),
      Query.offset(offset),
    ])

    for (const f of batch.files) {
      totalSize += f.sizeOriginal
      fileCount++
    }

    if (batch.files.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  return { totalSize, fileCount }
}

// ── R2 Usage (for AdminStats) ───────────────────────────────────────────────
/**
 * Get Cloudflare R2 storage usage from the Worker.
 * @returns {Promise<{ totalSize: number, fileCount: number }>}
 */
export async function getCloudflareUsage() {
  const workerUrl = getWorkerUrl()
  const res = await fetch(`${workerUrl}/usage`, {
    headers: authedHeaders(),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch R2 usage: ${res.status}`)
  }

  return res.json()
}
